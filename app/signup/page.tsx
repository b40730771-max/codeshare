'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const router = useRouter();

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signupError) {
      setError(signupError.message);
      return;
    }

    // username 업데이트
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ username })
        .eq('id', data.user.id);
    }
    setDone(true);
  };

  if (done)
    return (
      <div
        style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}
      >
        <h2>이메일을 확인해주세요 ✉️</h2>
        <p style={{ color: '#888' }}>
          가입 확인 메일이 발송되었습니다. 확인 후 로그인하세요.
        </p>
        <Link href="/login" style={{ color: '#6366f1' }}>
          로그인하러 가기
        </Link>
      </div>
    );

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>회원가입</h1>
      <form
        onSubmit={signup}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <input
          type="text"
          placeholder="사용자 이름"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={inputStyle}
        />
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
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={inputStyle}
        />
        {error && (
          <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>
        )}
        <button type="submit" style={btnStyle}>
          회원가입
        </button>
      </form>
      <p style={{ marginTop: '1rem', color: '#888', fontSize: '0.875rem' }}>
        이미 계정이 있으신가요?{' '}
        <Link href="/login" style={{ color: '#6366f1' }}>
          로그인
        </Link>
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  color: '#eee',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '0.95rem',
  outline: 'none',
};

const btnStyle: React.CSSProperties = {
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  padding: '10px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: 600,
};

