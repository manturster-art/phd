'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextArea } from '@/components/ui/TextArea';
import { createClient } from '@/lib/supabase/client';
import { createEvent, updateEvent } from '@/lib/api/events';
import { useToast } from '@/components/ui/Toast';

interface Props {
  mode?: 'create' | 'edit';
  eventId?: string;
  initial?: {
    title: string;
    starts_at: string; // ISO
    ends_at: string | null;
    location: string | null;
    description_md: string | null;
  };
}

// ISO → datetime-local 입력값 (yyyy-MM-ddTHH:mm, 로컬 KST 기준)
function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventEditor({ mode = 'create', eventId, initial }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [startsAt, setStartsAt] = useState(isoToLocalInput(initial?.starts_at ?? null));
  const [endsAt, setEndsAt] = useState(isoToLocalInput(initial?.ends_at ?? null));
  const [location, setLocation] = useState(initial?.location ?? '');
  const [desc, setDesc] = useState(initial?.description_md ?? '');
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
        const payload = {
          title: title.trim(),
          starts_at: new Date(startsAt).toISOString(),
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
          location: location.trim() || null,
          description_md: desc.trim() || null,
        };
        if (mode === 'create') {
          const id = await createEvent(supabase, payload, user.id);
          router.replace(`/calendar/${id}`);
          router.refresh();
        } else if (eventId) {
          await updateEvent(supabase, eventId, payload);
          router.replace(`/calendar/${eventId}`);
          router.refresh();
        }
      } catch {
        toast.show('저장에 실패했어요', 'error');
      }
    });
  };

  return (
    <>
      <AppBar
        title={mode === 'create' ? '일정 등록' : '일정 수정'}
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
