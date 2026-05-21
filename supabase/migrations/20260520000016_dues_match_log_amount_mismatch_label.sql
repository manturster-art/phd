-- =====================================================================
-- 20260520000016_dues_match_log_amount_mismatch_label.sql
-- 목적: QA P0-1 픽스 + PM 결정 사항 반영.
--   - dues_match_log.match_type CHECK 제약에 'amount_mismatch' 추가.
--   - 'conflict' 는 commit 응답 전용 라벨이므로 DB 에 저장되지 않는다 (CHECK 미추가).
--   - 'amount_mismatch' 는 정상적으로는 commit 단계에서 status 검사로 걸러져
--     match_log 에 기록되지 않지만, 향후 임원 수동 매칭 (manual + partial 처리)
--     도입 시 라벨 유연성을 위해 사전 허용한다.
-- 원칙: add-only. 기존 마이그레이션 (20260520000015) 은 수정하지 않는다.
-- =====================================================================

do $$
declare
  v_conname text;
begin
  select conname into v_conname
    from pg_constraint
   where conrelid = 'public.dues_match_log'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%match_type%auto_exact%';

  if v_conname is not null then
    execute format(
      'alter table public.dues_match_log drop constraint %I',
      v_conname
    );
  end if;
end $$;

alter table public.dues_match_log
  add constraint dues_match_log_match_type_check
  check (match_type in (
    'auto_exact',
    'auto_pattern',
    'auto_oldest',
    'manual',
    'amount_mismatch'  -- v0.4 추가
  ));

comment on constraint dues_match_log_match_type_check on public.dues_match_log is
  'v0.4: amount_mismatch(이름 일치하나 금액 불일치, 부분/초과 납부) 추가. ''conflict'' 는 commit 응답 전용으로 DB에 저장되지 않음.';

-- =====================================================================
-- Done.
-- =====================================================================
