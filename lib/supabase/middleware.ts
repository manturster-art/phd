import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/types/database';

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/reset',
  '/auth',
  '/_next',
  '/favicon',
  '/icons',
  '/manifest.webmanifest',
  '/sw.js',
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 세션 갱신: 토큰 자동 refresh
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 비공개 경로인데 비로그인 → /login
  if (!user && !isPublic(pathname) && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 로그인된 사용자가 인증 경로 진입하면 홈으로
  if (user && (pathname === '/login' || pathname === '/signup')) {
    // 단, status 검증 후 분기 — 일단 / 로 보내고 layout이 처리
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // status=pending 사용자는 /signup/pending으로 고정
  if (user && !isPublic(pathname) && pathname !== '/signup/pending') {
    const { data } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .maybeSingle();

    const profile = data as { status: string } | null;

    if (profile?.status === 'pending') {
      const url = request.nextUrl.clone();
      url.pathname = '/signup/pending';
      return NextResponse.redirect(url);
    }
    // v0.2: rejected 는 별도 reason 으로 분리 (suspended 와 다른 안내 표시).
    if (
      profile?.status === 'rejected' ||
      profile?.status === 'suspended' ||
      profile?.status === 'withdrawn'
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('reason', profile.status);
      return NextResponse.redirect(url);
    }
  }

  return response;
}
