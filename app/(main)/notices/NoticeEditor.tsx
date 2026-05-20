'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextArea } from '@/components/ui/TextArea';
import { createClient } from '@/lib/supabase/client';
import { createNotice, updateNotice } from '@/lib/api/notices';
import { useToast } from '@/components/ui/Toast';

interface Props {
  mode: 'create' | 'edit';
  noticeId?: string;
  initial?: { title: string; body_md: string };
}

export function NoticeEditor({ mode, noticeId, initial }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body_md ?? '');
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const submit = () => {
    if (!title.trim() || !body.trim()) {
      toast.show('제목과 본문을 입력하세요', 'error');
      return;
    }
    const supabase = createClient();
    startTransition(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('not_authenticated');
        if (mode === 'create') {
          const id = await createNotice(supabase, { title: title.trim(), body_md: body }, user.id);
          router.replace(`/notices/${id}`);
          router.refresh();
        } else if (noticeId) {
          await updateNotice(supabase, noticeId, { title: title.trim(), body_md: body });
          router.replace(`/notices/${noticeId}`);
          router.refresh();
        }
      } catch (e) {
        toast.show('저장에 실패했어요', 'error');
      }
    });
  };

  return (
    <>
      <AppBar
        title={mode === 'create' ? '공지 작성' : '공지 수정'}
        leading="back"
        trailing={
          <Button size="sm" onClick={submit} loading={pending}>게시</Button>
        }
      />
      <div className="space-y-4 py-4">
        <TextField
          label="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
        />
        <TextArea
          label="본문"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          maxLength={20000}
          hint="마크다운을 입력할 수 있어요"
          required
        />
      </div>
    </>
  );
}
