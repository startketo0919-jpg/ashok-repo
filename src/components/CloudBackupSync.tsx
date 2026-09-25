import React, { useState } from 'react';
import { CompanySettings, ConnectedDevice } from '../types';
import { 
  Cloud, 
  CloudRain, 
  HardDriveDownload, 
  Upload, 
  Wifi, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw, 
  Laptop, 
  Smartphone, 
  Tablet,
  Clock,
  AlertCircle
} from 'lucide-react';

interface CloudBackupSyncProps {
  company: CompanySettings;
  syncStatus: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING';
  connectedDevices: ConnectedDevice[];
  totalMedicines: number;
  totalSales: number;
  totalUsers: number;
  onCreateSnapshot: () => Promise<{ success: boolean; message: string }>;
  onDownloadBackup: () => void;
  onRestoreBackup: (fileContent: any) => Promise<boolean>;
}

export const CloudBackupSync: React.FC<CloudBackupSyncProps> = ({
  company,
  syncStatus,
  connectedDevices,
  totalMedicines,
  totalSales,
  totalUsers,
  onCreateSnapshot,
  onDownloadBackup,
  onRestoreBackup,
}) => {
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [snapshotResult, setSnapshotResult] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  const handleCreateSnapshot = async () => {
    setIsSnapshotting(true);
    setSnapshotResult(null);
    try {
      const res = await onCreateSnapshot();
      setSnapshotResult(res.message || 'Cloud backup snapshot generated successfully.');
    } catch (e: any) {
      setSnapshotResult('Snapshot creation encountered an error: ' + e.message);
    } finally {
      setIsSnapshotting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreSuccess(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        await onRestoreBackup(json);
        setRestoreSuccess('Cloud backup successfully verified and restored!');
      } catch (err: any) {
        setRestoreError('Failed to restore backup: ' + (err.message || 'Invalid format'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getDeviceIcon = (name: string) => {
    if (name.includes('Mobile')) return <Smartphone className="w-4 h-4 text-orange-500" />;
    if (name.includes('Tablet') || name.includes('iPad')) return <Tablet className="w-4 h-4 text-emerald-500" />;
    return <Laptop className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <span>Cloud Backup & Multi-Device Real-Time Synchronization</span>
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Automatic cloud backup snapshots, offline exports, and live multi-terminal synchronization
        </p>
      </div>

      {/* SYNC & BACKUP STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Real-time sync engine */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Multi-Device Sync Status</span>
            <div className="p-1 rounded-full bg-emerald-50 text-emerald-600">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${syncStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="font-mono text-lg font-bold text-stone-900 dark:text-stone-100">
              {syncStatus === 'CONNECTED' ? 'Live Connected' : 'Offline / Reconnecting'}
            </span>
          </div>
          <p className="text-[11px] text-stone-500">
            All terminals, doctor tabs, and dispensary counters synchronize instantly via WebSocket.
          </p>
        </div>

        {/* Database records protected */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Protected Clinic Records</span>
            <div className="p-1 rounded-full bg-orange-50 text-orange-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-lg font-bold text-stone-900 dark:text-stone-100">
            {totalMedicines} SKUs · {totalSales} Bills
          </div>
          <p className="text-[11px] text-stone-500">
            Full transactional audit trail, inventory quantities, and GST accounts safeguarded.
          </p>
        </div>

        {/* Auto Snapshot Interval */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Automated Snapshots</span>
            <div className="p-1 rounded-full bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-lg font-bold text-stone-900 dark:text-stone-100">
            Continuous & Hourly
          </div>
          <p className="text-[11px] text-stone-500">
            Every billing and stock adjustment triggers server snapshot persistence automatically.
          </p>
        </div>

      </div>

      {/* CLOUD BACKUP ACTIONS & RESTORE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cloud Backup Snapshot & Download */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
            <Cloud className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Cloud Backup Operations
              </h3>
              <p className="text-xs text-stone-500">
                Create timestamped server snapshots and download offline JSON archives
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/60 text-xs text-stone-600 dark:text-stone-400">
              Backups include all company parameters, registered staff accounts, inventory remedies, batch numbers, and sales invoices.
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCreateSnapshot}
                disabled={isSnapshotting}
                className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                {isSnapshotting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                <span>Create Cloud Snapshot Now</span>
              </button>

              <button
                onClick={onDownloadBackup}
                className="flex-1 py-2.5 px-4 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <HardDriveDownload className="w-4 h-4 text-orange-500" />
                <span>Download Archive (.json)</span>
              </button>
            </div>

            {snapshotResult && (
              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                <span>{snapshotResult}</span>
              </div>
            )}
          </div>
        </div>

        {/* Restore from Backup */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
            <Upload className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Database Restoration
              </h3>
              <p className="text-xs text-stone-500">
                Restore clinical database from previously exported backup files
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300">
              <b>Important:</b> Restoring a backup overwrites current inventory and sales state across all connected devices in the clinic.
            </div>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-orange-500 rounded-xl cursor-pointer bg-stone-50 dark:bg-stone-800/40 transition-colors">
              <Upload className="w-8 h-8 text-stone-400 mb-2" />
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Click to browse or drop .json backup file
              </span>
              <span className="text-[10px] text-stone-400 mt-1">
                Supports verified Similia POS backup JSON files
              </span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {restoreError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}

            {restoreSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{restoreSuccess}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* LIVE CONNECTED DEVICES (MULTI-DEVICE PRESENCE) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Connected Devices ({connectedDevices.length})</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-xs text-stone-500">
              Real-time terminal sessions currently synchronized with clinic server
            </p>
          </div>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {connectedDevices.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400">
              Connecting to real-time sync server...
            </div>
          ) : (
            connectedDevices.map((dev) => (
              <div key={dev.id} className="p-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800">
                    {getDeviceIcon(dev.deviceName)}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900 dark:text-stone-100">
                      {dev.deviceName}
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono">
                      Client ID: {dev.id} · Role: {dev.role}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    Active & Synced
                  </span>
                  <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                    Connected: {new Date(dev.connectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
