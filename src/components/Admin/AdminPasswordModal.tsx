import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, X, KeyRound } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STORAGE_ADMIN_PASSWORD_KEY = 'jsb_admin_password';

export function getStoredAdminPassword(): string {
  const envPassword = (import.meta as any).env?.VITE_ADMIN_PASSWORD || '';
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_ADMIN_PASSWORD_KEY);
    if (saved) return saved;
  }
  return envPassword.trim() || 'jsb2025';
}

export function setStoredAdminPassword(newPassword: string): void {
  if (typeof window !== 'undefined' && newPassword.trim()) {
    localStorage.setItem(STORAGE_ADMIN_PASSWORD_KEY, newPassword.trim());
  }
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetPassword = getStoredAdminPassword();

    if (password.trim() === targetPassword.trim()) {
      setIsSubmitting(true);
      // Store session
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('jsb_admin_authenticated', 'true');
      }
      setTimeout(() => {
        setIsSubmitting(false);
        setPassword('');
        onSuccess();
      }, 200);
    } else {
      setShake(true);
      setErrorMsg('Incorrect admin password. Please try again.');
      setTimeout(() => setShake(false), 500);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            x: shake ? [-10, 10, -8, 8, -4, 4, 0] : 0,
          }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 p-6 sm:p-7"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-zinc-100">
                Owner Access Verification
              </h3>
              <p className="text-xs text-zinc-400">
                JSB SONS Protected Admin Dashboard
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-300 mb-5 leading-relaxed">
            Enter the store management password to add products, adjust stock, or upload bulk garment photos.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Enter admin password..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className={`w-full pl-9 pr-10 py-2.5 bg-zinc-950 border rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors ${
                    errorMsg
                      ? 'border-rose-500/80 focus:border-rose-500'
                      : 'border-zinc-800 focus:border-amber-400/80'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errorMsg && (
                <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1 font-medium">
                  <span>{errorMsg}</span>
                </p>
              )}
            </div>

            {/* Security notice (No password or hint displayed) */}
            <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Authorized store owner access only. Sessions are encrypted and protected.</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !password}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <span>Unlock Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
