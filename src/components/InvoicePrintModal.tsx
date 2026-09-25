import React, { useState } from 'react';
import { Sale, CompanySettings } from '../types';
import { ApothecaryEmblem } from './ApothecaryIcon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Printer, 
  Download, 
  Share2, 
  X, 
  Receipt, 
  FileText, 
  QrCode,
  CheckCircle2
} from 'lucide-react';

interface InvoicePrintModalProps {
  sale: Sale;
  company: CompanySettings;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  sale,
  company,
  onClose,
}) => {
  const [format, setFormat] = useState<'thermal' | 'a4'>('thermal');
  const [isCopied, setIsCopied] = useState(false);

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Generate downloadable PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: format === 'thermal' ? [80, 200] : 'a4',
    });

    if (format === 'thermal') {
      // Compact 80mm PDF
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(company.name.toUpperCase(), 40, 10, { align: 'center' });
      doc.setFontSize(7);
      doc.text(`${company.address}, ${company.city}`, 40, 15, { align: 'center' });
      doc.text(`Ph: ${company.phone} | GSTIN: ${company.gstin}`, 40, 19, { align: 'center' });
      doc.text(`Doctor: ${company.doctorInCharge}`, 40, 23, { align: 'center' });
      doc.line(4, 25, 76, 25);

      doc.text(`Inv: ${sale.invoiceNumber}  Date: ${sale.dateStr} ${sale.timeStr}`, 4, 29);
      doc.text(`Patient: ${sale.patientName} (${sale.patientPhone})`, 4, 33);
      if (sale.doctorRef) doc.text(`Doctor Rx: ${sale.doctorRef}`, 4, 37);
      doc.line(4, 39, 76, 39);

      let y = 43;
      doc.setFontSize(7);
      doc.text('Item Description', 4, y);
      doc.text('Qty', 48, y);
      doc.text('Amt', 76, y, { align: 'right' });
      y += 4;
      doc.line(4, y, 76, y);
      y += 4;

      sale.items.forEach(item => {
        doc.setFontSize(7);
        doc.text(`${item.name} (${item.potency})`, 4, y);
        doc.text(`${item.quantity}`, 50, y);
        doc.text(`${company.currencySymbol} ${item.totalAmount.toFixed(2)}`, 76, y, { align: 'right' });
        y += 3.5;
        if (item.dosageInstructions) {
          doc.setFontSize(6);
          doc.text(`* ${item.dosageInstructions}`, 6, y);
          y += 3.5;
        }
      });

      doc.line(4, y, 76, y);
      y += 4;
      doc.setFontSize(7);
      doc.text(`Taxable: ${company.currencySymbol} ${sale.taxableSubtotal.toFixed(2)}`, 4, y);
      doc.text(`GST: ${company.currencySymbol} ${sale.totalGst.toFixed(2)}`, 45, y);
      y += 4;
      doc.setFontSize(9);
      doc.text(`TOTAL: ${company.currencySymbol} ${sale.grandTotal.toLocaleString()}`, 76, y, { align: 'right' });
      y += 5;
      doc.setFontSize(7);
      doc.text(`Mode: ${sale.paymentMethod} | Cashier: ${sale.cashierName}`, 4, y);
      y += 6;
      doc.setFontSize(6);
      doc.text(company.receiptFooterTerms, 4, y, { maxWidth: 72 });

      doc.save(`Receipt_${sale.invoiceNumber}.pdf`);
    } else {
      // Official A4 PDF Tax Invoice
      doc.setFontSize(16);
      doc.setTextColor(234, 88, 12);
      doc.text(company.name.toUpperCase(), 14, 18);
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`${company.doctorInCharge} · ${company.doctorQualifications}`, 14, 23);
      doc.text(`${company.address}, ${company.city}, ${company.state} - ${company.pincode} | Tel: ${company.phone}`, 14, 28);
      doc.text(`GSTIN: ${company.gstin} | State Code: ${company.stateCode} | Lic: ${company.regNumber}`, 14, 33);
      doc.line(14, 36, 196, 36);

      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text('TAX INVOICE (HOMOEOPATHIC DISPENSARY)', 14, 43);
      doc.setFontSize(9);
      doc.text(`Invoice No: ${sale.invoiceNumber}`, 14, 49);
      doc.text(`Date & Time: ${sale.dateStr} ${sale.timeStr}`, 14, 54);
      doc.text(`Payment Mode: ${sale.paymentMethod}`, 14, 59);

      doc.text(`Patient Name: ${sale.patientName}`, 120, 49);
      doc.text(`Patient Contact: ${sale.patientPhone}`, 120, 54);
      if (sale.doctorRef) doc.text(`Consultant: ${sale.doctorRef}`, 120, 59);

      const tableData = sale.items.map((it, idx) => [
        (idx + 1).toString(),
        `${it.name}\nPotency: ${it.potency} | Form: ${it.form}${it.dosageInstructions ? `\nDosage: ${it.dosageInstructions}` : ''}`,
        it.hsnCode || '30049014',
        it.batchNo || '-',
        it.expiryDate || '-',
        it.quantity.toString(),
        `${company.currencySymbol} ${it.unitPrice.toFixed(2)}`,
        `${it.gstRate}%`,
        `${company.currencySymbol} ${it.gstAmount.toFixed(2)}`,
        `${company.currencySymbol} ${it.totalAmount.toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 65,
        head: [['#', 'Medicine & Dosage', 'HSN', 'Batch', 'Exp', 'Qty', 'MRP', 'GST %', 'GST Amt', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 60 },
          2: { cellWidth: 18 },
          3: { cellWidth: 16 },
          4: { cellWidth: 16 },
          5: { cellWidth: 10, halign: 'center' },
          6: { cellWidth: 16, halign: 'right' },
          7: { cellWidth: 12, halign: 'center' },
          8: { cellWidth: 16, halign: 'right' },
          9: { cellWidth: 18, halign: 'right' },
        },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(8);
      doc.text(`Taxable Subtotal: ${company.currencySymbol} ${sale.taxableSubtotal.toFixed(2)}`, 130, finalY);
      doc.text(`CGST: ${company.currencySymbol} ${sale.cgstAmount.toFixed(2)}`, 130, finalY + 4);
      doc.text(`SGST: ${company.currencySymbol} ${sale.sgstAmount.toFixed(2)}`, 130, finalY + 8);
      doc.setFontSize(11);
      doc.setTextColor(234, 88, 12);
      doc.text(`GRAND TOTAL: ${company.currencySymbol} ${sale.grandTotal.toLocaleString()}`, 130, finalY + 14);

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Terms: ${company.receiptFooterTerms}`, 14, finalY + 22, { maxWidth: 100 });
      doc.text('Authorized Signatory / Registered Pharmacist', 130, finalY + 26);

      doc.save(`Tax_Invoice_${sale.invoiceNumber}.pdf`);
    }
  };

  // WhatsApp bill summary sharing
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*${company.name}*\n` +
      `Invoice: ${sale.invoiceNumber}\n` +
      `Date: ${sale.dateStr}\n` +
      `Patient: ${sale.patientName}\n` +
      `Items: ${sale.items.map(i => `${i.name} ${i.potency} (x${i.quantity})`).join(', ')}\n` +
      `Total: ${company.currencySymbol}${sale.grandTotal}\n` +
      `Thank you for trusting Similia Clinic!`
    );
    window.open(`https://wa.me/${sale.patientPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  // UPI payment QR string
  const upiQrString = `upi://pay?pa=${encodeURIComponent(company.upiId || 'similia@upi')}&pn=${encodeURIComponent(company.name)}&am=${sale.grandTotal}&cu=INR&tn=${encodeURIComponent('Inv ' + sale.invoiceNumber)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto">
        
        {/* Action Toolbar (Hidden during print) */}
        <div className="no-print flex flex-wrap items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80 gap-3">
          
          {/* Format Switcher */}
          <div className="flex items-center gap-1 p-1 bg-stone-200/80 dark:bg-stone-700/80 rounded-xl">
            <button
              onClick={() => setFormat('thermal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                format === 'thermal'
                  ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Thermal Receipt (80mm)</span>
            </button>
            <button
              onClick={() => setFormat('a4')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                format === 'a4'
                  ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 Tax Invoice</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold rounded-xl transition-colors border border-stone-300 dark:border-stone-700"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              title="Send bill on WhatsApp"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice View Container */}
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto bg-stone-100 dark:bg-stone-950 flex justify-center">
          
          {/* 1. THERMAL POS RECEIPT FORMAT (80mm) */}
          {format === 'thermal' && (
            <div className="thermal-receipt-container bg-white text-black p-5 rounded-lg shadow-md border border-stone-200 font-mono text-xs w-[320px] max-w-full">
              
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-stone-300">
                <div className="flex justify-center mb-1">
                  <ApothecaryEmblem className="w-8 h-8" size={32} />
                </div>
                <h2 className="text-sm font-bold tracking-tight uppercase leading-tight">
                  {company.name}
                </h2>
                <p className="text-[10px] text-stone-600 mt-0.5">
                  {company.doctorInCharge}
                </p>
                <p className="text-[10px] text-stone-600">
                  {company.address}, {company.city}
                </p>
                <p className="text-[10px] text-stone-600 font-medium">
                  Ph: {company.phone} | GSTIN: {company.gstin}
                </p>
              </div>

              {/* Meta details */}
              <div className="py-2 text-[11px] border-b border-dashed border-stone-300 space-y-0.5">
                <div className="flex justify-between">
                  <span>Bill No: <b>{sale.invoiceNumber}</b></span>
                  <span>{sale.dateStr}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Time: {sale.timeStr}</span>
                  <span>Pay: {sale.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Patient: <b>{sale.patientName}</b></span>
                  <span>{sale.patientPhone}</span>
                </div>
                {sale.doctorRef && (
                  <div className="text-stone-600 text-[10px]">
                    Prescriber: {sale.doctorRef}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="py-2 border-b border-dashed border-stone-300">
                <div className="grid grid-cols-12 font-bold text-[10px] uppercase text-stone-500 pb-1">
                  <span className="col-span-7">Item / Potency</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-3 text-right">Amt</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="text-[11px]">
                      <div className="grid grid-cols-12 leading-tight">
                        <span className="col-span-7 font-semibold truncate">
                          {item.name} {item.potency !== 'N/A' ? item.potency : ''}
                        </span>
                        <span className="col-span-2 text-center">{item.quantity}</span>
                        <span className="col-span-3 text-right font-medium">
                          {company.currencySymbol}{item.totalAmount.toFixed(2)}
                        </span>
                      </div>
                      {item.dosageInstructions && (
                        <div className="text-[10px] text-stone-600 pl-1 italic">
                          ↳ {item.dosageInstructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax & Grand Total */}
              <div className="py-2 border-b border-dashed border-stone-300 text-[11px] space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>Taxable Subtotal:</span>
                  <span>{company.currencySymbol}{sale.taxableSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600 text-[10px]">
                  <span>CGST (2.5%):</span>
                  <span>{company.currencySymbol}{sale.cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600 text-[10px]">
                  <span>SGST (2.5%):</span>
                  <span>{company.currencySymbol}{sale.sgstAmount.toFixed(2)}</span>
                </div>
                {sale.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-{company.currencySymbol}{sale.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-stone-200">
                  <span>NET TOTAL:</span>
                  <span>{company.currencySymbol}{sale.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* UPI QR & Footer */}
              <div className="pt-3 text-center space-y-2">
                {company.upiId && (
                  <div className="p-2 bg-stone-50 rounded border border-stone-200 inline-block mx-auto text-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(upiQrString)}`}
                      alt="UPI QR Code"
                      className="w-20 h-20 mx-auto"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[9px] text-stone-500 block mt-1">Scan & Pay via UPI</span>
                  </div>
                )}

                <p className="text-[9px] text-stone-500 leading-tight">
                  {company.receiptFooterTerms}
                </p>
                <p className="text-[10px] font-semibold text-stone-700">
                  Similia POS · Wishing You Vital Health
                </p>
              </div>
            </div>
          )}

          {/* 2. OFFICIAL A4 CLINIC TAX INVOICE FORMAT */}
          {format === 'a4' && (
            <div className="a4-invoice-container bg-white text-stone-900 p-8 rounded-lg shadow-md border border-stone-200 w-full max-w-2xl text-xs">
              
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b-2 border-orange-500">
                <div className="flex items-start gap-3">
                  <ApothecaryEmblem className="w-12 h-12 text-orange-600" size={48} />
                  <div>
                    <h1 className="text-lg font-bold uppercase tracking-tight text-stone-900">
                      {company.name}
                    </h1>
                    <p className="text-xs text-orange-600 font-semibold">
                      {company.doctorInCharge} · {company.doctorQualifications}
                    </p>
                    <p className="text-stone-600 mt-0.5">
                      {company.address}, {company.city}, {company.state} - {company.pincode}
                    </p>
                    <p className="text-stone-600">
                      Phone: <b>{company.phone}</b> | Email: {company.email}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 text-xs font-bold bg-orange-100 text-orange-800 rounded uppercase tracking-wider inline-block mb-1">
                    TAX INVOICE
                  </span>
                  <div className="font-mono text-[11px] text-stone-600">
                    <div>GSTIN: <b>{company.gstin}</b></div>
                    <div>State Code: <b>{company.stateCode}</b></div>
                    <div>Lic No: <b>{company.regNumber}</b></div>
                  </div>
                </div>
              </div>

              {/* Patient & Invoice Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-stone-200 text-xs">
                <div>
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    Billed To Patient:
                  </h4>
                  <div className="font-bold text-sm text-stone-900">{sale.patientName}</div>
                  <div className="text-stone-600">Mobile: {sale.patientPhone}</div>
                  {sale.patientAge && (
                    <div className="text-stone-600">
                      Age/Gender: {sale.patientAge} Yrs / {sale.patientGender || 'Not Specified'}
                    </div>
                  )}
                  {sale.doctorRef && (
                    <div className="text-stone-600 mt-1">
                      Prescribed by: <b>{sale.doctorRef}</b>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    Invoice Details:
                  </h4>
                  <div className="font-mono text-sm font-bold text-orange-600">{sale.invoiceNumber}</div>
                  <div className="text-stone-600">Date: {sale.dateStr} {sale.timeStr}</div>
                  <div className="text-stone-600">Payment: <b>{sale.paymentMethod}</b></div>
                  <div className="text-stone-600">Cashier: {sale.cashierName}</div>
                </div>
              </div>

              {/* Medicines Table */}
              <div className="py-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-300 text-[10px] uppercase font-bold text-stone-600 bg-stone-50">
                      <th className="py-2 px-1 text-center w-8">#</th>
                      <th className="py-2 px-2">Remedy & Dosage</th>
                      <th className="py-2 px-2">HSN</th>
                      <th className="py-2 px-2">Batch / Exp</th>
                      <th className="py-2 px-1 text-center">Qty</th>
                      <th className="py-2 px-2 text-right">MRP</th>
                      <th className="py-2 px-1 text-center">GST</th>
                      <th className="py-2 px-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-[11px]">
                    {sale.items.map((item, index) => (
                      <tr key={index} className="hover:bg-stone-50/50">
                        <td className="py-2 px-1 text-center text-stone-400">{index + 1}</td>
                        <td className="py-2 px-2 font-medium text-stone-900">
                          <div>{item.name} {item.potency !== 'N/A' ? `(${item.potency})` : ''}</div>
                          <div className="text-[10px] text-stone-500 font-normal">
                            Form: {item.form} · {item.packSize}
                          </div>
                          {item.dosageInstructions && (
                            <div className="text-[10px] text-orange-700 bg-orange-50/80 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                              Dosage: {item.dosageInstructions}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 font-mono text-stone-500">{item.hsnCode}</td>
                        <td className="py-2 px-2 font-mono text-[10px] text-stone-500">
                          {item.batchNo}<br />{item.expiryDate}
                        </td>
                        <td className="py-2 px-1 text-center font-bold">{item.quantity}</td>
                        <td className="py-2 px-2 text-right font-mono">
                          {company.currencySymbol}{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-2 px-1 text-center font-mono">{item.gstRate}%</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">
                          {company.currencySymbol}{item.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Calculations */}
              <div className="grid grid-cols-2 gap-6 pt-2 border-t border-stone-200">
                <div className="space-y-2 text-stone-600">
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-[10px]">
                    <span className="font-bold text-stone-800 block mb-1">Clinic Bank Details:</span>
                    <div>Bank: {company.bankName || 'HDFC Bank Ltd'}</div>
                    <div>A/C: {company.accountNumber || '50200084920199'}</div>
                    <div>IFSC: {company.ifscCode || 'HDFC0001234'}</div>
                    {company.upiId && <div>UPI ID: <b>{company.upiId}</b></div>}
                  </div>
                  <p className="text-[9px] text-stone-400">
                    * Homoeopathic medicines must be stored away from direct sunlight, camphor, and high-odour aromatics.
                  </p>
                </div>

                <div className="space-y-1.5 text-right font-mono text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Taxable Value:</span>
                    <span>{company.currencySymbol}{sale.taxableSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>CGST:</span>
                    <span>{company.currencySymbol}{sale.cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>SGST:</span>
                    <span>{company.currencySymbol}{sale.sgstAmount.toFixed(2)}</span>
                  </div>
                  {sale.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Total Savings:</span>
                      <span>-{company.currencySymbol}{sale.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-orange-600 pt-2 border-t border-stone-300">
                    <span>Grand Total:</span>
                    <span>{company.currencySymbol}{sale.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-10 text-[11px] text-stone-500">
                <div>
                  <p className="text-[10px]">Thank you for your visit!</p>
                  <p className="text-[9px] text-stone-400">Computerized Tax Invoice generated via Similia POS</p>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-stone-400 mb-1" />
                  <span>Authorized Signatory / Pharmacist</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
