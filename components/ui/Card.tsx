// Apple store-utility-card 그래머:
//  - 흰 배경, 1px hairline 보더, 18px 라운드, 그림자 없음.
import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface',
        className
      )}
      {...rest}
    />
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...rest} />;
}
