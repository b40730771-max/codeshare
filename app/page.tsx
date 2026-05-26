'use client';
import { useEffect, useState } from 'react';
import { supabase, Post } from '@/lib/supabase';
import CodeCard from '@/components/CodeCard';

const LANGUAGES = ['전체', 'javascript', 'typescript', 'python', 'rust', 'go', 'css', 'html', 'java', 'c++', 'c']

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lang, setLang] = useState('전체');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [lang]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false });

    if (lang !== '전체') query = query.eq('language', lang);

    const { data } = await query;
    setPosts(data || []);
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
          }}
        >
          최근 공유된 코드
        </h1>
        <p style={{ color: '#888' }}>
          개발자들이 공유한 코드와 아이디어를 탐색해보세요
        </p>
      </div>

      {/* 언어 필터 */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '2rem',
        }}
      >
        {LANGUAGES.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              background: lang === l ? '#6366f1' : '#1a1a1a',
              color: lang === l ? '#fff' : '#aaa',
              border: '1px solid #2a2a2a',
              padding: '6px 14px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#555' }}>불러오는 중...</p>
      ) : posts.length === 0 ? (
        <p style={{ color: '#555' }}>아직 게시물이 없습니다.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts.map((post) => (
            <CodeCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
