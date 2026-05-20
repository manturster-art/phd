'use client';

import { TransactionsUploadFlow } from '@/components/dues/TransactionsUploadFlow';

// 운영 환경에서도 데모와 동일한 흐름을 사용 (인증·권한은 page.tsx 에서 가드).
export function TransactionsUploadClient() {
  return <TransactionsUploadFlow />;
}
