'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextArea } from '@/components/ui/TextArea';
import { createClient } from '@/lib/supabase/client';
import { createEvent } from '@/lib/api/events';
import { useToast } from '@/components/ui/Toast';

export function EventEditor() {
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [location, setLocation] = useState('');
  const [desc, setDesc] = useState('');
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const submit = () => {
    if (!title.trim() || !startsAt) {
      toast.show('제목과 시작 일시를 입력하세요', 'error');
      return;
    }
    const supabase = createClient();
    startTransition(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('not_authenticated');
        const id = await createEvent(
          supabase,
          {
            title: title.trim(),
            starts_at: new Date(startsAt).toISOString(),
            ends_at: endsAt ? new Date(endsAt).toISOString() : null,
            location: location.trim() || null,
            description_md: desc.trim() || null,
          },
          user.id
        );
        router.replace(`/calendar/${id}`);
        router.refresh();
      } catch {
        toast.show('저장에 실패했어요', 'error');
      }
    });
  };

  return (
    <>
      <AppBar
        title="일정 등록"
        leading="back"
        trailing={<Button size="sm" onClick={submit} loading={pending}>저장</Button>}
      />
      <div className="space-y-4 py-4">
        <TextField label="제목" required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        <TextField
          label="시작 일시"
          required
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
        <TextField
          label="종료 일시 (선택)"
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
        />
        <TextField label="장소" value={location} onChange={(e) => setLocation(e.target.value)} />
        <TextArea label="설명" rows={6} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={10000} />
      </div>
    </>
  );
}
