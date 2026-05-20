'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextArea } from '@/components/ui/TextArea';
import { createClient } from '@/lib/supabase/client';
import { createPost } from '@/lib/api/posts';
import { useToast } from '@/components/ui/Toast';

export function PostEditor() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
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
        const id = await createPost(supabase, { title: title.trim(), body_md: body }, user.id);
        router.replace(`/board/${id}`);
        router.refresh();
      } catch {
        toast.show('등록에 실패했어요', 'error');
      }
    });
  };

  return (
    <>
      <AppBar
        title="글쓰기"
        leading="back"
        trailing={<Button size="sm" onClick={submit} loading={pending}>게시</Button>}
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
          required
        />
      </div>
    </>
  );
}
