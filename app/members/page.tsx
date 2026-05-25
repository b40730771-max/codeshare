// app/members/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase, Profile } from '@/lib/supabase';

export default function MembersPage() {
  const [members, setMembers] = useState<(Profile & { post_count: number })[]>(
    []
  );

  useEffect(() => {
    const fetch = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!profiles) return;
      const withCounts = await Promise.all(
        profiles.map(async (p) => {
          const { count } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', p.id);
          return { ...p, post_count: count || 0 };
        })
      );
      setMembers(withCounts);
    };
    fetch();
  }, []);

  return (
    <div>
      <h1
        style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}
      >
        멤버 목록
      </h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>
        총 {members.length}명이 함께하고 있어요
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {members.map((m) => (
          <div
            key={m.id}
            style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              {m.username[0].toUpperCase()}
            </div>
            <p style={{ margin: 0, fontWeight: 600 }}>{m.username}</p>
            <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>
              {m.bio || '소개 없음'}
            </p>
            <p style={{ margin: 0, color: '#6366f1', fontSize: '0.8rem' }}>
              게시물 {m.post_count}개
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
