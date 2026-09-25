import React, { useState, useMemo } from 'react';
import { CompanySettings, GSTSettings, GSTTaxSlab, Sale } from '../types';
import * as XLSX from 'xlsx';
import { 
  ShieldCheck, 
  Settings, 
  FileSpreadsheet, 
  Plus, 
  Save, 
  Check, 
  Info,
  Layers,
  Percent
} from 'lucide-react';

interface GSTManagementProps {
  company: CompanySettings;
  gstSettings: GSTSettings;
  sales: Sale[];
  onUpdateGSTSettings: (settings: GSTSettings) => Promise<void>;
  onUpdateCompany: (companySettings: Partial<CompanySettings>) => Promise<void>;
}

export const GSTManagement: React.FC<GSTManagementProps> = ({
  company,
  gstSettings,
  sales,
  onUpdateGSTSettings,
  onUpdateCompany,
}) => {
  const [formSettings, setFormSettings] = useState<GSTSettings>({ ...gstSettings });
  const [companyGstin, setCompanyGstin] = useState(company.gstin || '');
  const [companyState, setCompanyState] = useState(company.state || 'Maharashtra');
  const [companyStateCode, setCompanyStateCode] = useState(company.stateCode || '27');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Month selector for GSTR summary
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Calculate GSTR summary for selected month
  const monthlySales = useMemo(() => {
    return sales.filter(s => s.dateStr.startsWith(selectedMonth));
  }, [sales, selectedMonth]);

  const gstSummary = useMemo(() => {
    const totalTaxable = monthlySales.reduce((acc, s) => acc + s.taxableSubtotal, 0);
    const totalCgst = monthlySales.reduce((acc, s) => acc + s.cgstAmount, 0);
    const totalSgst = monthlySales.reduce((acc, s) => acc + s.sgstAmount, 0);
    const totalIgst = monthlySales.reduce((acc, s) => acc + s.igstAmount, 0);
    const totalTax = totalCgst + totalSgst + totalIgst;
    const totalGross = monthlySales.reduce((acc, s) => acc + s.grandTotal, 0);

    // HSN-wise aggregation
    const hsnMap = new Map<string, {
      description: string;
      uqc: string;
      totalQty: number;
      totalValue: number;
      taxableValue: number;
      cgst: number;
      sgst: number;
      rate: number;
    }>();

    monthlySales.forEach(sale => {
      sale.items.forEach(item => {
        const hsn = item.hsnCode || '30049014';
        const desc = item.form.includes('Dilution') || item.form.includes('Tincture') 
          ? 'Homoeopathic Medicaments'
          : item.form.includes('Ointment')
          ? 'Medicated Ointments'
          : 'Dispensary Consumables';

        const existing = hsnMap.get(hsn) || {
          description: desc,
          uqc: 'NOS',
          totalQty: 0,
          totalValue: 0,
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          rate: item.gstRate || 5,
        };

        existing.totalQty += item.quantity;
        existing.totalValue += item.totalAmount;
        existing.taxableValue += item.taxableAmount;
        existing.cgst += +(item.gstAmount / 2).toFixed(2);
        existing.sgst += +(item.gstAmount / 2).toFixed(2);
        hsnMap.set(hsn, existing);
      });
    });

    const hsnList = Array.from(hsnMap.entries()).map(([hsn, data]) => ({
      hsn,
      ...data,
    }));

    return {
      totalTaxable,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTax,
      totalGross,
      hsnList,
    };
  }, [monthlySales]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateGSTSettings(formSettings);
    await onUpdateCompany({
      gstin: companyGstin,
      state: companyState,
      stateCode: companyStateCode,
      defaultGstRate: formSettings.defaultRate,
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleExportGSTR = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: GSTR Summary
    const summarySheetData = [
      ['GSTR-1 HOMOEOPATHIC CLINIC SUMMARY'],
      ['Clinic Name:', company.name],
      ['GSTIN:', companyGstin],
      ['State Code:', companyStateCode],
      ['Month:', selectedMonth],
      [],
      ['Metric', 'Amount (INR)'],
      ['Gross Clinical Turnover', gstSummary.totalGross],
      ['Total Taxable Value', gstSummary.totalTaxable],
      ['Central GST (CGST)', gstSummary.totalCgst],
      ['State GST (SGST)', gstSummary.totalSgst],
      ['Integrated GST (IGST)', gstSummary.totalIgst],
      ['Total GST Liability', gstSummary.totalTax],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summarySheetData);
    XLSX.utils.book_append_sheet(wb, ws1, 'GSTR-1 Summary');

    // Sheet 2: HSN Summary Table
    const hsnRows = gstSummary.hsnList.map(h => ({
      'HSN Code': h.hsn,
      'Description': h.description,
      'UQC': h.uqc,
      'Total Quantity': h.totalQty,
      'Total Value': h.totalValue,
      'Taxable Value': h.taxableValue,
      'Rate %': h.rate,
      'Central Tax (CGST)': h.cgst,
      'State Tax (SGST)': h.sgst,
    }));
    const ws2 = XLSX.utils.json_to_sheet(hsnRows);
    XLSX.utils.book_append_sheet(wb, ws2, 'HSN-Wise Summary');

    XLSX.writeFile(wb, `GSTR1_Report_${selectedMonth}_${companyGstin}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>GST Management & Tax Compliance</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Configure clinic GSTIN, tax slabs, intra/inter-state rules, and generate GSTR return summaries
          </p>
        </div>

        <button
          onClick={handleExportGSTR}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export GSTR-1 Excel</span>
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="text-xs text-stone-500 mb-1">Monthly Taxable Turnover</div>
          <div className="font-mono text-xl font-bold text-stone-900 dark:text-stone-100">
            {company.currencySymbol}{gstSummary.totalTaxable.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 font-mono">
            Month: {selectedMonth}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="text-xs text-stone-500 mb-1">Central GST (CGST)</div>
          <div className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {company.currencySymbol}{gstSummary.totalCgst.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Standard Homoeo 2.5%
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="text-xs text-stone-500 mb-1">State GST (SGST)</div>
          <div className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {company.currencySymbol}{gstSummary.totalSgst.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Standard Homoeo 2.5%
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="text-xs text-stone-500 mb-1">Total Tax Liability</div>
          <div className="font-mono text-xl font-bold text-orange-600 dark:text-orange-400">
            {company.currencySymbol}{gstSummary.totalTax.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Gross B2C Small Bills
          </div>
        </div>

      </div>

      {/* GST SETTINGS FORM & TAX SLABS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Settings Left Column (6 COLS) */}
        <div className="lg:col-span-6 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Clinic GSTIN & Registration Profile
              </h3>
            </div>
            {isSavedNotice && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Settings Saved!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Clinic GSTIN Number *
                </label>
                <input
                  type="text"
                  required
                  value={companyGstin}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setCompanyGstin(val);
                    if (val.length >= 2) {
                      setCompanyStateCode(val.slice(0, 2));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-stone-900 dark:text-stone-100 font-bold"
                  placeholder="27AAACH7409R1ZZ"
                />
                <span className="text-[10px] text-stone-400">15-digit Goods & Services Tax Identification Number</span>
              </div>

              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Registered State Name
                </label>
                <input
                  type="text"
                  value={companyState}
                  onChange={(e) => setCompanyState(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  State POS Code
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={companyStateCode}
                  onChange={(e) => setCompanyStateCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-stone-900 dark:text-stone-100"
                  placeholder="27"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Default Homoeopathy GST Rate
                </label>
                <select
                  value={formSettings.defaultRate}
                  onChange={(e) => setFormSettings({ ...formSettings, defaultRate: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  <option value={5}>5% (Standard Medicaments)</option>
                  <option value={12}>12% (Tonics & Ointments)</option>
                  <option value={18}>18% (Accessories)</option>
                  <option value={0}>0% (Exempt)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Default Homoeo HSN Code
                </label>
                <input
                  type="text"
                  value={company.hsnCode || '30049014'}
                  onChange={(e) => onUpdateCompany({ hsnCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save GST Preferences</span>
              </button>
            </div>
          </form>
        </div>

        {/* Tax Slabs Information Right Column (6 COLS) */}
        <div className="lg:col-span-6 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Configured GST Tax Slabs
              </h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {formSettings.taxSlabs.map((slab) => (
              <div 
                key={slab.id} 
                className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                    {slab.name}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    HSN: <span className="font-mono">{slab.hsnCode}</span> · {slab.description}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
                    {slab.rate}%
                  </span>
                  <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                    {slab.rate > 0 ? `${slab.rate / 2}% + ${slab.rate / 2}%` : 'Exempt'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 text-[11px] text-stone-600 dark:text-stone-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <span>
              <b>Statutory Note:</b> Under Indian GST law, Medicaments of the Homoeopathic system are classified under Chapter 3004 90 14 attracting 5% GST (2.5% CGST + 2.5% SGST). Medicated hair oils and ointments typically attract 12%.
            </span>
          </div>
        </div>

      </div>

      {/* MONTHLY HSN-WISE SUMMARY REPORT TABLE */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              HSN-Wise Outward Supplies Summary (GSTR-1 Ready)
            </h3>
            <p className="text-xs text-stone-500">
              Consolidated tax statement categorized by remedy HSN code
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-500">Filing Period:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 font-semibold text-stone-600 dark:text-stone-300 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4">HSN Code</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-2 text-center">UQC</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Total Value</th>
                <th className="py-2.5 px-3 text-right">Taxable Value</th>
                <th className="py-2.5 px-2 text-center">Rate</th>
                <th className="py-2.5 px-3 text-right">Central Tax</th>
                <th className="py-2.5 px-3 text-right">State Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {gstSummary.hsnList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-stone-400">
                    No sales recorded in period {selectedMonth}
                  </td>
                </tr>
              ) : (
                gstSummary.hsnList.map((row, idx) => (
                  <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {row.hsn}
                    </td>
                    <td className="py-3 px-3 font-medium text-stone-800 dark:text-stone-200">
                      {row.description}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-stone-400">
                      {row.uqc}
                    </td>
                    <td className="py-3 px-2 text-center font-bold font-mono">
                      {row.totalQty}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-stone-700 dark:text-stone-300">
                      {company.currencySymbol}{row.totalValue.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-stone-900 dark:text-stone-100">
                      {company.currencySymbol}{row.taxableValue.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center font-mono">
                      {row.rate}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {company.currencySymbol}{row.cgst.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {company.currencySymbol}{row.sgst.toFixed(2)}
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
