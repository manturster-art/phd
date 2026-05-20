// 데모 모드용 가입 폼. 실제 가입은 수행하지 않으며 안내만 노출.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

export function DemoSignupForm() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!agree) {
          alert('약관에 동의해주세요.');
          return;
        }
        alert('데모 모드입니다 — 가입 신청 직후 화면으로 이동합니다.');
        router.push('/demo/pending');
      }}
    >
      <TextField
        type="email"
        label="이메일"
        required
        defaultValue="newbie@dept.ac.kr"
        inputMode="email"
      />
      <TextField
        type={showPw ? 'text' : 'password'}
        label="비밀번호"
        required
        hint="8자 이상"
        defaultValue="demo1234"
        rightSlot={
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label="비밀번호 표시 토글"
          >
            {showPw ? '🙈' : '👁️'}
          </button>
        }
      />
      <TextField label="이름" required defaultValue="최지훈" />
      <TextField
        label="학번"
        required
        inputMode="numeric"
        defaultValue="2026445566"
      />
      <TextField
        label="입학년도"
        required
        type="number"
        inputMode="numeric"
        defaultValue="2026"
      />
      <TextField label="연구실" defaultValue="강화학습 연구실" />
      <TextField
        label="연락처"
        placeholder="010-0000-0000"
        inputMode="tel"
        defaultValue="010-7777-1111"
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="h-5 w-5"
        />
        <span>
          약관·개인정보 동의 <span className="text-danger">*</span>
        </span>
      </label>

      <Button type="submit" fullWidth>
        가입 신청하기
      </Button>
    </form>
  );
}
