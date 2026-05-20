'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { createClient } from '@/lib/supabase/client';

const currentYear = new Date().getFullYear();

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력하세요').max(40),
  student_id: z.string().regex(/^\d+$/, '학번은 숫자만 입력하세요').min(4),
  cohort_year: z.coerce.number().int().min(1990).max(currentYear + 1),
  lab: z.string().optional(),
  phone: z.string().optional(),
  agree: z.literal(true, { errorMap: () => ({ message: '약관에 동의해주세요' }) }),
});
type FormValues = z.infer<typeof schema>;

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { cohort_year: currentYear } as Partial<FormValues>,
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    const supabase = createClient();
    startTransition(async () => {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
            student_id: values.student_id,
            cohort_year: String(values.cohort_year),
            lab: values.lab ?? '',
            phone: values.phone ?? '',
          },
        },
      });
      if (error) {
        if (error.message?.toLowerCase().includes('already')) {
          setServerError('이미 가입된 이메일입니다');
        } else {
          setServerError(error.message || '가입에 실패했어요');
        }
        return;
      }
      router.replace('/signup/pending');
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <TextField type="email" label="이메일" required inputMode="email" error={errors.email?.message} {...register('email')} />
      <TextField
        type={showPw ? 'text' : 'password'}
        label="비밀번호"
        required
        hint="8자 이상"
        error={errors.password?.message}
        rightSlot={
          <button type="button" onClick={() => setShowPw((v) => !v)} aria-label="비밀번호 표시 토글">
            {showPw ? '🙈' : '👁️'}
          </button>
        }
        {...register('password')}
      />
      <TextField label="이름" required error={errors.name?.message} {...register('name')} />
      <TextField label="학번" required inputMode="numeric" error={errors.student_id?.message} {...register('student_id')} />
      <TextField label="입학년도" required type="number" inputMode="numeric" error={errors.cohort_year?.message} {...register('cohort_year')} />
      <TextField label="연구실" error={errors.lab?.message} {...register('lab')} />
      <TextField label="연락처" placeholder="010-0000-0000" inputMode="tel" error={errors.phone?.message} {...register('phone')} />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('agree')} className="h-5 w-5" />
        <span>약관·개인정보 동의 <span className="text-danger">*</span></span>
      </label>
      {errors.agree?.message && <p className="text-xs text-danger" role="alert">{errors.agree.message}</p>}

      {serverError && <p className="text-sm text-danger" role="alert">{serverError}</p>}

      <Button type="submit" fullWidth loading={pending}>가입 신청하기</Button>
    </form>
  );
}
