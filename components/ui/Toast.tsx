// C-180 Toast (전역 컨텍스트 + Provider)
'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type Kind = 'info' | 'success' | 'error';
interface ToastItem { id: number; message: string; kind: Kind; }

interface ToastApi {
  show: (message: string, kind?: Kind) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, kind: Kind = 'info') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-toast flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto rounded-md px-4 py-2 text-sm text-white shadow-md',
              t.kind === 'success' && 'bg-success',
              t.kind === 'error' && 'bg-danger',
              t.kind === 'info' && 'bg-text-primary'
            )}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(ToastCtx);
  if (!v) return { show: () => {} };
  return v;
}
