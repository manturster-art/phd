'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

export function PasswordForm() {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const submit = () => {
    if (pw.length < 8) {
      toast.show('비밀번호는 8자 이상이어야 합니다', 'error');
      return;
    }
    if (pw !== pw2) {
      toast.show('비밀번호가 일치하지 않습니다', 'error');
      return;
    }
    const supabase = createClient();
    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) {
        toast.show('변경에 실패했어요', 'error');
        return;
      }
      toast.show('비밀번호를 변경했어요', 'success');
      router.replace('/me');
    });
  };

  return (
    <>
      <AppBar
        title="비밀번호 변경"
        leading="back"
        trailing={<Button size="sm" onClick={submit} loading={pending}>저장</Button>}
      />
      <div className="space-y-4 py-4">
        <TextField type="password" label="새 비밀번호" required hint="8자 이상" value={pw} onChange={(e) => setPw(e.target.value)} />
        <TextField type="password" label="새 비밀번호 확인" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </div>
    </>
  );
}
