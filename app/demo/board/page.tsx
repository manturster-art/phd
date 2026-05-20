// SCR-030 데모 — 게시판 목록 (카테고리 탭 포함)
'use client';

import { useMemo, useState } from 'react';
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { DemoPostListItem } from '@/components/demo/DemoPostListItem';
import { demoPosts } from '@/lib/demo/mockData';
import type { PostCategory } from '@/lib/types/database';

type Tab = 'all' | PostCategory;

const TAB_OPTIONS: { label: string; value: Tab }[] = [
  { label: '전체', value: 'all' },
  { label: '자유', value: 'general' },
  { label: '질문', value: 'question' },
  { label: '공유', value: 'share' },
  { label: '구인', value: 'recruit' },
];

export default function DemoBoardPage() {
  const [tab, setTab] = useState<Tab>('all');
  const filtered = useMemo(
    () =>
      tab === 'all' ? demoPosts : demoPosts.filter((p) => p.category === tab),
    [tab]
  );

  return (
    <>
      <AppBar title="게시판" />
      <div className="space-y-4 py-4">
        <SegmentedControl
          options={TAB_OPTIONS}
          value={tab}
          onChange={setTab}
        />
        {filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon="💬"
              title="해당 카테고리에 글이 없어요"
              description="다른 탭을 확인해보세요."
            />
          </Card>
        ) : (
          <Card>
            {filtered.map((p) => (
              <DemoPostListItem key={p.id} post={p} />
            ))}
          </Card>
        )}
        <p className="text-center text-xs text-text-secondary">
          데모 모드 — 글쓰기 FAB 는 비활성화되어 있습니다.
        </p>
      </div>
    </>
  );
}
