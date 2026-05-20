// Supabase 클라이언트의 통합 타입 alias.
// supabase-js v2.106+ 의 5-제네릭 시그니처를 단일 이름으로 묶어 lib/api에서 일관 사용.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

// supabase-js v2.106+의 SupabaseClient는 5-제네릭 (Database, SchemaNameOrClientOptions, SchemaName, ClientOptions, Schema).
// createBrowserClient/createServerClient<Database>가 반환하는 시그니처와 100% 일치시키려면
// 모든 슬롯을 명시해야 한다. 일부 슬롯은 라이브러리 내부 ResolvedSchema 구조라 외부에서 정확히 재현하기 어려우므로
// 단순 alias 대신 구조적 타입(structural typing)을 사용하도록 ReturnType으로 추론한다.
import type { createBrowserClient } from '@supabase/ssr';

export type TypedSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;
// 직접 import 시 alias로 노출
export type { SupabaseClient };
