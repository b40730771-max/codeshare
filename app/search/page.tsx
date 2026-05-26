'use client';
import { useState } from 'react';
import { supabase, Post } from '@/lib/supabase';
import CodeCard from '@/components/CodeCard';
import Link from 'next/link';

const LANGUAGES = [
  '전체',
  'javascript',
  'typescript',
  'python',
  'rust',
  'go',
  'css',
  'html',
  'java',
  'c++',
  'c'
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState('전체');
  const [type, setType] = useState<'all' | 'title' | 'code' | 'tag'>('all');
  const [results, setResults] = useState<Post[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() && lang === '전체') return;
    setLoading(true);
    setSearched(true);

    let q = supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false });

    if (lang !== '전체') q = q.eq('language', lang);

    if (query.trim()) {
      if (type === 'title') {
        q = q.ilike('title', `%${query}%`);
      } else if (type === 'code') {
        q = q.ilike('code', `%${query}%`);
      } else if (type === 'tag') {
        q = q.contains('tags', [query.toLowerCase()]);
      } else {
        // 전체: 제목 + 설명 + 태그
        q = q.or(
          `title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query.toLowerCase()}}`
        );
      }
    }

    const { data } = await q.limit(30);
    setResults(data || []);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>검색</h1>

      <form
        onSubmit={search}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력하세요..."
            style={{
              flex: 1,
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              color: '#eee',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            검색
          </button>
        </div>

        {/* 검색 범위 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(
            [
              ['all', '전체'],
              ['title', '제목'],
              ['code', '코드'],
              ['tag', '태그'],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setType(v)}
              style={{
                background: type === v ? '#6366f1' : '#1a1a1a',
                color: type === v ? '#fff' : '#aaa',
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

        {/* 언어 필터 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {LANGUAGES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              style={{
                background: lang === l ? '#2a2a3a' : '#1a1a1a',
                color: lang === l ? '#a5b4fc' : '#666',
                border: `1px solid ${lang === l ? '#6366f1' : '#2a2a2a'}`,
                padding: '4px 12px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </form>

      {/* 결과 */}
      {loading && <p style={{ color: '#555' }}>검색 중...</p>}
      {searched && !loading && (
        <>
          <p
            style={{ color: '#888', marginBottom: '1rem', fontSize: '0.9rem' }}
          >
            {results.length > 0
              ? `${results.length}개의 결과`
              : '검색 결과가 없습니다'}
          </p>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {results.map((post) => (
              <CodeCard key={post.id} post={post} />
            ))}
          </div>
        </>
      )}

      {!searched && (
        <div style={{ color: '#555', marginTop: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '2rem' }}>🔍</p>
          <p>제목, 코드 내용, 태그로 검색할 수 있어요</p>
          <p style={{ fontSize: '0.875rem' }}>
            예: "useState", "python", "#react"
          </p>
        </div>
      )}
    </div>
  );
}
