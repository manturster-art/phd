// =====================================================================
// lib/dues/demo-mode.ts
// 데모 모드 판정 — Supabase 환경변수가 더미/누락이면 데모로 판단.
// API 라우트는 데모 모드 시 실제 DB 호출을 건너뛰고 모킹 응답을 반환.
// =====================================================================

export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === '1') return true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !key) return true;
  if (url.includes('dummy') || key === 'dummy') return true;
  return false;
}
