// SCR-065 데모 — 거래내역 업로드 + 매칭 결과 검토.
// 데모 모드: NEXT_PUBLIC_SUPABASE_URL 미설정/dummy 일 때 API 라우트가 모킹 응답.
'use client';

import { TransactionsUploadFlow } from '@/components/dues/TransactionsUploadFlow';

export default function DemoDuesUploadPage() {
  return <TransactionsUploadFlow />;
}
