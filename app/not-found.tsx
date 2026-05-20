// SCR-ERR-404
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="app-container flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl" aria-hidden>🔍</div>
        <h1 className="mt-4 text-xl font-semibold">이 페이지를 찾을 수 없어요</h1>
        <Link href="/" className="mt-6 text-sm text-primary-500 hover:underline">
          홈으로 →
        </Link>
      </div>
    </div>
  );
}
