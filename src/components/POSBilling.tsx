import React, { useState, useMemo } from 'react';
import { 
  Medicine, 
  CartItem, 
  Sale, 
  CompanySettings, 
  User, 
  PaymentMethod,
  Potency
} from '../types';
import { CustomVialBuilderModal } from './CustomVialBuilderModal';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Sparkles, 
  AlertTriangle,
  Receipt,
  User as UserIcon,
  Tag,
  Clock,
  Printer
} from 'lucide-react';

interface POSBillingProps {
  medicines: Medicine[];
  company: CompanySettings;
  currentUser: User | null;
  doctors: User[];
  onCompleteSale: (sale: Sale) => Promise<Sale>;
  onShowInvoice: (sale: Sale) => void;
}

export const POSBilling: React.FC<POSBillingProps> = ({
  medicines,
  company,
  currentUser,
  doctors,
  onCompleteSale,
  onShowInvoice,
}) => {
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormFilter, setSelectedFormFilter] = useState<string>('ALL');
  const [selectedPotencyFilter, setSelectedPotencyFilter] = useState<string>('ALL');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Patient details
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [selectedDoctor, setSelectedDoctor] = useState(
    doctors.find(d => d.role === 'DOCTOR')?.name || company.doctorInCharge
  );

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<number | ''>('');
  const [transactionRef, setTransactionRef] = useState('');
  const [billNotes, setBillNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Custom Compound Modal
  const [showVialBuilder, setShowVialBuilder] = useState(false);

  // Form Filter options
  const formCategories = [
    { id: 'ALL', label: 'All Catalog' },
    { id: 'Dilution (Liquid)', label: 'Dilutions' },
    { id: 'Mother Tincture (Q)', label: 'Mother Tinctures' },
    { id: 'Bio-chemic Tissue Salts', label: 'Biochemics' },
    { id: 'Ointment / Cream', label: 'Ointments' },
    { id: 'Sugar Globules (#30 / #40)', label: 'Globules' },
  ];

  // Filter medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.potency.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q) ||
        (m.indications && m.indications.toLowerCase().includes(q)) ||
        m.rackLocation.toLowerCase().includes(q);

      const matchesForm = selectedFormFilter === 'ALL' || m.form === selectedFormFilter;
      const matchesPotency = selectedPotencyFilter === 'ALL' || m.potency === selectedPotencyFilter;

      return matchesSearch && matchesForm && matchesPotency;
    });
  }, [medicines, searchQuery, selectedFormFilter, selectedPotencyFilter]);

  // Add standard medicine to cart
  const handleAddToCart = (medicine: Medicine) => {
    const existingIndex = cart.findIndex((item) => item.medicineId === medicine.id);
    if (existingIndex >= 0) {
      const updated = [...cart];
      const existing = updated[existingIndex];
      // Check stock
      if (existing.quantity >= medicine.currentStock) {
        return; // Stock limit reached
      }
      existing.quantity += 1;
      recalculateItem(existing);
      setCart(updated);
    } else {
      const discountPercent = 0;
      const effectivePrice = medicine.sellingPrice * (1 - discountPercent / 100);
      const gstRate = medicine.gstRate || 5;
      const taxableAmount = +(effectivePrice / (1 + gstRate / 100)).toFixed(2);
      const gstAmount = +(effectivePrice - taxableAmount).toFixed(2);

      const newItem: CartItem = {
        id: 'CI-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        medicineId: medicine.id,
        name: medicine.name,
        potency: medicine.potency,
        form: medicine.form,
        manufacturer: medicine.manufacturer,
        batchNo: medicine.batchNo,
        expiryDate: medicine.expiryDate,
        packSize: medicine.packSize,
        quantity: 1,
        unitPrice: medicine.sellingPrice,
        discountPercent: 0,
        gstRate: medicine.gstRate,
        taxableAmount,
        gstAmount,
        totalAmount: medicine.sellingPrice,
        hsnCode: medicine.hsnCode || '30049014',
        dosageInstructions: getDefaultDosageForForm(medicine.form, medicine.potency),
      };
      setCart([...cart, newItem]);
    }
  };

  // Add custom compound to cart from builder modal
  const handleAddCustomToCart = (item: CartItem) => {
    setCart([...cart, item]);
  };

  const getDefaultDosageForForm = (form: string, potency: string) => {
    if (form === 'Dilution (Liquid)') return '4 globules TDS before food';
    if (form === 'Mother Tincture (Q)') return '15 drops in 1/4 cup lukewarm water TDS';
    if (form === 'Bio-chemic Tissue Salts') return '4 tablets chewed TDS with warm water';
    if (form === 'Ointment / Cream') return 'Apply locally twice daily';
    return '';
  };

  const recalculateItem = (item: CartItem) => {
    const gross = item.unitPrice * item.quantity;
    const discount = (gross * item.discountPercent) / 100;
    const net = gross - discount;
    const gstRate = item.gstRate || 5;
    const taxable = +(net / (1 + gstRate / 100)).toFixed(2);
    const gst = +(net - taxable).toFixed(2);

    item.taxableAmount = taxable;
    item.gstAmount = gst;
    item.totalAmount = Math.round(net);
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    const item = updated[index];
    const med = medicines.find(m => m.id === item.medicineId);
    
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    if (med && newQty > med.currentStock) {
      return; // exceed stock
    }

    item.quantity = newQty;
    recalculateItem(item);
    setCart(updated);
  };

  const handleUpdateDiscount = (index: number, discountPercent: number) => {
    const updated = [...cart];
    const item = updated[index];
    item.discountPercent = Math.min(100, Math.max(0, discountPercent));
    recalculateItem(item);
    setCart(updated);
  };

  const handleUpdateDosage = (index: number, dosage: string) => {
    const updated = [...cart];
    updated[index].dosageInstructions = dosage;
    setCart(updated);
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Cart financial totals
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
    const totalAmount = cart.reduce((acc, it) => acc + it.totalAmount, 0);
    const totalDiscount = subtotal - totalAmount;
    const taxableSubtotal = cart.reduce((acc, it) => acc + it.taxableAmount, 0);
    const totalGst = +(totalAmount - taxableSubtotal).toFixed(2);
    const cgstAmount = +(totalGst / 2).toFixed(2);
    const sgstAmount = +(totalGst - cgstAmount).toFixed(2);
    const grandTotal = Math.round(totalAmount);
    const roundOff = +(grandTotal - totalAmount).toFixed(2);

    return {
      subtotal,
      totalDiscount,
      taxableSubtotal,
      totalGst,
      cgstAmount,
      sgstAmount,
      grandTotal,
      roundOff,
    };
  }, [cart]);

  // Quick cash tender helper
  const changeDue = typeof cashTendered === 'number' ? Math.max(0, cashTendered - cartTotals.grandTotal) : 0;

  // Checkout and create sale
  const handleCheckout = async (printImmediately: boolean = true) => {
    if (cart.length === 0) return;
    if (!patientName.trim()) {
      alert('Please enter patient name');
      return;
    }

    setIsProcessing(true);
    try {
      const invoiceNumber = `${company.invoicePrefix}${company.nextInvoiceNumber}`;
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newSale: Sale = {
        id: 'SALE-' + Date.now(),
        invoiceNumber,
        createdAt: now.toISOString(),
        dateStr: now.toISOString().split('T')[0],
        timeStr,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim() || 'Walk-in',
        patientAge: patientAge.trim() || undefined,
        patientGender,
        doctorRef: selectedDoctor,
        items: [...cart],
        subtotal: cartTotals.subtotal,
        totalDiscount: cartTotals.totalDiscount,
        taxableSubtotal: cartTotals.taxableSubtotal,
        cgstAmount: cartTotals.cgstAmount,
        sgstAmount: cartTotals.sgstAmount,
        igstAmount: 0,
        totalGst: cartTotals.totalGst,
        grandTotal: cartTotals.grandTotal,
        roundOff: cartTotals.roundOff,
        paymentMethod,
        cashPaid: paymentMethod === 'CASH' && typeof cashTendered === 'number' ? cashTendered : undefined,
        changeDue: paymentMethod === 'CASH' ? changeDue : undefined,
        transactionRef: transactionRef || undefined,
        cashierId: currentUser?.id || 'USR-ADMIN',
        cashierName: currentUser?.name || 'Staff',
        status: 'PAID',
        notes: billNotes,
      };

      const completed = await onCompleteSale(newSale);

      // Reset cart and patient
      setCart([]);
      setPatientName('');
      setPatientPhone('');
      setPatientAge('');
      setCashTendered('');
      setTransactionRef('');
      setBillNotes('');

      if (printImmediately) {
        onShowInvoice(completed);
      }
    } catch (e: any) {
      alert('Checkout error: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const upiQrString = `upi://pay?pa=${encodeURIComponent(company.upiId || 'similia@upi')}&pn=${encodeURIComponent(company.name)}&am=${cartTotals.grandTotal}&cu=INR&tn=${encodeURIComponent('Bill Similia Clinic')}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: MEDICINE CATALOG & SEARCH (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Top Search & Filter Bar */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Arnica, Nux Vomica, 200C, Reckeweg, symptoms..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Dispensary Compound Prescribe Button */}
              <button
                onClick={() => setShowVialBuilder(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prescribe</span> Phial Vial
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {formCategories.map((cat) => {
                const isActive = selectedFormFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedFormFilter(cat.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Medicine Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredMedicines.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No homoeopathic remedies found</p>
                <p className="text-xs text-stone-500 mt-1">Try another search keyword or potency</p>
              </div>
            ) : (
              filteredMedicines.map((med) => {
                const isOutOfStock = med.currentStock <= 0;
                const isLowStock = med.currentStock <= med.minStockAlert;
                
                return (
                  <div
                    key={med.id}
                    className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-orange-400 dark:hover:border-orange-600 transition-all flex flex-col justify-between group shadow-sm hover:shadow"
                  >
                    <div>
                      {/* Title & Potency */}
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 leading-tight">
                          {med.name}
                        </h4>
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 shrink-0">
                          {med.potency}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 space-y-0.5">
                        <div className="truncate">{med.manufacturer} · {med.packSize}</div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px]">Rack: {med.rackLocation}</span>
                          <span>·</span>
                          <span className="font-mono text-[10px]">Exp: {med.expiryDate.slice(0, 7)}</span>
                        </div>
                        {med.indications && (
                          <div className="text-[10px] text-stone-400 line-clamp-1 italic pt-0.5">
                            {med.indications}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price, Stock and Add Button */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100 dark:border-stone-800/80">
                      <div>
                        <div className="font-mono text-sm font-bold text-stone-900 dark:text-stone-100">
                          {company.currencySymbol}{med.sellingPrice}
                        </div>
                        <div className={`text-[10px] font-mono ${
                          isOutOfStock 
                            ? 'text-red-500 font-bold' 
                            : isLowStock 
                            ? 'text-amber-500 font-semibold' 
                            : 'text-stone-500'
                        }`}>
                          {isOutOfStock ? 'Out of stock' : `${med.currentStock} in stock`}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart(med)}
                        disabled={isOutOfStock}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors ${
                          isOutOfStock
                            ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                            : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: POS CART & CHECKOUT TERMINAL (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col">
            
            {/* Patient Header Details */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                    Patient & Consultation Details
                  </span>
                </div>
                <span className="text-[11px] font-mono text-stone-500">
                  Inv #{company.invoicePrefix}{company.nextInvoiceNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Patient Name *"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="Mobile Number"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="Age (Yrs)"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value={company.doctorInCharge}>{company.doctorInCharge}</option>
                    {doctors.filter(d => d.name !== company.doctorInCharge).map(d => (
                      <option key={d.id} value={d.name}>{d.name} ({d.role})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="p-4 flex-1 max-h-[300px] overflow-y-auto space-y-3">
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <Receipt className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">Cart is empty</p>
                  <p className="text-[11px] text-stone-400">Add medicines from catalog or prescribe a vial</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-semibold text-stone-900 dark:text-stone-100">
                          {item.name} {item.potency !== 'N/A' && `(${item.potency})`}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {item.packSize} · Batch: {item.batchNo}
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="font-bold text-stone-900 dark:text-stone-100">
                          {company.currencySymbol}{item.totalAmount}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          @{company.currencySymbol}{item.unitPrice}
                        </div>
                      </div>
                    </div>

                    {/* Dosage Label */}
                    <div>
                      <input
                        type="text"
                        value={item.dosageInstructions || ''}
                        onChange={(e) => handleUpdateDosage(idx, e.target.value)}
                        placeholder="Dosage instruction (e.g. 4 globules TDS)"
                        className="w-full px-2 py-0.5 text-[11px] rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 italic"
                      />
                    </div>

                    {/* Quantity & Discount & Delete */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, -1)}
                          className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-600 dark:text-stone-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono font-bold text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, 1)}
                          className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-600 dark:text-stone-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[11px] text-stone-500">
                          <Tag className="w-3 h-3" />
                          <span>Disc %</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.discountPercent}
                            onChange={(e) => handleUpdateDiscount(idx, parseFloat(e.target.value) || 0)}
                            className="w-12 px-1 py-0.5 text-xs text-center font-mono rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-stone-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Bill Summary */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 space-y-3">
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Taxable Value:</span>
                    <span>{company.currencySymbol}{cartTotals.taxableSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-400 text-[11px]">
                    <span>CGST ({company.defaultGstRate / 2}%):</span>
                    <span>{company.currencySymbol}{cartTotals.cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-400 text-[11px]">
                    <span>SGST ({company.defaultGstRate / 2}%):</span>
                    <span>{company.currencySymbol}{cartTotals.sgstAmount.toFixed(2)}</span>
                  </div>
                  {cartTotals.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Total Savings:</span>
                      <span>-{company.currencySymbol}{cartTotals.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base text-stone-900 dark:text-stone-100 pt-1.5 border-t border-stone-200 dark:border-stone-800">
                    <span>Grand Total:</span>
                    <span className="text-orange-600 dark:text-orange-400">
                      {company.currencySymbol}{cartTotals.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'CASH', label: 'Cash', icon: Banknote },
                      { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                      { id: 'CARD', label: 'Card', icon: CreditCard },
                      { id: 'DUE', label: 'Credit', icon: Clock },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = paymentMethod === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setPaymentMethod(mode.id as PaymentMethod)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-colors ${
                            isSelected
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Cash Tender Calculation */}
                  {paymentMethod === 'CASH' && (
                    <div className="p-2.5 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-700 dark:text-stone-300 font-medium">Cash Received:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono">{company.currencySymbol}</span>
                          <input
                            type="number"
                            value={cashTendered}
                            onChange={(e) => setCashTendered(e.target.value ? parseFloat(e.target.value) : '')}
                            placeholder={cartTotals.grandTotal.toString()}
                            className="w-24 px-2 py-1 text-sm font-mono font-bold text-right rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                          />
                        </div>
                      </div>

                      {/* Quick tender amount buttons */}
                      <div className="flex gap-1.5 justify-end">
                        {[cartTotals.grandTotal, 500, 1000, 2000].filter(n => n >= cartTotals.grandTotal).map((amt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCashTendered(amt)}
                            className="px-2 py-0.5 text-[10px] font-mono bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded hover:border-orange-500"
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>

                      {typeof cashTendered === 'number' && cashTendered > cartTotals.grandTotal && (
                        <div className="flex justify-between font-mono text-emerald-700 dark:text-emerald-400 font-bold pt-1 border-t border-orange-200 dark:border-orange-800">
                          <span>Change Due to Patient:</span>
                          <span>{company.currencySymbol}{changeDue.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* UPI QR Code Preview */}
                  {paymentMethod === 'UPI' && (
                    <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center gap-3">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(upiQrString)}`}
                        alt="UPI QR"
                        className="w-16 h-16 rounded border bg-white p-1"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">
                          Patient Scan & Pay
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          UPI ID: {company.upiId || 'similia@okhdfcbank'}
                        </span>
                        <span className="text-[10px] text-orange-600 dark:text-orange-400 font-mono mt-0.5 block">
                          Amount: {company.currencySymbol}{cartTotals.grandTotal}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Checkout Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleCheckout(true)}
                    disabled={isProcessing}
                    className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Complete Sale & Print Invoice ({company.currencySymbol}{cartTotals.grandTotal})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Custom Compound Builder Modal */}
      {showVialBuilder && (
        <CustomVialBuilderModal
          medicines={medicines}
          onAddToCart={handleAddCustomToCart}
          onClose={() => setShowVialBuilder(false)}
          currencySymbol={company.currencySymbol}
        />
      )}
    </div>
  );
};
