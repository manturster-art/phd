// SCR-ERR-NET / 서버 오류
'use client';

import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="app-container flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl" aria-hidden>⚠️</div>
        <h1 className="mt-4 text-xl font-semibold">일시적인 오류가 발생했어요</h1>
        <p className="mt-2 text-sm text-text-secondary">잠시 후에도 안 되면 임원에게 문의해주세요.</p>
        <Button className="mt-6" onClick={() => reset()}>다시 시도</Button>
      </div>
    </div>
  );
}
