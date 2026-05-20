'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutLink() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.replace('/login');
          router.refresh();
        })
      }
      className="block w-full px-4 py-3 text-left text-sm text-danger hover:bg-bg disabled:opacity-50"
    >
      로그아웃 →
    </button>
  );
}
