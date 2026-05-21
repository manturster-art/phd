// C-180 Toast — Apple 그래머: near-black 알약 메시지.
// 그림자 금지(시스템 원칙) — 토스트는 액션 컬러로 의미 구분.
//
// QA P1-4: 액션 슬롯 지원. `show(message, kind, options)` 시그니처에
// `options.action`(label + onClick) 과 `options.durationMs` 추가.
// 액션이 있는 토스트는 자동 dismiss 까지 클릭하면 콜백 실행 후 즉시 사라진다.
// 기존 호출부 `show(message)` / `show(message, kind)` 호환 유지.
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils/cn';

type Kind = 'info' | 'success' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  kind: Kind;
  action?: ToastAction;
  durationMs: number;
}

export interface ToastOptions {
  /** 동작 가능한 [실행취소] 등 버튼. */
  action?: ToastAction;
  /** 자동 dismiss 시간 (ms). 기본 3000, 액션 있으면 5000. */
  durationMs?: number;
}

interface ToastApi {
  show: (message: string, kind?: Kind, options?: ToastOptions) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  // 타이머 핸들 — 액션 버튼 클릭 시 즉시 해제하기 위함.
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (message: string, kind: Kind = 'info', options?: ToastOptions) => {
      const id = Date.now() + Math.random();
      const durationMs =
        options?.durationMs ?? (options?.action ? 5000 : 3000);
      const item: ToastItem = {
        id,
        message,
        kind,
        action: options?.action,
        durationMs,
      };
      setItems((prev) => [...prev, item]);
      const handle = setTimeout(() => {
        timers.current.delete(id);
        setItems((prev) => prev.filter((x) => x.id !== id));
      }, durationMs);
      timers.current.set(id, handle);
    },
    []
  );

  // 언마운트 시 타이머 정리.
  useEffect(() => {
    const t = timers.current;
    return () => {
      t.forEach((handle) => clearTimeout(handle));
      t.clear();
    };
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
              'pointer-events-auto flex items-center gap-3 rounded-pill px-4 py-2 text-sm text-white',
              t.kind === 'success' && 'bg-success',
              t.kind === 'error' && 'bg-danger',
              t.kind === 'info' && 'bg-text-primary'
            )}
            role="status"
          >
            <span>{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
                // 44px 터치 타깃: 토스트 알약 안에서 시각적 균형을 위해 min-h 44 + 좌우 padding.
                className="inline-flex min-h-[44px] items-center rounded-pill border border-white/40 px-3 text-xs font-semibold text-white active:scale-95 transition-transform focus-visible:outline-none focus-visible:shadow-focus"
                aria-label={t.action.label}
              >
                {t.action.label}
              </button>
            )}
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
