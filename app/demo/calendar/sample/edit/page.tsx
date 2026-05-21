// SCR-042 데모 — 일정 수정 (alert만 노출, 실제 저장 안 함)
'use client';

import { useState } from 'react';
import { AppBar } from '@/components/layout/AppBar';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextArea } from '@/components/ui/TextArea';
import { getDemoEvent } from '@/lib/demo/mockData';

// ISO → datetime-local 입력값 (yyyy-MM-ddTHH:mm, 로컬 시간 기준)
function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DemoEventEditPage() {
  // 데모: 첫 번째 이벤트(e-1: 종강 파티)로 고정.
  const event = getDemoEvent('e-1');
  const [title, setTitle] = useState(event?.title ?? '');
  const [startsAt, setStartsAt] = useState(isoToLocalInput(event?.starts_at ?? null));
  const [endsAt, setEndsAt] = useState(isoToLocalInput(event?.ends_at ?? null));
  const [location, setLocation] = useState(event?.location ?? '');
  const [desc, setDesc] = useState(event?.description_md ?? '');

  const submit = () => {
    if (!title.trim() || !startsAt) {
      alert('제목과 시작 일시를 입력하세요.');
      return;
    }
    alert('데모 모드입니다 — 일정은 실제로 저장되지 않습니다.');
  };

  return (
    <>
      <AppBar
        title="일정 수정"
        leading="back"
        trailing={<Button size="sm" onClick={submit}>저장</Button>}
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
