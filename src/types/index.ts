export type UserRole = 'ADMIN' | 'DOCTOR' | 'PHARMACIST' | 'INVENTORY_MANAGER';

export interface User {
  id: string;
  name: string;
  username: string;
  pin: string; // 4-digit fast pin for switching at checkout
  role: UserRole;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export interface CompanySettings {
  name: string;
  regNumber: string;
  gstin: string;
  doctorInCharge: string;
  doctorQualifications: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  stateCode: string; // e.g. "27"
  pincode: string;
  currencySymbol: string; // "₹", "$", etc.
  invoicePrefix: string; // "SIM-"
  nextInvoiceNumber: number; // e.g. 1001
  defaultGstRate: number; // e.g. 5
  hsnCode: string; // "30049014"
  thermalReceiptWidth: '80mm' | '58mm';
  receiptFooterTerms: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string; // For instant payment QR code generation
  isSetupComplete: boolean;
}

export type Potency = 
  | 'Mother Tincture (Q)'
  | '3X'
  | '6X'
  | '12X'
  | '30X'
  | '200X'
  | '30C'
  | '200C'
  | '1M'
  | '10M'
  | '50M'
  | 'CM'
  | '0/1 (LM1)'
  | '0/6 (LM6)'
  | '0/30 (LM30)'
  | 'External / Ointment'
  | 'Syrup'
  | 'N/A';

export type MedicineForm = 
  | 'Dilution (Liquid)'
  | 'Mother Tincture (Q)'
  | 'Trituration Tablets'
  | 'Bio-chemic Tissue Salts'
  | 'Sugar Globules (#30 / #40)'
  | 'Medicated Globule Vial'
  | 'Syrup / Tonic'
  | 'Ointment / Cream'
  | 'Drops'
  | 'Special Combination';

export interface Medicine {
  id: string;
  name: string;
  potency: Potency;
  form: MedicineForm;
  manufacturer: string;
  batchNo: string;
  expiryDate: string; // YYYY-MM-DD
  packSize: string; // e.g. "30 ml", "100 ml", "25 g", "1 Dram"
  currentStock: number;
  minStockAlert: number;
  costPrice: number;
  sellingPrice: number;
  gstRate: number; // e.g. 5, 12, 0
  hsnCode: string;
  rackLocation: string;
  indications?: string;
  isCustomDispensed?: boolean;
}

export interface CartItem {
  id: string;
  medicineId: string;
  name: string;
  potency: Potency;
  form: MedicineForm;
  manufacturer: string;
  batchNo: string;
  expiryDate: string;
  packSize: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  gstRate: number;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  hsnCode?: string;
  dosageInstructions?: string; // e.g., "4 pills TDS before food"
  isCustomCompound?: boolean;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'DUE' | 'SPLIT';

export interface Sale {
  id: string;
  invoiceNumber: string;
  createdAt: string; // ISO
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM AM/PM
  patientName: string;
  patientPhone: string;
  patientAge?: string;
  patientGender?: 'Male' | 'Female' | 'Other';
  doctorRef?: string;
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  taxableSubtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
  grandTotal: number;
  roundOff: number;
  paymentMethod: PaymentMethod;
  cashPaid?: number;
  changeDue?: number;
  transactionRef?: string;
  cashierId: string;
  cashierName: string;
  status: 'PAID' | 'REFUNDED' | 'CANCELLED';
  notes?: string;
}

export interface GSTTaxSlab {
  id: string;
  name: string;
  rate: number;
  hsnCode: string;
  description: string;
}

export interface GSTSettings {
  gstin: string;
  stateCode: string;
  stateName: string;
  defaultRate: number;
  taxSlabs: GSTTaxSlab[];
  isInterStateDefault: boolean;
  enableEInvoicing: boolean;
}

export interface ConnectedDevice {
  id: string;
  deviceName: string;
  role: string;
  connectedAt: string;
}

export interface CloudBackupMetadata {
  id: string;
  timestamp: string;
  fileName: string;
  recordCount: {
    medicines: number;
    sales: number;
    users: number;
  };
  totalRevenue: number;
}
