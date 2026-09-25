import React, { useState } from 'react';
import { CompanySettings, User } from '../types';
import { ApothecaryEmblem } from './ApothecaryIcon';
import { 
  Building2, 
  UserCheck, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (company: CompanySettings, adminUser: User, importSampleInventory: boolean) => void;
  initialCompany: CompanySettings;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  initialCompany,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Company Form State
  const [company, setCompany] = useState<CompanySettings>({
    ...initialCompany,
    name: initialCompany.name || 'Similia Homoeopathic Healthcare & Dispensary',
    regNumber: initialCompany.regNumber || 'HOM-REG-2024-8841',
    gstin: initialCompany.gstin || '27AAACH7409R1ZZ',
    doctorInCharge: initialCompany.doctorInCharge || 'Dr. S. K. Mukherjee, BHMS, MD (Hom.)',
    doctorQualifications: initialCompany.doctorQualifications || 'Senior Homoeopathic Physician',
    phone: initialCompany.phone || '+91 98201 44521',
    email: initialCompany.email || 'care@similiahomeo.com',
    address: initialCompany.address || 'Suite 104, Hahnemann Medical Enclave',
    city: initialCompany.city || 'Mumbai',
    state: initialCompany.state || 'Maharashtra',
    stateCode: '27',
    pincode: '400001',
    currencySymbol: '₹',
    invoicePrefix: 'SIM-26-',
    nextInvoiceNumber: 1001,
    defaultGstRate: 5,
    hsnCode: '30049014',
    thermalReceiptWidth: '80mm',
    receiptFooterTerms: 'Medicines once sold cannot be returned. Store away from camphor, menthol and strong odors.',
    upiId: 'similiaclinic@okhdfcbank',
    isSetupComplete: false,
  });

  // Admin User Form State
  const [adminUser, setAdminUser] = useState<User>({
    id: 'USR-ADMIN-' + Date.now().toString().slice(-4),
    name: 'Dr. S. K. Mukherjee',
    username: 'admin',
    pin: '1234',
    role: 'ADMIN',
    email: 'startketo0919@gmail.com',
    phone: '+91 98201 44521',
    isActive: true,
    createdAt: new Date().toISOString(),
  });

  // Seed inventory checkbox
  const [importSampleInventory, setImportSampleInventory] = useState(true);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.name.trim()) return;
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser.name.trim() || !adminUser.username.trim() || !adminUser.pin.trim()) return;
    setStep(3);
  };

  const handleFinish = () => {
    onComplete(company, adminUser, importSampleInventory);
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col items-center justify-center p-4 sm:p-6 text-stone-900 dark:text-stone-100">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
              <ApothecaryEmblem className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Similia POS Setup Wizard</h1>
              <p className="text-xs text-orange-100 mt-0.5">
                Register your clinic, establish your administrator, and initialize real-time synchronization
              </p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/20 text-xs">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-white font-semibold' : 'text-orange-200 opacity-60'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-white text-orange-600 font-bold' : 'bg-white/20 text-white'}`}>
                1
              </div>
              <span>Clinic Details</span>
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-white font-semibold' : 'text-orange-200 opacity-60'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-white text-orange-600 font-bold' : 'bg-white/20 text-white'}`}>
                2
              </div>
              <span>Admin Profile</span>
            </div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-white font-semibold' : 'text-orange-200 opacity-60'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 3 ? 'bg-white text-orange-600 font-bold' : 'bg-white/20 text-white'}`}>
                3
              </div>
              <span>Remedy Stock</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {/* STEP 1: COMPANY REGISTRATION */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400">
                <Building2 className="w-4 h-4" />
                <span>Register Clinic & Practice</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Clinic / Dispensary Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. Dr. Hahnemann Homoeopathic Clinic"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Medical Reg / License No.
                  </label>
                  <input
                    type="text"
                    value={company.regNumber}
                    onChange={(e) => setCompany({ ...company, regNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. HOM/REG/2024/88"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Clinic GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={company.gstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      const code = val.length >= 2 ? val.slice(0, 2) : company.stateCode;
                      setCompany({ ...company, gstin: val, stateCode: code });
                    }}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="27AAACH7409R1ZZ"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Doctor In-Charge
                  </label>
                  <input
                    type="text"
                    value={company.doctorInCharge}
                    onChange={(e) => setCompany({ ...company, doctorInCharge: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Dr. S. K. Mukherjee, BHMS, MD"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Contact Phone / Mobile *
                  </label>
                  <input
                    type="text"
                    required
                    value={company.phone}
                    onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="+91 98201 44521"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Clinic Address & City
                  </label>
                  <input
                    type="text"
                    value={company.address}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Suite 104, Hahnemann Medical Centre"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={company.currencySymbol}
                    onChange={(e) => setCompany({ ...company, currencySymbol: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="₹"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    UPI ID for Counter QR
                  </label>
                  <input
                    type="text"
                    value={company.upiId || ''}
                    onChange={(e) => setCompany({ ...company, upiId: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="clinic@okhdfcbank"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium text-sm rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                >
                  <span>Continue to Admin Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: CREATE ADMIN USER */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400">
                <UserCheck className="w-4 h-4" />
                <span>Create Primary Administrator User</span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                This administrator will have highest administrative powers (managing clinic settings, GST, financial audits, staff roles, and cloud backup).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUser.name}
                    onChange={(e) => setAdminUser({ ...adminUser, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. Dr. S. K. Mukherjee"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Login Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUser.username}
                    onChange={(e) => setAdminUser({ ...adminUser, username: e.target.value.toLowerCase() })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="admin"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    4-Digit POS Fast PIN *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={adminUser.pin}
                    onChange={(e) => setAdminUser({ ...adminUser, pin: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono tracking-widest text-center rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="1234"
                  />
                  <span className="text-[10px] text-stone-500">Quick numeric PIN for terminal authorization</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    User Role
                  </label>
                  <div className="px-3 py-2 text-xs font-semibold rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>ADMIN (Super User & Clinic Owner)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={adminUser.email}
                    onChange={(e) => setAdminUser({ ...adminUser, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="doctor@clinic.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={adminUser.phone}
                    onChange={(e) => setAdminUser({ ...adminUser, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="+91 98201 44521"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium text-sm rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                >
                  <span>Continue to Inventory</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: INITIAL INVENTORY & CONFIRMATION */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400">
                <Sparkles className="w-4 h-4" />
                <span>Initialize Dispensary Stock & Features</span>
              </div>

              {/* Seed Catalog card */}
              <div 
                onClick={() => setImportSampleInventory(!importSampleInventory)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  importSampleInventory
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border ${
                    importSampleInventory ? 'bg-orange-600 border-orange-600 text-white' : 'border-stone-400'
                  }`}>
                    {importSampleInventory && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      Seed 20+ Essential Homoeopathic Remedies
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                      Recommended: Includes top remedies (Arnica 200C, Nux Vomica 200C, Belladonna, Rhus Tox, Bryonia, Mother Tinctures, Calendula Ointment, Five Phos 6X, and Sugar Globules) with realistic batch numbers, HSN 30049014 codes, and rack locations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Features summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60">
                  <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-medium mb-1">
                    <Receipt className="w-4 h-4 text-orange-500" />
                    <span>Invoicing Ready</span>
                  </div>
                  <p className="text-stone-500 dark:text-stone-400">
                    Thermal receipt (80mm/58mm) and GST-compliant A4 Tax Invoices with UPI QR code.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60">
                  <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-medium mb-1">
                    <FileSpreadsheet className="w-4 h-4 text-orange-500" />
                    <span>Excel & PDF Exports</span>
                  </div>
                  <p className="text-stone-500 dark:text-stone-400">
                    Daily sales logs, GSTR reports, and inventory valuation exported in one click.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold text-sm rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Launch Similia Clinic POS</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
