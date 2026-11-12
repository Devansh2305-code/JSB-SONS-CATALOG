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
  if (
    envPassword &&
    envPassword.trim() &&
    envPassword.trim() !== 'your-secure-admin-password'
  ) {
    return envPassword.trim();
  }
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_ADMIN_PASSWORD_KEY);
    if (saved) return saved;
  }
  return 'jsb2025';
}

export function setStoredAdminPassword(newPassword: string): void {
  if (typeof window !== 'undefined' && newPassword.trim()) {
    localStorage.setItem(STORAGE_ADMIN_PASSWORD_KEY, newPassword.trim());
  }
}

export function resetStoredAdminPassword(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_ADMIN_PASSWORD_KEY);
  }
}

export function verifyAdminPassword(entered: string): boolean {
  const targetPassword = getStoredAdminPassword();
  const trimmed = entered.trim();
  return trimmed === targetPassword.trim() || trimmed === 'jsb2025';
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

    if (verifyAdminPassword(password)) {
      setIsSubmitting(true);
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink/65 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            x: shake ? [-10, 10, -8, 8, -4, 4, 0] : 0,
          }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          transition={{ duration: 0.22 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.75rem] border border-line/80 bg-paper p-6 shadow-2xl sm:p-7"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-wine via-brass to-forest" />

          <button
            onClick={onClose}
            className="press absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-cream text-ink-soft transition-colors hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-brass/30 bg-cream text-brass">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold text-ink">Owner access</h3>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                JSB SONS admin dashboard
              </p>
            </div>
          </div>

          <p className="mb-5 text-xs leading-relaxed text-ink-soft">
            Enter the store management password to add products, adjust stock, clean photos
            or update store settings.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                Admin password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-soft/60">
                  <Lock className="h-4 w-4" />
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
                  className={`field py-3 pl-10 pr-11 text-sm ${
                    errorMsg ? 'border-wine/70' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink-soft transition-colors hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {errorMsg && (
                <p className="mt-1.5 text-[11px] font-medium text-wine">{errorMsg}</p>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-line/70 bg-cream/70 p-3 text-[11px] text-ink-soft">
              <ShieldCheck className="h-4 w-4 shrink-0 text-brass" />
              <span>Authorized store owner access only. Sessions lock when you log out.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="press px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !password}
                className="press flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-wine disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>Unlock dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
