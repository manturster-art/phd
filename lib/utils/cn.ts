// 단순 className 결합 헬퍼 (clsx 의존성 회피)
export function cn(
  ...inputs: Array<string | number | false | null | undefined | Record<string, boolean | undefined | null>>
): string {
  const out: string[] = [];
  for (const v of inputs) {
    if (!v) continue;
    if (typeof v === 'string' || typeof v === 'number') {
      out.push(String(v));
    } else if (typeof v === 'object') {
      for (const [k, ok] of Object.entries(v)) {
        if (ok) out.push(k);
      }
    }
  }
  return out.join(' ');
}
