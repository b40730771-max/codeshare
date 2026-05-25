'use client';
import Link from 'next/link';
import { Post } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function CodeCard({ post }: { post: Post }) {
  const [likes, setLikes] = useState(post.likes_count);

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
      .insert({ post_id: post.id, user_id: user.id });
    if (!error) setLikes((l) => l + 1);
  };

  const preview = post.code.split('\n').slice(0, 5).join('\n');

  return (
    <div
      style={{
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: '12px',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.75rem',
        }}
      >
        <div>
          <Link
            href={`/post/${post.id}`}
            style={{
              color: '#eee',
              fontWeight: 600,
              fontSize: '1.05rem',
              textDecoration: 'none',
            }}
          >
            {post.title}
          </Link>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85rem' }}>
            by {post.profiles?.username} ·{' '}
            {new Date(post.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <span
          style={{
            background: '#2a2a3a',
            color: '#a5b4fc',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.8rem',
          }}
        >
          {post.language}
        </span>
      </div>
      <pre
        style={{
          background: '#111',
          borderRadius: '8px',
          padding: '1rem',
          overflowX: 'auto',
          fontSize: '0.8rem',
          color: '#ccc',
          margin: '0 0 1rem',
          maxHeight: '120px',
          overflow: 'hidden',
        }}
      >
        <code>
          {preview}
          {post.code.split('\n').length > 5 ? '\n...' : ''}
        </code>
      </pre>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {post.tags?.map((tag) => (
          <span
            key={tag}
            style={{
              background: '#222',
              color: '#888',
              padding: '2px 10px',
              borderRadius: '20px',
              fontSize: '0.78rem',
            }}
          >
            #{tag}
          </span>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <button
            onClick={handleLike}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            ♥ {likes}
          </button>
          <Link
            href={`/post/${post.id}`}
            style={{
              color: '#6366f1',
              fontSize: '0.875rem',
              textDecoration: 'none',
            }}
          >
            자세히 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
