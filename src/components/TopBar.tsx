import React, { useState } from 'react';
import { User, CompanySettings, ConnectedDevice } from '../types';
import { ApothecaryEmblem } from './ApothecaryIcon';
import { 
  Sun, 
  Moon, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  LogOut, 
  ChevronDown,
  Shield,
  Stethoscope,
  Pill,
  Boxes,
  KeyRound
} from 'lucide-react';

interface TopBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User | null;
  users: User[];
  onSwitchUser: (user: User) => void;
  company: CompanySettings;
  syncStatus: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING';
  connectedDevices: ConnectedDevice[];
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenPinModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  users,
  onSwitchUser,
  company,
  syncStatus,
  connectedDevices,
  isDarkMode,
  onToggleTheme,
  onOpenPinModal,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="w-3.5 h-3.5 text-orange-500" />;
      case 'DOCTOR': return <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />;
      case 'PHARMACIST': return <Pill className="w-3.5 h-3.5 text-blue-500" />;
      case 'INVENTORY_MANAGER': return <Boxes className="w-3.5 h-3.5 text-purple-500" />;
      default: return <Shield className="w-3.5 h-3.5 text-stone-500" />;
    }
  };

  const navLinks = [
    { id: 'billing', label: 'POS Billing' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'gst', label: 'GST Manager' },
    { id: 'users', label: 'Staff & Roles' },
    { id: 'cloud', label: 'Cloud & Sync' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* ZONE 1: BRAND ZONE (Single text element wordmark + subtle emblem) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <ApothecaryEmblem className="w-7 h-7 text-orange-600" size={30} />
          <button 
            onClick={() => onSelectTab('dashboard')}
            className="text-left group flex items-baseline gap-2"
          >
            <span className="text-base font-bold tracking-tight text-stone-900 dark:text-stone-100 group-hover:text-orange-600 transition-colors">
              Similia POS
            </span>
            <span className="hidden lg:inline text-xs text-stone-500 dark:text-stone-400 font-normal truncate max-w-[200px]">
              {company.name}
            </span>
          </button>
        </div>

        {/* ZONE 2: 4-6 CLEAN TEXT NAVIGATION LINKS (Single-line) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          {navLinks.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* ZONE 3: 1-2 PRIMARY ACTIONS & STATUS CONTROLS */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Real-time Multi-device Sync Status Indicator */}
          <button
            onClick={() => onSelectTab('cloud')}
            title={`Real-Time Cloud Sync: ${syncStatus} (${connectedDevices.length} device${connectedDevices.length === 1 ? '' : 's'} connected)`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:border-orange-300 transition-colors"
          >
            {syncStatus === 'CONNECTED' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  Live {connectedDevices.length > 1 ? `(${connectedDevices.length})` : ''}
                </span>
              </>
            ) : syncStatus === 'SYNCING' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                <span className="text-[11px] text-orange-600 dark:text-orange-400 font-mono">Syncing</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-[11px] text-stone-400 font-mono">Offline</span>
              </>
            )}
          </button>

          {/* Theme Switcher Toggle (Light / Dark) */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme mode"
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
            )}
          </button>

          {/* Active User Switcher / Powers Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700/80 bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700/60 transition-colors text-left"
            >
              <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                {getRoleIcon(currentUser?.role)}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <span className="block text-xs font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[110px]">
                  {currentUser?.name || 'User'}
                </span>
                <span className="block text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                  {currentUser?.role || 'Staff'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {/* Dropdown for Switch User / PIN authorization */}
            {showUserDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserDropdown(false)} 
                />
                <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 text-xs">
                    <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider block">Logged in as</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 block">{currentUser?.name}</span>
                    <span className="text-[11px] text-orange-600 dark:text-orange-400 font-mono">Role: {currentUser?.role}</span>
                  </div>

                  <div className="py-1">
                    <span className="px-3 py-1 text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                      Switch Terminal User
                    </span>
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg text-left transition-colors ${
                          u.id === currentUser?.id
                            ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-semibold'
                            : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {getRoleIcon(u.role)}
                          <span className="truncate">{u.name}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 uppercase font-mono">{u.role}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-1 border-t border-stone-100 dark:border-stone-800">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenPinModal();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-stone-500" />
                      <span>Lock / Fast PIN Switch</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation tab strip for smaller screens */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-stone-100 dark:border-stone-800 gap-1.5 no-scrollbar">
        {navLinks.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-orange-600 text-white'
                  : 'text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
