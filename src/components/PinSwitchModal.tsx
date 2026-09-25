import React, { useState } from 'react';
import { User } from '../types';
import { KeyRound, X, Check, Lock } from 'lucide-react';

interface PinSwitchModalProps {
  users: User[];
  onSelectUser: (user: User) => void;
  onClose: () => void;
}

export const PinSwitchModal: React.FC<PinSwitchModalProps> = ({
  users,
  onSelectUser,
  onClose,
}) => {
  const [selectedUser, setSelectedUser] = useState<User>(users[0]);
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleKeyPress = (num: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);
      setErrorMessage('');
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin(enteredPin.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMessage('');
  };

  const verifyPin = (pin: string) => {
    if (selectedUser.pin === pin) {
      onSelectUser(selectedUser);
      onClose();
    } else {
      setErrorMessage('Incorrect PIN. Please re-enter.');
      setEnteredPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Fast POS Terminal Switch
              </h3>
              <p className="text-[11px] text-stone-500">
                Enter your 4-digit security PIN
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Selection */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
            Select Staff Member:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {users.map((u) => {
              const isSelected = selectedUser.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedUser(u);
                    setEnteredPin('');
                    setErrorMessage('');
                  }}
                  className={`p-2 rounded-xl text-left border text-xs transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-semibold'
                      : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <div className="truncate">{u.name}</div>
                  <div className="text-[10px] text-stone-400 font-mono">{u.role}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="py-2 text-center space-y-2">
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((idx) => {
              const filled = enteredPin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    filled
                      ? 'bg-orange-500 border-orange-500 scale-110'
                      : 'border-stone-300 dark:border-stone-600 bg-transparent'
                  }`}
                />
              );
            })}
          </div>

          {errorMessage && (
            <p className="text-xs font-semibold text-red-500">{errorMessage}</p>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (k === 'C') handleClear();
                else if (k === '⌫') handleBackspace();
                else handleKeyPress(k);
              }}
              className="py-3 text-base font-mono font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-600 transition-colors active:scale-95"
            >
              {k}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
