import React, { useState, useMemo } from 'react';
import { Sale, CompanySettings } from '../types';
import { exportSalesReportToExcel, exportSalesReportToPDF } from '../utils/exportUtils';
import { 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  CreditCard, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  Search,
  Eye,
  Pill,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';

interface SalesDashboardProps {
  sales: Sale[];
  company: CompanySettings;
  onViewInvoice: (sale: Sale) => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  sales,
  company,
  onViewInvoice,
}) => {
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7days' | 'month' | 'all'>('today');
  const [searchFilter, setSearchFilter] = useState('');

  // Date filtering logic
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return sales.filter((sale) => {
      const saleDate = new Date(sale.dateStr);

      let inDate = true;
      if (dateRange === 'today') {
        inDate = sale.dateStr === todayStr;
      } else if (dateRange === 'yesterday') {
        inDate = sale.dateStr === yesterdayStr;
      } else if (dateRange === '7days') {
        inDate = saleDate >= sevenDaysAgo;
      } else if (dateRange === 'month') {
        inDate = saleDate >= firstDayOfMonth;
      }

      if (!inDate) return false;

      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        sale.invoiceNumber.toLowerCase().includes(q) ||
        sale.patientName.toLowerCase().includes(q) ||
        sale.patientPhone.includes(q) ||
        sale.items.some(i => i.name.toLowerCase().includes(q))
      );
    });
  }, [sales, dateRange, searchFilter]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.grandTotal, 0);
    const totalTaxable = filteredSales.reduce((acc, s) => acc + s.taxableSubtotal, 0);
    const totalGst = filteredSales.reduce((acc, s) => acc + s.totalGst, 0);
    const totalDiscount = filteredSales.reduce((acc, s) => acc + s.totalDiscount, 0);
    const invoiceCount = filteredSales.length;
    const avgOrderValue = invoiceCount > 0 ? Math.round(totalRevenue / invoiceCount) : 0;

    const cashTotal = filteredSales.filter(s => s.paymentMethod === 'CASH').reduce((a, b) => a + b.grandTotal, 0);
    const upiTotal = filteredSales.filter(s => s.paymentMethod === 'UPI').reduce((a, b) => a + b.grandTotal, 0);
    const cardTotal = filteredSales.filter(s => s.paymentMethod === 'CARD').reduce((a, b) => a + b.grandTotal, 0);
    const dueTotal = filteredSales.filter(s => s.paymentMethod === 'DUE').reduce((a, b) => a + b.grandTotal, 0);

    const totalMedicinesDispensed = filteredSales.reduce(
      (acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0), 0
    );

    // Remedy popularity map
    const remedyMap = new Map<string, { count: number; revenue: number }>();
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const key = `${item.name} (${item.potency})`;
        const current = remedyMap.get(key) || { count: 0, revenue: 0 };
        remedyMap.set(key, {
          count: current.count + item.quantity,
          revenue: current.revenue + item.totalAmount,
        });
      });
    });

    const topRemedies = Array.from(remedyMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRevenue,
      totalTaxable,
      totalGst,
      totalDiscount,
      invoiceCount,
      avgOrderValue,
      cashTotal,
      upiTotal,
      cardTotal,
      dueTotal,
      totalMedicinesDispensed,
      topRemedies,
    };
  }, [filteredSales]);

  // Hourly or transaction trend data points for SVG Chart
  const chartPoints = useMemo(() => {
    if (filteredSales.length === 0) return [];
    // Sort chronologically
    const sorted = [...filteredSales].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const points = sorted.map((s, idx) => ({
      label: s.timeStr || s.dateStr,
      amount: s.grandTotal,
      index: idx,
    }));
    return points;
  }, [filteredSales]);

  const maxChartAmount = Math.max(...chartPoints.map(p => p.amount), 500);

  const getRangeLabel = () => {
    switch (dateRange) {
      case 'today': return "Today's Sales";
      case 'yesterday': return "Yesterday's Sales";
      case '7days': return 'Last 7 Days';
      case 'month': return 'This Month';
      default: return 'All Recorded Sales';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header & Range Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>Clinic Daily Sales & Performance</span>
            <span className="text-xs font-normal text-stone-500">
              · {getRangeLabel()}
            </span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Financial metrics, tax collection, and homoeopathic remedy dispensations
          </p>
        </div>

        {/* Date Filter Tabs & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Segmented Date Picker */}
          <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: '7D' },
              { id: 'month', label: 'Month' },
              { id: 'all', label: 'All' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateRange(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  dateRange === tab.id
                    ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 font-semibold shadow-sm'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Export to Excel */}
          <button
            onClick={() => exportSalesReportToExcel(filteredSales, getRangeLabel(), company)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          {/* Export to PDF */}
          <button
            onClick={() => exportSalesReportToPDF(filteredSales, getRangeLabel(), company)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS (4 COLS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Revenue Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Gross Revenue</span>
            <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {company.currencySymbol}{metrics.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
            <span>Taxable: {company.currencySymbol}{metrics.totalTaxable.toFixed(2)}</span>
          </div>
        </div>

        {/* Total Invoices Issued */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Invoices Issued</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {metrics.invoiceCount}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Avg Ticket: <span className="font-mono font-medium">{company.currencySymbol}{metrics.avgOrderValue}</span>
          </div>
        </div>

        {/* GST Tax Collected */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>GST Collected</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {company.currencySymbol}{metrics.totalGst.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            CGST & SGST (50/50 split)
          </div>
        </div>

        {/* Medicines Dispensed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Units Dispensed</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {metrics.totalMedicinesDispensed}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Dilutions, MTs, Biochemics & Phials
          </div>
        </div>

      </div>

      {/* GRAPHICAL ILLUSTRATIONS & UI CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: INVOICE SALES TREND CURVE (8 COLS) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Revenue Inflow Curve
              </h3>
              <p className="text-xs text-stone-500">
                Sequential bill transaction values across period
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Invoice Value</span>
            </div>
          </div>

          {/* SVG Line / Bar Visualization */}
          <div className="h-52 w-full pt-4">
            {chartPoints.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                No billing data recorded for this time range
              </div>
            ) : (
              <div className="h-full flex flex-col justify-between">
                <div className="h-40 flex items-end gap-2 sm:gap-3 px-2 border-b border-stone-200 dark:border-stone-800">
                  {chartPoints.map((pt, idx) => {
                    const heightPercent = Math.max(15, Math.min(100, (pt.amount / maxChartAmount) * 100));
                    return (
                      <div 
                        key={idx} 
                        className="flex-1 flex flex-col items-center group relative h-full justify-end"
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute -top-8 bg-stone-900 text-white text-[10px] font-mono px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {company.currencySymbol}{pt.amount} ({pt.label})
                        </div>

                        {/* Bar */}
                        <div 
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-orange-600 to-amber-500 group-hover:from-orange-500 group-hover:to-amber-400 transition-all shadow-sm"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between text-[10px] font-mono text-stone-400 pt-2 px-1">
                  <span>Start: {chartPoints[0]?.label || '0'}</span>
                  <span>Latest: {chartPoints[chartPoints.length - 1]?.label || 'Now'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CHART 2: PAYMENT METHOD SHARE & BREAKDOWN (4 COLS) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Payment Collections Split
            </h3>
            <p className="text-xs text-stone-500">
              Cash tender vs Digital UPI & Card
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'UPI / QR Code', amount: metrics.upiTotal, color: 'bg-emerald-500', barBg: 'bg-emerald-100 dark:bg-emerald-950' },
              { label: 'Cash Counter', amount: metrics.cashTotal, color: 'bg-orange-500', barBg: 'bg-orange-100 dark:bg-orange-950' },
              { label: 'Card / POS Machine', amount: metrics.cardTotal, color: 'bg-blue-500', barBg: 'bg-blue-100 dark:bg-blue-950' },
              { label: 'Clinic Due / Credit', amount: metrics.dueTotal, color: 'bg-purple-500', barBg: 'bg-purple-100 dark:bg-purple-950' },
            ].map((mode, i) => {
              const pct = metrics.totalRevenue > 0 
                ? Math.round((mode.amount / metrics.totalRevenue) * 100) 
                : 0;

              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-stone-700 dark:text-stone-300">{mode.label}</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                      {company.currencySymbol}{mode.amount.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className={`h-2 rounded-full ${mode.barBg} overflow-hidden`}>
                    <div 
                      className={`h-full ${mode.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700/60 text-xs flex justify-between">
            <span className="text-stone-500">Total Net Collections:</span>
            <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
              {company.currencySymbol}{metrics.totalRevenue.toLocaleString()}
            </span>
          </div>
        </div>

      </div>

      {/* TOP SELLING HOMOEOPATHIC REMEDIES */}
      <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
          Top Prescribed & Dispensed Homoeopathic Remedies
        </h3>

        {metrics.topRemedies.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-400">
            No remedy dispensation logs in selected period
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {metrics.topRemedies.map((rem, idx) => (
              <div 
                key={idx} 
                className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                  <span>RANK #{idx + 1}</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">{rem.count} units</span>
                </div>
                <div className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate" title={rem.name}>
                  {rem.name}
                </div>
                <div className="text-[11px] font-mono text-stone-500">
                  {company.currencySymbol}{rem.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENT INVOICE LEDGER TABLE */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden space-y-3">
        
        {/* Table Search & Title */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Invoices & Transaction Ledger ({filteredSales.length})
            </h3>
            <p className="text-xs text-stone-500">
              Audit trail of all patient bills and GST invoices
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search invoice or patient..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 font-semibold text-stone-600 dark:text-stone-300 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-4">Patient</th>
                <th className="py-2.5 px-3">Doctor Ref</th>
                <th className="py-2.5 px-2 text-center">Items</th>
                <th className="py-2.5 px-3 text-right">Taxable</th>
                <th className="py-2.5 px-3 text-right">GST</th>
                <th className="py-2.5 px-4 text-right">Total</th>
                <th className="py-2.5 px-3 text-center">Payment</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-stone-400">
                    No transactions found for the specified filter
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-stone-500 font-mono text-[11px]">
                      <div>{sale.dateStr}</div>
                      <div className="text-[10px] text-stone-400">{sale.timeStr}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900 dark:text-stone-100">{sale.patientName}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{sale.patientPhone}</div>
                    </td>
                    <td className="py-3 px-3 text-stone-600 dark:text-stone-400 truncate max-w-[120px]">
                      {sale.doctorRef || '-'}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-stone-700 dark:text-stone-300">
                      {sale.items.length}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-stone-600 dark:text-stone-400">
                      {company.currencySymbol}{sale.taxableSubtotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {company.currencySymbol}{sale.totalGst.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900 dark:text-stone-100">
                      {company.currencySymbol}{sale.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onViewInvoice(sale)}
                        className="px-2.5 py-1 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg flex items-center gap-1 mx-auto transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
