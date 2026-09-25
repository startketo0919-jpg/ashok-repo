import React, { useState } from 'react';
import { Medicine, CartItem, Potency, MedicineForm } from '../types';
import { X, Sparkles, Plus, Trash2, Check } from 'lucide-react';

interface CustomVialBuilderModalProps {
  medicines: Medicine[];
  onAddToCart: (item: CartItem) => void;
  onClose: () => void;
  currencySymbol: string;
}

export const CustomVialBuilderModal: React.FC<CustomVialBuilderModalProps> = ({
  medicines,
  onAddToCart,
  onClose,
  currencySymbol,
}) => {
  const [vialSize, setVialSize] = useState<'1 Dram' | '2 Dram' | '1/2 Oz' | '1 Oz'>('2 Dram');
  const [globuleSize, setGlobuleSize] = useState<'#30' | '#40' | 'Disks'>('#40');
  const [selectedRemedies, setSelectedRemedies] = useState<
    { remedyName: string; potency: Potency; drops: number }[]
  >([
    { remedyName: 'Arnica Montana', potency: '200C', drops: 6 },
  ]);
  const [dosageInstructions, setDosageInstructions] = useState('4 globules thrice daily before meals');
  const [customPrice, setCustomPrice] = useState(80);
  const [patientNotes, setPatientNotes] = useState('');

  // Remedies available in liquid dilution format
  const dilutionOptions = medicines.filter(m => m.form === 'Dilution (Liquid)' || m.form === 'Mother Tincture (Q)');

  const handleAddRemedy = () => {
    if (selectedRemedies.length >= 3) return;
    const defaultMed = dilutionOptions[0] || { name: 'Nux Vomica', potency: '200C' as Potency };
    setSelectedRemedies([
      ...selectedRemedies,
      { remedyName: defaultMed.name, potency: defaultMed.potency, drops: 4 },
    ]);
  };

  const handleRemoveRemedy = (index: number) => {
    if (selectedRemedies.length <= 1) return;
    setSelectedRemedies(selectedRemedies.filter((_, i) => i !== index));
  };

  const handleUpdateRemedy = (index: number, field: string, value: any) => {
    const updated = [...selectedRemedies];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedRemedies(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const compoundName = selectedRemedies.map(r => `${r.remedyName} ${r.potency}`).join(' + ');
    const fullTitle = `Medicated Vial (${vialSize}, Globules ${globuleSize}) - ${compoundName}`;

    const cartItem: CartItem = {
      id: 'CUSTOM-VIAL-' + Date.now(),
      medicineId: 'CUSTOM-DISPENSED',
      name: fullTitle,
      potency: selectedRemedies[0]?.potency || '200C',
      form: 'Medicated Globule Vial',
      manufacturer: 'Clinic Dispensary Compounding',
      batchNo: 'DISP-' + new Date().toISOString().slice(2, 10).replace(/-/g, ''),
      expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      packSize: vialSize,
      quantity: 1,
      unitPrice: customPrice,
      discountPercent: 0,
      gstRate: 5,
      taxableAmount: +(customPrice / 1.05).toFixed(2),
      gstAmount: +(customPrice - (customPrice / 1.05)).toFixed(2),
      totalAmount: customPrice,
      dosageInstructions: `${dosageInstructions}${patientNotes ? ` (${patientNotes})` : ''}`,
      isCustomCompound: true,
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Dispensary Medicated Phial Builder
              </h3>
              <p className="text-xs text-stone-500">
                Dispense customized sugar globule phials medicated with dilutions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Base Vial & Globule Size Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Phial Vial Size
              </label>
              <select
                value={vialSize}
                onChange={(e) => {
                  const size = e.target.value as any;
                  setVialSize(size);
                  if (size === '1 Dram') setCustomPrice(60);
                  else if (size === '2 Dram') setCustomPrice(80);
                  else if (size === '1/2 Oz') setCustomPrice(120);
                  else if (size === '1 Oz') setCustomPrice(180);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500"
              >
                <option value="1 Dram">1 Dram (approx. 4g)</option>
                <option value="2 Dram">2 Dram (approx. 8g - Standard)</option>
                <option value="1/2 Oz">1/2 Ounce (approx. 15g)</option>
                <option value="1 Oz">1 Ounce (approx. 30g)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Globules / Vehicle
              </label>
              <select
                value={globuleSize}
                onChange={(e) => setGlobuleSize(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500"
              >
                <option value="#40">Cane Sugar Globules #40 (Standard)</option>
                <option value="#30">Sugar Globules #30 (Small)</option>
                <option value="Disks">Milk Sugar Disks / Cones</option>
              </select>
            </div>
          </div>

          {/* Active Liquid Dilutions to Medicate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Medicate With Potency Dilutions (Up to 3)
              </label>
              {selectedRemedies.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddRemedy}
                  className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Remedy</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {selectedRemedies.map((remedy, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <div className="flex-1">
                    <input
                      type="text"
                      list="remedies-datalist"
                      value={remedy.remedyName}
                      onChange={(e) => handleUpdateRemedy(idx, 'remedyName', e.target.value)}
                      placeholder="e.g. Arnica Montana"
                      className="w-full px-2 py-1 text-xs rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                    />
                  </div>
                  <div className="w-24">
                    <select
                      value={remedy.potency}
                      onChange={(e) => handleUpdateRemedy(idx, 'potency', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                    >
                      <option value="30C">30C</option>
                      <option value="200C">200C</option>
                      <option value="1M">1M</option>
                      <option value="10M">10M</option>
                      <option value="6X">6X</option>
                      <option value="12X">12X</option>
                      <option value="0/1 (LM1)">LM 1</option>
                      <option value="0/6 (LM6)">LM 6</option>
                      <option value="Mother Tincture (Q)">Mother Tincture (Q)</option>
                    </select>
                  </div>
                  <div className="w-16">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={remedy.drops}
                      onChange={(e) => handleUpdateRemedy(idx, 'drops', parseInt(e.target.value) || 4)}
                      title="Drops added"
                      placeholder="Drops"
                      className="w-full px-1.5 py-1 text-xs text-center rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                    />
                  </div>
                  {selectedRemedies.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRemedy(idx)}
                      className="p-1 text-stone-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <datalist id="remedies-datalist">
              {medicines.map((m, i) => (
                <option key={i} value={m.name} />
              ))}
            </datalist>
          </div>

          {/* Dosage & Prescribing Instructions */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Dosage & Dispensing Label (Printed on Invoice)
            </label>
            <input
              type="text"
              value={dosageInstructions}
              onChange={(e) => setDosageInstructions(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              placeholder="e.g. 4 globules thrice daily before meals"
            />
            {/* Quick Dosage presets */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {[
                '4 globules TDS before meals',
                '4 globules BD (Morning & Night)',
                '4 globules HS (At Bedtime)',
                '1 dose weekly once in morning',
                'Dissolve in half glass water TDS',
              ].map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setDosageInstructions(preset)}
                  className="px-2 py-0.5 text-[10px] rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-orange-100 dark:hover:bg-orange-950/50 hover:text-orange-600 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Price setting */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60">
            <div>
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                Phial Dispensing Fee
              </span>
              <span className="text-[11px] text-stone-500">
                Inclusive of 5% Homoeo GST
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-stone-600">{currencySymbol}</span>
              <input
                type="number"
                min={0}
                value={customPrice}
                onChange={(e) => setCustomPrice(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 px-2 py-1 text-sm font-mono font-bold text-right rounded border border-orange-300 dark:border-orange-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Add Compound to Bill</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
