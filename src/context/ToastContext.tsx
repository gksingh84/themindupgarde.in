'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between p-3.5 sm:p-4 rounded-xl shadow-2xl backdrop-blur-md border transition-all duration-300 animate-slide-up ${
        toast.type === 'success'
          ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50'
          : toast.type === 'error'
          ? 'bg-rose-950/95 border-rose-500/40 text-rose-100 shadow-rose-950/50'
          : 'bg-navy-950/95 border-amberBrand/40 text-slate-100 shadow-navy-950/50'
      }`}
      role="alert"
    >
      <div className="flex items-center gap-3 pr-2">
        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
        {toast.type === 'info' && <Info className="w-5 h-5 text-amberBrand shrink-0" />}
        <span className="text-xs sm:text-sm font-medium leading-snug">{toast.message}</span>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1.5 ml-2 hover:bg-white/10 active:bg-white/20 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const trimmed = (message || '').trim();
    if (!trimmed) return;

    setToasts((prev) => {
      // Deduplicate: Don't show identical message if already active
      if (prev.some((t) => t.message === trimmed)) {
        return prev;
      }
      const id = Math.random().toString(36).substring(2, 9);
      // Cap at 3 visible toasts max to prevent stacking
      const capped = prev.length >= 3 ? prev.slice(prev.length - 2) : prev;
      return [...capped, { id, message: trimmed, type }];
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
