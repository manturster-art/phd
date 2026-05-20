// C-460 BankRuleBanner — 입금자명 규칙 안내 + 복사 버튼 (SCR-051, US-C02).
// Apple grammar:
//   - bg = primary-50, 1px hairline border, rounded-lg(18px)
//   - 본문 17px / 예시값 21px / 600
//   - 복사 액션은 text-link (Action Blue, 밑줄 호버)
//   - 카드 그림자 0
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface BankInfo {
  bank: string;
  account: string;
  owner: string;
}

interface Props {
  memberName: string;
  termLabel: string;
  bankInfo?: BankInfo;
  className?: string;
  onCopy?: () => void;
}

export function BankRuleBanner({
  memberName,
  termLabel,
  bankInfo,
  className,
  onCopy,
}: Props) {
  const example = `${memberName}/${termLabel}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(example);
      } else {
        // 폴백: textarea 트릭. 데모/구형 브라우저 대응.
        const el = document.createElement('textarea');
        el.value = example;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 거부 — UX는 무음 실패 (alert 대신 토스트는 호출자 책임)
    }
  };

  return (
    <section
      aria-label="입금자명 규칙 안내"
      className={cn(
        'rounded-lg border border-border bg-primary-50 px-6 py-5',
        className
      )}
    >
      <p className="text-sm font-semibold text-text-secondary">
        입금자명을 다음 형식으로 적어주세요
      </p>
      <p className="mt-3 text-lg font-semibold text-text-primary tracking-tight">
        {example}
      </p>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          aria-label="입금자명 예시 복사"
          className={cn(
            'inline-flex items-center gap-1 rounded-pill bg-transparent',
            'text-primary-500 text-sm font-normal underline-offset-2 hover:underline',
            'active:scale-95 transition-transform duration-fast ease-standard',
            'focus-visible:outline-none focus-visible:shadow-focus'
          )}
        >
          <span aria-hidden>📋</span>
          <span>복사하기</span>
        </button>
        <span aria-live="polite" className="text-xs text-success">
          {copied ? '복사되었습니다' : ''}
        </span>
      </div>

      {bankInfo && (
        <p className="mt-4 text-sm text-text-secondary">
          {bankInfo.bank} {bankInfo.account}
          <br />
          예금주: {bankInfo.owner}
        </p>
      )}
    </section>
  );
}
