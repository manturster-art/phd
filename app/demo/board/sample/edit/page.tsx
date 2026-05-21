// SCR-032 데모 — 게시글 수정 (alert만 노출, 실제 저장 안 함)
'use client';

import { useState } from 'react';
import { AppBar } from '@/components/layout/AppBar';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextArea } from '@/components/ui/TextArea';
import { getDemoPostDetail } from '@/lib/demo/mockData';

export default function DemoPostEditPage() {
  const post = getDemoPostDetail('p-1');
  const [title, setTitle] = useState(post?.title ?? '');
  const [body, setBody] = useState(post?.body_md ?? '');

  const submit = () => {
    if (!title.trim() || !body.trim()) {
      alert('제목과 본문을 입력하세요.');
      return;
    }
    alert('데모 모드입니다 — 게시글은 실제로 저장되지 않습니다.');
  };

  return (
    <>
      <AppBar
        title="게시글 수정"
        leading="back"
        trailing={<Button size="sm" onClick={submit}>게시</Button>}
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
