'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav
      style={{
        background: '#0f0f0f',
        borderBottom: '1px solid #1e1e1e',
        padding: '0 2rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Link
        href="/"
        style={{
          color: '#fff',
          fontWeight: 700,
          fontSize: '1.2rem',
          textDecoration: 'none',
        }}
      >
        {'<CodeShare />'}
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link href="/" style={navLink}>
          홈
        </Link>
        <Link href="/search" style={navLink}>
          검색
        </Link>
        <Link href="/members" style={navLink}>
          멤버
        </Link>
        {user ? (
          <>
            <Link href="/friends" style={navLink}>
              친구
            </Link>
            <Link href="/mail" style={navLink}>
              ✉️ 우편함
            </Link>
            <Link href="/profile" style={navLink}>
              프로필
            </Link>
            <Link href="/upload" style={navLink}>
              + 공유하기
            </Link>
            <button onClick={logout} style={btnStyle}>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={navLink}>
              로그인
            </Link>
            <Link
              href="/signup"
              style={{
                ...btnStyle,
                textDecoration: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
              }}
            >
              회원가입
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

const navLink: React.CSSProperties = {
  color: '#aaa',
  textDecoration: 'none',
  fontSize: '0.9rem',
  transition: 'color 0.2s',
};

const btnStyle: React.CSSProperties = {
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  padding: '6px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
};
