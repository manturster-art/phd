'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    const supabase = createClient();
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) {
        setServerError('이메일 또는 비밀번호가 올바르지 않습니다');
        return;
      }
      router.replace('/');
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <TextField
        type="email"
        label="이메일"
        autoComplete="email"
        inputMode="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField
        type={showPw ? 'text' : 'password'}
        label="비밀번호"
        autoComplete="current-password"
        error={errors.password?.message}
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
        {...register('password')}
      />
      {serverError && (
        <p className="text-sm text-danger" role="alert">{serverError}</p>
      )}
      <Button type="submit" fullWidth loading={pending}>
        로그인
      </Button>
      <div className="flex justify-center gap-3 text-sm">
        <Link href="/reset" className="text-text-secondary hover:text-primary-500 hover:underline">
          비밀번호 재설정
        </Link>
        <span className="text-text-muted">·</span>
        <Link href="/signup" className="text-primary-500 hover:underline">
          가입 신청
        </Link>
      </div>
    </form>
  );
}
