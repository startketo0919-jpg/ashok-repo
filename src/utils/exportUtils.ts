import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Sale, Medicine, CompanySettings } from '../types';

export function exportSalesReportToExcel(
  sales: Sale[],
  dateRangeLabel: string,
  company: CompanySettings
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Executive Summary
  const totalRevenue = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalTaxable = sales.reduce((acc, s) => acc + s.taxableSubtotal, 0);
  const totalGst = sales.reduce((acc, s) => acc + s.totalGst, 0);
  const totalDiscount = sales.reduce((acc, s) => acc + s.totalDiscount, 0);
  const cashSales = sales.filter(s => s.paymentMethod === 'CASH').reduce((a, b) => a + b.grandTotal, 0);
  const upiSales = sales.filter(s => s.paymentMethod === 'UPI').reduce((a, b) => a + b.grandTotal, 0);
  const cardSales = sales.filter(s => s.paymentMethod === 'CARD').reduce((a, b) => a + b.grandTotal, 0);
  const dueSales = sales.filter(s => s.paymentMethod === 'DUE').reduce((a, b) => a + b.grandTotal, 0);

  const summaryData = [
    ['SIMILIA POS - CLINIC SALES REPORT'],
    ['Clinic Name:', company.name],
    ['Doctor In-Charge:', company.doctorInCharge],
    ['GSTIN:', company.gstin],
    ['Report Period:', dateRangeLabel],
    ['Exported On:', new Date().toLocaleString()],
    [],
    ['Key Performance Metric', 'Value (' + company.currencySymbol + ')'],
    ['Total Gross Sales', totalRevenue],
    ['Total Taxable Base', totalTaxable],
    ['Total GST Collected', totalGst],
    ['Total Discounts Given', totalDiscount],
    ['Total Bills Issued', sales.length],
    [],
    ['Payment Mode Breakdown', 'Amount (' + company.currencySymbol + ')'],
    ['Cash Payments', cashSales],
    ['UPI / QR Payments', upiSales],
    ['Card Payments', cardSales],
    ['Clinic Credit / Due', dueSales],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Sales Summary');

  // Sheet 2: Invoices Log
  const invoiceRows = sales.map((sale) => ({
    'Invoice No': sale.invoiceNumber,
    'Date': sale.dateStr,
    'Time': sale.timeStr,
    'Patient Name': sale.patientName,
    'Phone': sale.patientPhone,
    'Doctor Ref': sale.doctorRef || '-',
    'Total Items': sale.items.length,
    'Taxable Subtotal': sale.taxableSubtotal,
    'CGST': sale.cgstAmount,
    'SGST': sale.sgstAmount,
    'IGST': sale.igstAmount,
    'Total GST': sale.totalGst,
    'Discount': sale.totalDiscount,
    'Grand Total': sale.grandTotal,
    'Payment Method': sale.paymentMethod,
    'Cashier': sale.cashierName,
    'Status': sale.status,
  }));
  const wsInvoices = XLSX.utils.json_to_sheet(invoiceRows);
  XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoices Log');

  // Sheet 3: Itemized Remedies Dispensed
  const remedyRows: any[] = [];
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      remedyRows.push({
        'Invoice No': sale.invoiceNumber,
        'Date': sale.dateStr,
        'Patient': sale.patientName,
        'Remedy Name': item.name,
        'Potency': item.potency,
        'Form': item.form,
        'Manufacturer': item.manufacturer,
        'Batch No': item.batchNo,
        'Expiry Date': item.expiryDate,
        'Quantity': item.quantity,
        'Unit Price': item.unitPrice,
        'Discount %': item.discountPercent,
        'GST Rate %': item.gstRate,
        'Tax Amount': item.gstAmount,
        'Item Total': item.totalAmount,
        'Dosage': item.dosageInstructions || '-',
      });
    });
  });
  const wsRemedies = XLSX.utils.json_to_sheet(remedyRows);
  XLSX.utils.book_append_sheet(wb, wsRemedies, 'Remedies Dispensed');

  XLSX.writeFile(wb, `Similia_Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportInventoryToExcel(medicines: Medicine[], company: CompanySettings) {
  const wb = XLSX.utils.book_new();

  const inventoryRows = medicines.map((m) => ({
    'Medicine ID': m.id,
    'Remedy Name': m.name,
    'Potency': m.potency,
    'Form': m.form,
    'Manufacturer': m.manufacturer,
    'Batch No': m.batchNo,
    'Expiry Date': m.expiryDate,
    'Pack Size': m.packSize,
    'Current Stock': m.currentStock,
    'Min Alert Stock': m.minStockAlert,
    'Cost Price': m.costPrice,
    'Selling Price (MRP)': m.sellingPrice,
    'Total Stock Cost Value': m.currentStock * m.costPrice,
    'Total Stock MRP Value': m.currentStock * m.sellingPrice,
    'GST %': m.gstRate,
    'HSN Code': m.hsnCode,
    'Dispensary Rack': m.rackLocation,
    'Indications': m.indications || '',
  }));

  const ws = XLSX.utils.json_to_sheet(inventoryRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Homoeo Stock Ledger');

  XLSX.writeFile(wb, `Similia_Inventory_Stock_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportSalesReportToPDF(
  sales: Sale[],
  dateRangeLabel: string,
  company: CompanySettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Clinic Header
  doc.setFontSize(16);
  doc.setTextColor(234, 88, 12); // Orange primary
  doc.text(company.name.toUpperCase(), 14, 18);

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`${company.doctorInCharge} · ${company.doctorQualifications}`, 14, 23);
  doc.text(`${company.address}, ${company.city}, ${company.state} - ${company.pincode} | Phone: ${company.phone}`, 14, 28);
  doc.text(`GSTIN: ${company.gstin} | State Code: ${company.stateCode}`, 14, 33);

  // Line separator
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 36, 196, 36);

  // Title
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(`CLINICAL SALES & FINANCIAL PERFORMANCE REPORT`, 14, 43);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Period: ${dateRangeLabel} | Generated: ${new Date().toLocaleString()}`, 14, 48);

  // KPI Summary Matrix
  const totalRevenue = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalGst = sales.reduce((acc, s) => acc + s.totalGst, 0);
  const totalTaxable = sales.reduce((acc, s) => acc + s.taxableSubtotal, 0);
  const totalBills = sales.length;
  const avgBill = totalBills > 0 ? (totalRevenue / totalBills).toFixed(2) : '0';

  autoTable(doc, {
    startY: 52,
    head: [['Total Sales Revenue', 'Total Taxable', 'Total GST Collected', 'Total Invoices', 'Average Ticket Value']],
    body: [
      [
        `${company.currencySymbol} ${totalRevenue.toLocaleString()}`,
        `${company.currencySymbol} ${totalTaxable.toFixed(2)}`,
        `${company.currencySymbol} ${totalGst.toFixed(2)}`,
        `${totalBills}`,
        `${company.currencySymbol} ${avgBill}`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 9, halign: 'center' },
  });

  // Invoices Table
  const tableRows = sales.map((sale) => [
    sale.invoiceNumber,
    sale.dateStr,
    sale.patientName,
    sale.paymentMethod,
    sale.items.length.toString(),
    `${company.currencySymbol} ${sale.taxableSubtotal.toFixed(2)}`,
    `${company.currencySymbol} ${sale.totalGst.toFixed(2)}`,
    `${company.currencySymbol} ${sale.grandTotal.toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [['Inv No', 'Date', 'Patient Name', 'Payment', 'Qty', 'Taxable', 'GST', 'Grand Total']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [68, 64, 60], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 22 },
      2: { cellWidth: 42 },
      3: { cellWidth: 20 },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
    },
  });

  // Footer notes
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  if (finalY < 280) {
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('This is an authentic system generated financial audit report from Similia POS.', 14, finalY);
  }

  doc.save(`Similia_Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
