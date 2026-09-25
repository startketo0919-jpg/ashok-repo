import React, { useState, useMemo } from 'react';
import { Medicine, CompanySettings, User, Potency, MedicineForm } from '../types';
import { exportInventoryToExcel } from '../utils/exportUtils';
import { 
  Boxes, 
  Search, 
  Plus, 
  Minus, 
  AlertTriangle, 
  FileSpreadsheet, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  TrendingDown, 
  Calendar,
  Layers,
  ArrowDownToLine
} from 'lucide-react';

interface InventoryManagementProps {
  medicines: Medicine[];
  company: CompanySettings;
  currentUser: User | null;
  onSaveMedicine: (medicine: Medicine) => Promise<void>;
  onDeleteMedicine: (medicineId: string) => Promise<void>;
  onAdjustStock: (medicineId: string, delta: number) => Promise<void>;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  medicines,
  company,
  currentUser,
  onSaveMedicine,
  onDeleteMedicine,
  onAdjustStock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [formFilter, setFormFilter] = useState<string>('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);

  // Edit/Add modal state
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Stock Inward modal state
  const [inwardMedicine, setInwardMedicine] = useState<Medicine | null>(null);
  const [inwardQty, setInwardQty] = useState<number>(10);
  const [inwardBatch, setInwardBatch] = useState<string>('');

  // Check user powers (Only Admin and Inventory Manager can edit or inward stock)
  const canEditStock = currentUser?.role === 'ADMIN' || currentUser?.role === 'INVENTORY_MANAGER';
  const canDeleteStock = currentUser?.role === 'ADMIN';

  // Expiry check threshold (90 days)
  const now = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(now.getDate() + 90);

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.potency.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q) ||
        m.batchNo.toLowerCase().includes(q) ||
        m.rackLocation.toLowerCase().includes(q);

      const matchesForm = formFilter === 'ALL' || m.form === formFilter;
      const matchesLowStock = !showLowStockOnly || m.currentStock <= m.minStockAlert;
      
      const expDate = new Date(m.expiryDate);
      const matchesExpiring = !showExpiringOnly || expDate <= ninetyDaysFromNow;

      return matchesSearch && matchesForm && matchesLowStock && matchesExpiring;
    });
  }, [medicines, searchQuery, formFilter, showLowStockOnly, showExpiringOnly]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalSKUs = medicines.length;
    const totalUnits = medicines.reduce((acc, m) => acc + m.currentStock, 0);
    const totalCostValue = medicines.reduce((acc, m) => acc + (m.currentStock * m.costPrice), 0);
    const totalMrpValue = medicines.reduce((acc, m) => acc + (m.currentStock * m.sellingPrice), 0);
    const lowStockCount = medicines.filter(m => m.currentStock <= m.minStockAlert).length;
    const outOfStockCount = medicines.filter(m => m.currentStock <= 0).length;
    const expiringCount = medicines.filter(m => new Date(m.expiryDate) <= ninetyDaysFromNow).length;

    return {
      totalSKUs,
      totalUnits,
      totalCostValue,
      totalMrpValue,
      lowStockCount,
      outOfStockCount,
      expiringCount,
    };
  }, [medicines]);

  // Open New Remedy Modal
  const handleAddNew = () => {
    const newMed: Medicine = {
      id: 'MED-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      name: '',
      potency: '200C',
      form: 'Dilution (Liquid)',
      manufacturer: 'Dr. Reckeweg (Germany)',
      batchNo: 'REC-' + Math.floor(1000 + Math.random() * 9000),
      expiryDate: new Date(Date.now() + 4 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      packSize: '30 ml',
      currentStock: 10,
      minStockAlert: 5,
      costPrice: 200,
      sellingPrice: 300,
      gstRate: company.defaultGstRate || 5,
      hsnCode: company.hsnCode || '30049014',
      rackLocation: 'Rack A - Shelf 1',
      indications: '',
    };
    setEditingMedicine(newMed);
    setIsModalOpen(true);
  };

  const handleEdit = (med: Medicine) => {
    setEditingMedicine({ ...med });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedicine || !editingMedicine.name.trim()) return;
    await onSaveMedicine(editingMedicine);
    setIsModalOpen(false);
    setEditingMedicine(null);
  };

  // Stock Inward submit
  const handleInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardMedicine || inwardQty <= 0) return;
    const updated = {
      ...inwardMedicine,
      currentStock: inwardMedicine.currentStock + inwardQty,
      batchNo: inwardBatch.trim() ? inwardBatch.trim() : inwardMedicine.batchNo,
    };
    await onSaveMedicine(updated);
    setInwardMedicine(null);
  };

  const potencies: Potency[] = [
    'Mother Tincture (Q)', '30C', '200C', '1M', '10M', '50M', 'CM',
    '3X', '6X', '12X', '30X', '200X', '0/1 (LM1)', '0/6 (LM6)', '0/30 (LM30)',
    'External / Ointment', 'Syrup', 'N/A'
  ];

  const forms: MedicineForm[] = [
    'Dilution (Liquid)', 'Mother Tincture (Q)', 'Trituration Tablets',
    'Bio-chemic Tissue Salts', 'Sugar Globules (#30 / #40)',
    'Medicated Globule Vial', 'Syrup / Tonic', 'Ointment / Cream', 'Drops'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>Homoeopathic Inventory & Stock Control</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Monitor remedy potencies, batch numbers, expiry dates, and shelf rack locations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export to Excel */}
          <button
            onClick={() => exportInventoryToExcel(medicines, company)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Stock Excel</span>
          </button>

          {/* Add New Remedy */}
          {canEditStock && (
            <button
              onClick={handleAddNew}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Remedy</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total SKUs */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>Total Catalog SKUs</span>
            <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100">
            {metrics.totalSKUs}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Total Inventory: <span className="font-mono font-medium">{metrics.totalUnits} units</span>
          </div>
        </div>

        {/* Stock Valuation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>Stock Valuation (MRP)</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100">
            {company.currencySymbol}{metrics.totalMrpValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Cost Value: <span className="font-mono font-medium">{company.currencySymbol}{metrics.totalCostValue.toLocaleString()}</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>Low Stock Alerts</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400">
            {metrics.lowStockCount}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {metrics.outOfStockCount} remedies completely out of stock
          </div>
        </div>

        {/* Expiring in 90 Days */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>Expiring &lt; 90 Days</span>
            <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-red-600 dark:text-red-400">
            {metrics.expiringCount}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Immediate dispensary replenishment needed
          </div>
        </div>

      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by remedy name, potency (200C), rack location, batch..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Quick Filter Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
                showLowStockOnly
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock ({metrics.lowStockCount})</span>
            </button>

            <button
              onClick={() => setShowExpiringOnly(!showExpiringOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
                showExpiringOnly
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Expiring Soon ({metrics.expiringCount})</span>
            </button>
          </div>
        </div>

        {/* Category Form Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {['ALL', ...forms].map((form) => {
            const isSelected = formFilter === form;
            return (
              <button
                key={form}
                onClick={() => setFormFilter(form)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-orange-500 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                {form === 'ALL' ? 'All Remedy Forms' : form}
              </button>
            );
          })}
        </div>
      </div>

      {/* REMEDY INVENTORY TABLE */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 font-semibold text-stone-600 dark:text-stone-300 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Remedy & Form</th>
                <th className="py-3 px-3">Potency</th>
                <th className="py-3 px-3">Manufacturer</th>
                <th className="py-3 px-3">Batch & Expiry</th>
                <th className="py-3 px-3">Rack Shelf</th>
                <th className="py-3 px-3 text-center">Stock Level</th>
                <th className="py-3 px-3 text-right">Cost</th>
                <th className="py-3 px-3 text-right">MRP</th>
                <th className="py-3 px-2 text-center">GST %</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-stone-400">
                    No medicines match the selected filter criteria
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((med) => {
                  const isOutOfStock = med.currentStock <= 0;
                  const isLowStock = med.currentStock <= med.minStockAlert;
                  const isExpiring = new Date(med.expiryDate) <= ninetyDaysFromNow;

                  return (
                    <tr key={med.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                      {/* Name & Pack */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-sm text-stone-900 dark:text-stone-100">{med.name}</div>
                        <div className="text-[11px] text-stone-500 font-normal">
                          {med.form} · {med.packSize}
                        </div>
                      </td>

                      {/* Potency */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
                          {med.potency}
                        </span>
                      </td>

                      {/* Manufacturer */}
                      <td className="py-3 px-3 text-stone-600 dark:text-stone-400">
                        {med.manufacturer}
                      </td>

                      {/* Batch & Expiry */}
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="text-stone-700 dark:text-stone-300 font-medium">{med.batchNo}</div>
                        <div className={`${isExpiring ? 'text-red-500 font-bold' : 'text-stone-400'}`}>
                          Exp: {med.expiryDate}
                        </div>
                      </td>

                      {/* Rack Location */}
                      <td className="py-3 px-3 font-mono text-[11px] text-stone-600 dark:text-stone-400">
                        {med.rackLocation}
                      </td>

                      {/* Stock Level with Quick Adjust */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {canEditStock && (
                            <button
                              onClick={() => onAdjustStock(med.id, -1)}
                              disabled={med.currentStock <= 0}
                              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                          )}

                          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                            isOutOfStock
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                              : isLowStock
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                          }`}>
                            {med.currentStock}
                          </span>

                          {canEditStock && (
                            <button
                              onClick={() => onAdjustStock(med.id, 1)}
                              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
                          Min Alert: {med.minStockAlert}
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 text-right font-mono text-stone-500">
                        {company.currencySymbol}{med.costPrice}
                      </td>

                      {/* MRP */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-900 dark:text-stone-100">
                        {company.currencySymbol}{med.sellingPrice}
                      </td>

                      {/* GST */}
                      <td className="py-3 px-2 text-center font-mono text-stone-500">
                        {med.gstRate}%
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canEditStock && (
                            <>
                              {/* Stock Inward button */}
                              <button
                                onClick={() => {
                                  setInwardMedicine(med);
                                  setInwardQty(10);
                                  setInwardBatch(med.batchNo);
                                }}
                                title="Stock Inward / Restock"
                                className="p-1.5 text-stone-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg transition-colors"
                              >
                                <ArrowDownToLine className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleEdit(med)}
                                title="Edit details"
                                className="p-1.5 text-stone-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {canDeleteStock && (
                            <button
                              onClick={() => {
                                if (confirm(`Remove ${med.name} ${med.potency} from inventory?`)) {
                                  onDeleteMedicine(med.id);
                                }
                              }}
                              title="Delete remedy"
                              className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT REMEDY MODAL */}
      {isModalOpen && editingMedicine && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {editingMedicine.name ? `Edit ${editingMedicine.name}` : 'Add New Homoeopathic Remedy'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                
                <div className="col-span-2">
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Remedy Botanical / Chemical Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMedicine.name}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, name: e.target.value })}
                    placeholder="e.g. Arnica Montana"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Potency
                  </label>
                  <select
                    value={editingMedicine.potency}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, potency: e.target.value as Potency })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    {potencies.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Form / Delivery
                  </label>
                  <select
                    value={editingMedicine.form}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, form: e.target.value as MedicineForm })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    {forms.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Manufacturer / Pharmacy
                  </label>
                  <input
                    type="text"
                    value={editingMedicine.manufacturer}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, manufacturer: e.target.value })}
                    placeholder="Dr. Reckeweg / SBL / Schwabe"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Pack Size
                  </label>
                  <input
                    type="text"
                    value={editingMedicine.packSize}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, packSize: e.target.value })}
                    placeholder="30 ml / 100 ml / 25 g / 1 Dram"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={editingMedicine.batchNo}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, batchNo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={editingMedicine.expiryDate}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Current Stock Quantity
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingMedicine.currentStock}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Min Stock Threshold Alert
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingMedicine.minStockAlert}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, minStockAlert: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Purchase Cost Price ({company.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingMedicine.costPrice}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Selling Price / MRP ({company.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingMedicine.sellingPrice}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    GST Tax Slab %
                  </label>
                  <select
                    value={editingMedicine.gstRate}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, gstRate: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    <option value={5}>5% (Homoeopathic Medicament)</option>
                    <option value={12}>12% (Medicated Tonics & Ointment)</option>
                    <option value={18}>18% (Dispensary Consumables)</option>
                    <option value={0}>0% (Exempt)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Rack / Shelf Location
                  </label>
                  <input
                    type="text"
                    value={editingMedicine.rackLocation}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, rackLocation: e.target.value })}
                    placeholder="e.g. Rack A - Shelf 2"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Clinical Indications & Keynotes
                  </label>
                  <input
                    type="text"
                    value={editingMedicine.indications || ''}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, indications: e.target.value })}
                    placeholder="e.g. Trauma, bruises, physical trauma, sore lame feeling"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm transition-colors"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK INWARD MODAL */}
      {inwardMedicine && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Record Stock Inward (Purchase)
              </h3>
              <button onClick={() => setInwardMedicine(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl text-xs space-y-1">
              <div className="font-bold text-stone-900 dark:text-stone-100">{inwardMedicine.name} ({inwardMedicine.potency})</div>
              <div className="text-stone-500">Current Stock: {inwardMedicine.currentStock} units · Rack: {inwardMedicine.rackLocation}</div>
            </div>

            <form onSubmit={handleInwardSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Quantity Received (Units)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={inwardQty}
                  onChange={(e) => setInwardQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Invoice / Batch Number
                </label>
                <input
                  type="text"
                  value={inwardBatch}
                  onChange={(e) => setInwardBatch(e.target.value)}
                  placeholder={inwardMedicine.batchNo}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInwardMedicine(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm"
                >
                  Confirm Inward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
