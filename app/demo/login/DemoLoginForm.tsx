// 데모 모드용 로그인 폼. 실제 인증 호출 없이 alert 만 띄운다.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

export function DemoLoginForm() {
  const [email, setEmail] = useState('jimin.kim@dept.ac.kr');
  const [password, setPassword] = useState('demo1234');
  const [showPw, setShowPw] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        alert('데모 모드입니다 — 실제 로그인은 수행되지 않습니다.');
      }}
      className="space-y-4"
      noValidate
    >
      <TextField
        type="email"
        label="이메일"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        type={showPw ? 'text' : 'password'}
        label="비밀번호"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        rightSlot={
          <button
            type="button"
            aria-label={showPw ? '비밀번호 숨김' : '비밀번호 표시'}
            aria-pressed={showPw}
            onClick={() => setShowPw((v) => !v)}
            className="text-sm text-text-secondary"
          >
            {showPw ? '🙈' : '👁️'}
          </button>
        }
      />
      <Button type="submit" fullWidth>
        로그인
      </Button>
      <div className="flex justify-center gap-3 text-sm">
        <span className="text-text-secondary">비밀번호 재설정</span>
        <span className="text-text-muted">·</span>
        <Link href="/demo/signup" className="text-primary-500 hover:underline">
          가입 신청
        </Link>
      </div>
    </form>
  );
}
