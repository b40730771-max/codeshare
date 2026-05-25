// app/login/page.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else router.push('/');
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>로그인</h1>
      <form
        onSubmit={login}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        {error && (
          <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>
        )}
        <button type="submit" style={btnStyle}>
          로그인
        </button>
      </form>
      <p style={{ marginTop: '1rem', color: '#888', fontSize: '0.875rem' }}>
        계정이 없으신가요?{' '}
        <Link href="/signup" style={{ color: '#6366f1' }}>
          회원가입
        </Link>
      </p>
    </div>
  );
}
const inputStyle: React.CSSProperties = {
  background: '#1a1a1a', border: '1px solid #2a2a2a',
  color: '#eee', padding: '10px 14px', borderRadius: '8px',
  fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box'
}

const btnStyle: React.CSSProperties = {
  background: '#6366f1', color: '#fff', border: 'none',
  padding: '10px', borderRadius: '8px', cursor: 'pointer',
  fontSize: '1rem', fontWeight: 600
}
