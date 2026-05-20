'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { createClient } from '@/lib/supabase/client';
import { updateMyProfile } from '@/lib/api/members';
import { useToast } from '@/components/ui/Toast';

interface Props {
  initial: {
    id: string;
    name: string;
    lab: string | null;
    phone: string | null;
    email: string;
    student_id: string | null;
  };
}

export function ProfileEditor({ initial }: Props) {
  const [name, setName] = useState(initial.name);
  const [lab, setLab] = useState(initial.lab ?? '');
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const submit = () => {
    if (!name.trim()) {
      toast.show('이름을 입력하세요', 'error');
      return;
    }
    const supabase = createClient();
    startTransition(async () => {
      try {
        await updateMyProfile(supabase, initial.id, {
          name: name.trim(),
          lab: lab.trim() || null,
          phone: phone.trim() || null,
        });
        toast.show('저장했어요', 'success');
        router.replace('/me');
        router.refresh();
      } catch {
        toast.show('저장에 실패했어요', 'error');
      }
    });
  };

  return (
    <>
      <AppBar
        title="프로필 수정"
        leading="back"
        trailing={<Button size="sm" onClick={submit} loading={pending}>저장</Button>}
      />
      <div className="space-y-4 py-4">
        <TextField label="이메일" value={initial.email} disabled readOnly hint="이메일은 변경할 수 없습니다" />
        <TextField label="학번" value={initial.student_id ?? ''} disabled readOnly />
        <TextField label="이름" required value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="연구실" value={lab} onChange={(e) => setLab(e.target.value)} />
        <TextField label="연락처" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
      </div>
    </>
  );
}
