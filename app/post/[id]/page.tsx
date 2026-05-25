'use client';
import { useEffect, useState } from 'react';
import { supabase, Post, Comment } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url)')
        .eq('id', id)
        .single();
      if (p) {
        setPost(p);
        setLikes(p.likes_count);
      }

      const { data: c } = await supabase
        .from('comments')
        .select('*, profiles(username, avatar_url)')
        .eq('post_id', id)
        .order('created_at', { ascending: true });
      setComments(c || []);
    };
    load();
  }, [id]);

  const handleLike = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다');
      return;
    }
    const { error } = await supabase
      .from('likes')
      .insert({ post_id: id, user_id: user.id });
    if (!error) setLikes((l) => l + 1);
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다');
      return;
    }
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: id, user_id: user.id, content: newComment })
      .select('*, profiles(username, avatar_url)')
      .single();
    if (data) {
      setComments((c) => [...c, data]);
      setNewComment('');
    }
  };

  if (!post) return <p style={{ color: '#555' }}>불러오는 중...</p>;

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>
            {post.title}
          </h1>
          <span
            style={{
              background: '#2a2a3a',
              color: '#a5b4fc',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
            }}
          >
            {post.language}
          </span>
        </div>
        <p style={{ color: '#888', margin: '8px 0 0', fontSize: '0.875rem' }}>
          by {post.profiles?.username} ·{' '}
          {new Date(post.created_at).toLocaleDateString('ko-KR')}
        </p>
        {post.description && (
          <p style={{ marginTop: '1rem', color: '#ccc', lineHeight: 1.7 }}>
            {post.description}
          </p>
        )}
      </div>

      {/* 코드 */}
      <pre
        style={{
          background: '#111',
          borderRadius: '12px',
          padding: '1.5rem',
          overflowX: 'auto',
          fontSize: '0.875rem',
          color: '#ccc',
          lineHeight: 1.6,
          marginBottom: '1.5rem',
        }}
      >
        <code>{post.code}</code>
      </pre>

      {/* 태그 + 좋아요 */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '2rem',
        }}
      >
        {post.tags?.map((tag) => (
          <span
            key={tag}
            style={{
              background: '#222',
              color: '#888',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
            }}
          >
            #{tag}
          </span>
        ))}
        <button
          onClick={handleLike}
          style={{
            marginLeft: 'auto',
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            color: '#f87171',
            padding: '6px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          ♥ {likes}
        </button>
      </div>

      {/* 댓글 */}
      <div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          댓글 {comments.length}개
        </h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '1.5rem',
          }}
        >
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '12px 16px',
              }}
            >
              <p
                style={{
                  margin: '0 0 6px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#a5b4fc',
                }}
              >
                {c.profiles?.username}
                <span
                  style={{
                    color: '#555',
                    fontWeight: 400,
                    marginLeft: '8px',
                    fontSize: '0.8rem',
                  }}
                >
                  {new Date(c.created_at).toLocaleDateString('ko-KR')}
                </span>
              </p>
              <p style={{ margin: 0, color: '#ccc', lineHeight: 1.6 }}>
                {c.content}
              </p>
            </div>
          ))}
        </div>

        {/* 댓글 입력 */}
        <form onSubmit={submitComment} style={{ display: 'flex', gap: '8px' }}>
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            required
            style={{
              flex: 1,
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              color: '#eee',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            등록
          </button>
        </form>
      </div>
    </div>
  );
}
