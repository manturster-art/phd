import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // 모든 경로에서 동작하되 정적 자원·이미지 등은 제외
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js).*)',
  ],
};
