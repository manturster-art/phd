import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // 데모 라우트(/demo/*)는 인증 검사 없이 통과한다 (Supabase 미연결 환경에서도 렌더링 가능).
  if (request.nextUrl.pathname.startsWith('/demo')) return NextResponse.next();
  return await updateSession(request);
}

export const config = {
  matcher: [
    // 모든 경로에서 동작하되 정적 자원·이미지 등은 제외
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js).*)',
  ],
};
