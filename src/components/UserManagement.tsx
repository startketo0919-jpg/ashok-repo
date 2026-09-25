import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Users, 
  ShieldCheck, 
  Stethoscope, 
  Pill, 
  Boxes, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  KeyRound,
  Lock
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  currentUser: User | null;
  onSaveUser: (user: User) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onSwitchUser: (user: User) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onSwitchUser,
}) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return <ShieldCheck className="w-4 h-4 text-orange-500" />;
      case 'DOCTOR': return <Stethoscope className="w-4 h-4 text-emerald-500" />;
      case 'PHARMACIST': return <Pill className="w-4 h-4 text-blue-500" />;
      case 'INVENTORY_MANAGER': return <Boxes className="w-4 h-4 text-purple-500" />;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'DOCTOR':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'PHARMACIST':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'INVENTORY_MANAGER':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    }
  };

  const handleAddNew = () => {
    setEditingUser({
      id: 'USR-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      name: '',
      username: '',
      pin: '1234',
      role: 'PHARMACIST',
      email: '',
      phone: '',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser({ ...user });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.name.trim() || !editingUser.username.trim()) return;
    await onSaveUser(editingUser);
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const rolePowers = [
    {
      role: 'ADMIN',
      title: 'Clinic Owner & Super Admin',
      powers: [
        'Full administrative authority across all modules',
        'Clinic & GST configuration changes',
        'Staff account creation, pin reset, and privilege editing',
        'Cloud backup snapshots, exports, and database restore',
        'Deleting items, voids, and financial audit logs',
      ],
    },
    {
      role: 'DOCTOR',
      title: 'Physician / Prescribing Consultant',
      powers: [
        'POS billing and direct clinical prescribing',
        'Access to full remedy materia medica & potencies',
        'Patient consultation history and prescription notes',
        'Cannot modify GST rules or delete system users',
      ],
    },
    {
      role: 'PHARMACIST',
      title: 'Dispenser & Counter Cashier',
      powers: [
        'Speedy POS checkout and inventory search',
        'Dispense custom sugar globule phials and dilutions',
        'Cash tender, UPI QR generation, Card collection',
        'Print thermal receipts (80mm) and A4 invoices',
      ],
    },
    {
      role: 'INVENTORY_MANAGER',
      title: 'Stock Keeper & Store Manager',
      powers: [
        'Record stock inwards from manufacturers & distributors',
        'Manage batch numbers, expiry dates, and rack locations',
        'Track low stock radar and stock adjustment counts',
        'Export inventory ledger to Excel',
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>Staff Users & Role-Based Access Control (RBAC)</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Configure clinic staff members with distinct user powers and fast 4-digit terminal checkout PINs
          </p>
        </div>

        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* ROLE POWERS MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rolePowers.map((rp, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                {getRoleIcon(rp.role as UserRole)}
                <span className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                  {rp.role}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2">
                {rp.title}
              </h4>
              <ul className="space-y-1.5 text-[11px] text-stone-600 dark:text-stone-400">
                {rp.powers.map((p, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-1.5">
                    <span className="text-orange-500 font-bold">·</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* USER LIST TABLE */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Active Clinic Staff Accounts ({users.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 font-semibold text-stone-600 dark:text-stone-300 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Staff Name</th>
                <th className="py-3 px-3">Username</th>
                <th className="py-3 px-3">Role & Powers</th>
                <th className="py-3 px-3 text-center">Fast PIN</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {users.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <span>{u.name}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 rounded">
                            Current
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-stone-600 dark:text-stone-400">
                      @{u.username}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border ${getRoleBadge(u.role)}`}>
                        {getRoleIcon(u.role)}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-stone-700 dark:text-stone-300">
                      ••••
                    </td>

                    <td className="py-3 px-3 text-stone-600 dark:text-stone-400 text-[11px]">
                      <div>{u.email || '-'}</div>
                      <div className="font-mono text-stone-400">{u.phone || '-'}</div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        Active
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSwitchUser(u)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-orange-500 hover:text-white transition-colors"
                        >
                          Switch
                        </button>

                        {currentUser?.role === 'ADMIN' && (
                          <>
                            <button
                              onClick={() => handleEdit(u)}
                              title="Edit user details"
                              className="p-1.5 text-stone-400 hover:text-orange-600 rounded-lg transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {users.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete staff account ${u.name}?`)) {
                                    onDeleteUser(u.id);
                                  }
                                }}
                                title="Delete user"
                                className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT USER MODAL */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {editingUser.name ? `Edit Staff Member` : 'Add Clinic Staff Member'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  placeholder="e.g. Dr. Ananya Roy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value.toLowerCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
                    placeholder="ananya"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    4-Digit Fast PIN *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={editingUser.pin}
                    onChange={(e) => setEditingUser({ ...editingUser, pin: e.target.value })}
                    className="w-full px-3 py-2 text-center rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono tracking-widest"
                    placeholder="1234"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Assigned Role & Powers
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  <option value="ADMIN">ADMIN (Full Powers & Settings)</option>
                  <option value="DOCTOR">DOCTOR (Prescribing & Consultation)</option>
                  <option value="PHARMACIST">PHARMACIST (POS Billing & Dispensary)</option>
                  <option value="INVENTORY_MANAGER">INVENTORY_MANAGER (Stock & Purchase Inward)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    placeholder="user@clinic.com"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    placeholder="+91 98201 44521"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
