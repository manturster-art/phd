// SCR-030 게시글 목록
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/layout/FAB';
import { PostListItem } from '@/components/post/PostListItem';
import { createClient } from '@/lib/supabase/server';
import { listPosts } from '@/lib/api/posts';

export const metadata = { title: '게시판 · 원우회' };

export default async function BoardPage() {
  const supabase = createClient();
  const posts = await listPosts(supabase, 50).catch(() => []);

  return (
    <>
      <AppBar title="게시판" />
      <div className="py-4">
        {posts.length === 0 ? (
          <Card>
            <EmptyState icon="💬" title="첫 번째 글을 남겨보세요" />
          </Card>
        ) : (
          <Card>{posts.map((p) => <PostListItem key={p.id} post={p} />)}</Card>
        )}
      </div>
      <FAB href="/board/new" label="글쓰기" icon="➕" />
    </>
  );
}
