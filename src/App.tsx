import React, { useState, useEffect } from 'react';
import { syncService, AppState } from './services/storage';
import { TopBar } from './components/TopBar';
import { OnboardingWizard } from './components/OnboardingWizard';
import { POSBilling } from './components/POSBilling';
import { SalesDashboard } from './components/SalesDashboard';
import { InventoryManagement } from './components/InventoryManagement';
import { GSTManagement } from './components/GSTManagement';
import { UserManagement } from './components/UserManagement';
import { CloudBackupSync } from './components/CloudBackupSync';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { PinSwitchModal } from './components/PinSwitchModal';
import { Sale, CompanySettings, User } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>(syncService.getState());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeInvoiceSale, setActiveInvoiceSale] = useState<Sale | null>(null);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('similia_theme') === 'dark';
  });

  // Subscribe to real-time state mutations
  useEffect(() => {
    const unsubscribeState = syncService.subscribe((newState) => {
      setAppState({ ...newState });
    });
    return () => {
      unsubscribeState();
    };
  }, []);

  // Sync Dark/Light theme class with html document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('similia_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('similia_theme', 'light');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // If startup onboarding is not complete, show the Wizard
  if (!appState.isInitialized) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <OnboardingWizard
          initialCompany={appState.company}
          onComplete={async (company, adminUser, importSampleInventory) => {
            await syncService.completeOnboarding(company, adminUser, importSampleInventory);
            setCurrentTab('dashboard'); // "followed by a dashboard for daily sales reporting"
          }}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors selection:bg-orange-500 selection:text-white`}>
      
      {/* 3-Zone Top Navigation Bar (Hidden during print) */}
      <div className="no-print">
        <TopBar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          currentUser={appState.currentUser}
          users={appState.users}
          onSwitchUser={(user) => syncService.setCurrentUser(user)}
          company={appState.company}
          syncStatus={syncService.syncStatus}
          connectedDevices={syncService.activeDevices}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          onOpenPinModal={() => setShowPinModal(true)}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'billing' && (
          <POSBilling
            medicines={appState.medicines}
            company={appState.company}
            currentUser={appState.currentUser}
            doctors={appState.users}
            onCompleteSale={(sale) => syncService.completeSale(sale)}
            onShowInvoice={(sale) => setActiveInvoiceSale(sale)}
          />
        )}

        {currentTab === 'dashboard' && (
          <SalesDashboard
            sales={appState.sales}
            company={appState.company}
            onViewInvoice={(sale) => setActiveInvoiceSale(sale)}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryManagement
            medicines={appState.medicines}
            company={appState.company}
            currentUser={appState.currentUser}
            onSaveMedicine={(medicine) => syncService.saveMedicine(medicine)}
            onDeleteMedicine={(medicineId) => syncService.deleteMedicine(medicineId)}
            onAdjustStock={(medicineId, delta) => syncService.adjustStock(medicineId, delta)}
          />
        )}

        {currentTab === 'gst' && (
          <GSTManagement
            company={appState.company}
            gstSettings={appState.gstSettings}
            sales={appState.sales}
            onUpdateGSTSettings={(settings) => syncService.updateGSTSettings(settings)}
            onUpdateCompany={(settings) => syncService.updateCompanySettings(settings)}
          />
        )}

        {currentTab === 'users' && (
          <UserManagement
            users={appState.users}
            currentUser={appState.currentUser}
            onSaveUser={(user) => syncService.saveUser(user)}
            onDeleteUser={(userId) => syncService.deleteUser(userId)}
            onSwitchUser={(user) => syncService.setCurrentUser(user)}
          />
        )}

        {currentTab === 'cloud' && (
          <CloudBackupSync
            company={appState.company}
            syncStatus={syncService.syncStatus}
            connectedDevices={syncService.activeDevices}
            totalMedicines={appState.medicines.length}
            totalSales={appState.sales.length}
            totalUsers={appState.users.length}
            onCreateSnapshot={() => syncService.createCloudSnapshot()}
            onDownloadBackup={() => syncService.downloadBackupFile()}
            onRestoreBackup={(fileContent) => syncService.restoreBackup(fileContent)}
          />
        )}
      </main>

      {/* Invoice Print & Download Modal (Thermal 80mm / A4) */}
      {activeInvoiceSale && (
        <InvoicePrintModal
          sale={activeInvoiceSale}
          company={appState.company}
          onClose={() => setActiveInvoiceSale(null)}
        />
      )}

      {/* Fast PIN Switch Handover Modal */}
      {showPinModal && (
        <PinSwitchModal
          users={appState.users}
          onSelectUser={(user) => syncService.setCurrentUser(user)}
          onClose={() => setShowPinModal(false)}
        />
      )}

      {/* Discreet Footer (Hidden during print) */}
      <footer className="no-print py-4 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{appState.company.name} · Classical Homoeopathic Practice</span>
          <span className="font-mono text-[11px]">
            Similia POS · Real-Time Multi-Device Sync Active · HSN 30049014
          </span>
        </div>
      </footer>

    </div>
  );
}
