// useFocusTrap — 열린 모달성 컨테이너 내부로 Tab/Shift+Tab 포커스를 가둔다.
// 의존성 없이 querySelector 기반으로 동작. (WCAG 2.4.3, P1-2)
//
// 사용:
//   const ref = useFocusTrap<HTMLDivElement>(open);
//   <div ref={ref} role="dialog" aria-modal="true">...</div>
//
// 동작:
//  - open === true 가 되는 시점에 컨테이너 내부 첫 focusable 요소로 자동 focus.
//  - Tab 키를 마지막 요소에서 누르면 첫 요소로 wrap, Shift+Tab 첫 요소에서 마지막으로 wrap.
//  - 닫힐 때(또는 unmount) 직전에 열렸던 요소(previousActive)로 포커스 복원.
//
// ESC 처리는 호출자가 별도로 한다 (이미 Sheet/ConfirmDialog 에 구현됨).
'use client';

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap<T extends HTMLElement>(
  open: boolean
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    const container = ref.current;
    if (!container) return;

    const previousActive =
      typeof document !== 'undefined'
        ? (document.activeElement as HTMLElement | null)
        : null;

    const getFocusable = (): HTMLElement[] => {
      const nodes = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      return Array.from(nodes).filter(
        (el) =>
          !el.hasAttribute('disabled') &&
          el.getAttribute('aria-hidden') !== 'true' &&
          el.offsetParent !== null
      );
    };

    // 자동 포커스 — 컨테이너 내부 첫 요소.
    // (이미 폼 내부에서 별도로 focus 한 경우는 setTimeout 으로 양보)
    const focusFirst = () => {
      const focusables = getFocusable();
      if (focusables.length === 0) {
        // fallback — 컨테이너 자체에 tabIndex=-1 부여 후 포커스
        container.setAttribute('tabindex', '-1');
        container.focus();
        return;
      }
      // 컨테이너 내부에 이미 포커스가 있으면 유지
      if (container.contains(document.activeElement)) return;
      focusables[0].focus();
    };
    const t = window.setTimeout(focusFirst, 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = getFocusable();
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      // 포커스 복원 (이전 요소가 여전히 문서에 있는 경우만)
      if (previousActive && document.body.contains(previousActive)) {
        try {
          previousActive.focus();
        } catch {
          // noop
        }
      }
    };
  }, [open]);

  return ref;
}
