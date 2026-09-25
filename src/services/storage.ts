import { 
  CompanySettings, 
  User, 
  Medicine, 
  Sale, 
  GSTSettings, 
  ConnectedDevice 
} from '../types';
import { 
  INITIAL_COMPANY_DATA, 
  INITIAL_MEDICINES, 
  INITIAL_USERS, 
  INITIAL_SAMPLE_SALES, 
  DEFAULT_GST_SLABS 
} from '../data/mockData';

export interface AppState {
  company: CompanySettings;
  users: User[];
  currentUser: User | null;
  medicines: Medicine[];
  sales: Sale[];
  gstSettings: GSTSettings;
  isInitialized: boolean;
}

const LOCAL_STORAGE_KEY = 'similia_pos_state_v1';

export class SyncService {
  private state: AppState;
  private ws: WebSocket | null = null;
  private listeners: Set<(state: AppState) => void> = new Set();
  private presenceListeners: Set<(devices: ConnectedDevice[]) => void> = new Set();
  private syncStatusListeners: Set<(status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING') => void> = new Set();
  private reconnectTimer: any = null;
  private isConnecting: boolean = false;
  private clientId: string = 'DEV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  public activeDevices: ConnectedDevice[] = [];
  public syncStatus: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' = 'DISCONNECTED';

  constructor() {
    this.state = this.loadLocalState();
    this.initServerState();
    this.connectWebSocket();
  }

  private loadLocalState(): AppState {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse local storage state:', e);
    }

    // Default initial state
    const defaultState: AppState = {
      company: INITIAL_COMPANY_DATA,
      users: INITIAL_USERS,
      currentUser: INITIAL_USERS[0],
      medicines: INITIAL_MEDICINES,
      sales: INITIAL_SAMPLE_SALES,
      gstSettings: {
        gstin: INITIAL_COMPANY_DATA.gstin,
        stateCode: INITIAL_COMPANY_DATA.stateCode,
        stateName: INITIAL_COMPANY_DATA.state,
        defaultRate: INITIAL_COMPANY_DATA.defaultGstRate,
        taxSlabs: DEFAULT_GST_SLABS,
        isInterStateDefault: false,
        enableEInvoicing: false,
      },
      isInitialized: false, // will ask to register company and create admin user on first run
    };

    return defaultState;
  }

  private saveLocalState(state: AppState) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to write to localStorage:', e);
    }
  }

  private async initServerState() {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.company) {
          // Server has established state; merge safely
          this.state = {
            ...json.data,
            currentUser: this.state.currentUser || json.data.users?.[0] || null,
          };
          this.saveLocalState(this.state);
          this.notify();
        }
      }
    } catch (e) {
      // Server may be starting or offline; local storage state is active
    }
  }

  private connectWebSocket() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) return;
    this.isConnecting = true;
    this.updateSyncStatus('SYNCING');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.updateSyncStatus('CONNECTED');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Send identity
        this.sendWsMessage({
          type: 'IDENTIFY',
          clientId: this.clientId,
          deviceName: navigator.userAgent.includes('Mobile') ? 'Mobile Terminal' : 'Counter POS',
          role: this.state.currentUser?.role || 'Admin',
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'SYNC_STATE' && data.state) {
            // Received state update from server / another terminal
            this.state = {
              ...data.state,
              currentUser: this.state.currentUser, // retain current local logged-in session
            };
            this.saveLocalState(this.state);
            this.notify();
          } else if (data.type === 'PRESENCE_UPDATE' && Array.isArray(data.devices)) {
            this.activeDevices = data.devices;
            this.presenceListeners.forEach(cb => cb(this.activeDevices));
          }
        } catch (e) {
          console.error('Error processing WS packet:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.updateSyncStatus('DISCONNECTED');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        this.updateSyncStatus('DISCONNECTED');
        this.ws?.close();
      };
    } catch (err) {
      this.isConnecting = false;
      this.updateSyncStatus('DISCONNECTED');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connectWebSocket();
      }, 4000);
    }
  }

  private sendWsMessage(msg: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private updateSyncStatus(status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING') {
    this.syncStatus = status;
    this.syncStatusListeners.forEach(cb => cb(status));
  }

  public subscribe(cb: (state: AppState) => void): () => void {
    this.listeners.add(cb);
    cb(this.state);
    return () => this.listeners.delete(cb);
  }

  public subscribePresence(cb: (devices: ConnectedDevice[]) => void): () => void {
    this.presenceListeners.add(cb);
    cb(this.activeDevices);
    return () => this.presenceListeners.delete(cb);
  }

  public subscribeSyncStatus(cb: (status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING') => void): () => void {
    this.syncStatusListeners.add(cb);
    cb(this.syncStatus);
    return () => this.syncStatusListeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.state));
  }

  public getState(): AppState {
    return this.state;
  }

  // Mutate and sync across all devices
  private async commitChange(actionName: string) {
    this.saveLocalState(this.state);
    this.notify();

    // 1. Broadcast via WebSocket
    this.sendWsMessage({
      type: 'STATE_CHANGE',
      state: this.state,
      action: actionName,
    });

    // 2. Persist via REST API for reliability
    try {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: this.state,
          action: actionName,
          clientId: this.clientId,
        }),
      }).catch(() => {});
    } catch (e) {}
  }

  // Initial Onboarding Registration
  public async completeOnboarding(company: CompanySettings, adminUser: User, importSampleInventory: boolean) {
    const medicines = importSampleInventory ? INITIAL_MEDICINES : [];
    const sales = importSampleInventory ? INITIAL_SAMPLE_SALES : [];
    
    this.state = {
      ...this.state,
      company: {
        ...company,
        isSetupComplete: true,
      },
      users: [adminUser, ...INITIAL_USERS.filter(u => u.username !== adminUser.username)],
      currentUser: adminUser,
      medicines: medicines.length > 0 ? medicines : this.state.medicines,
      sales: sales.length > 0 ? sales : [],
      isInitialized: true,
    };

    await this.commitChange('Company Registered & Admin Created');
  }

  // User Authentication & Switching
  public setCurrentUser(user: User) {
    this.state.currentUser = user;
    this.saveLocalState(this.state);
    this.notify();
    this.sendWsMessage({
      type: 'IDENTIFY',
      clientId: this.clientId,
      deviceName: navigator.userAgent.includes('Mobile') ? 'Mobile Terminal' : 'Counter POS',
      role: user.role,
    });
  }

  public async saveUser(user: User) {
    const index = this.state.users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      this.state.users[index] = user;
    } else {
      this.state.users.push(user);
    }
    await this.commitChange(`User ${user.name} saved`);
  }

  public async deleteUser(userId: string) {
    this.state.users = this.state.users.filter(u => u.id !== userId);
    await this.commitChange(`User deleted`);
  }

  // Company and GST Settings
  public async updateCompanySettings(settings: Partial<CompanySettings>) {
    this.state.company = { ...this.state.company, ...settings };
    await this.commitChange('Clinic settings updated');
  }

  public async updateGSTSettings(settings: GSTSettings) {
    this.state.gstSettings = settings;
    await this.commitChange('GST settings updated');
  }

  // Inventory Management
  public async saveMedicine(medicine: Medicine) {
    const idx = this.state.medicines.findIndex(m => m.id === medicine.id);
    if (idx >= 0) {
      this.state.medicines[idx] = medicine;
    } else {
      this.state.medicines.unshift(medicine);
    }
    await this.commitChange(`Medicine ${medicine.name} ${medicine.potency} saved`);
  }

  public async deleteMedicine(medicineId: string) {
    this.state.medicines = this.state.medicines.filter(m => m.id !== medicineId);
    await this.commitChange('Medicine removed from inventory');
  }

  public async adjustStock(medicineId: string, delta: number) {
    const med = this.state.medicines.find(m => m.id === medicineId);
    if (med) {
      med.currentStock = Math.max(0, med.currentStock + delta);
      await this.commitChange(`Stock adjusted for ${med.name}`);
    }
  }

  // POS Sale & Checkout Transaction (Atomic stock decrement)
  public async completeSale(sale: Sale): Promise<Sale> {
    // 1. Decrement inventory for sold items
    for (const item of sale.items) {
      if (item.medicineId && !item.isCustomCompound) {
        const med = this.state.medicines.find(m => m.id === item.medicineId);
        if (med) {
          med.currentStock = Math.max(0, med.currentStock - item.quantity);
        }
      }
    }

    // 2. Increment invoice number counter in company settings
    this.state.company.nextInvoiceNumber += 1;

    // 3. Prepend sale
    this.state.sales.unshift(sale);

    await this.commitChange(`Sale #${sale.invoiceNumber} completed (${sale.paymentMethod})`);
    return sale;
  }

  // Cloud Backup & Restore
  public async createCloudSnapshot(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/backup/snapshot', { method: 'POST' });
      const data = await res.json();
      return {
        success: data.success,
        message: data.message || 'Cloud backup snapshot saved on server.',
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Snapshot failed' };
    }
  }

  public downloadBackupFile() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      appName: 'Similia POS',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      clinic: this.state.company.name,
      state: this.state,
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `similia_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  public async restoreBackup(importedState: any): Promise<boolean> {
    if (!importedState || !importedState.company) {
      throw new Error('Invalid backup file structure');
    }
    const restored = importedState.state ? importedState.state : importedState;
    this.state = {
      ...restored,
      isInitialized: true,
      currentUser: this.state.currentUser || restored.users?.[0] || null,
    };
    await this.commitChange('Database restored from Cloud Backup');
    return true;
  }
}

export const syncService = new SyncService();
