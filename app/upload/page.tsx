'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'rust',
  'go',
  'css',
  'html',
  'java',
  'cpp',
  'other',
];

export default function UploadPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login');
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('로그인이 필요합니다');
      return;
    }

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      title,
      description,
      code,
      language,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    if (error) setError(error.message);
    else router.push('/');
  };

  return (
    <div style={{ maxWidth: '700px' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>
        코드 공유하기
      </h1>
      <form
        onSubmit={submit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}
      >
        <input
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={inputStyle}
        />
        <textarea
          placeholder="설명 (선택)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={inputStyle}
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <textarea
          placeholder="코드를 여기에 붙여넣으세요"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          rows={12}
          style={{
            ...inputStyle,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            resize: 'vertical',
          }}
        />
        <input
          placeholder="태그 (쉼표로 구분, 예: react, hooks, tips)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          style={inputStyle}
        />
        {error && <p style={{ color: '#f87171' }}>{error}</p>}
        <button
          type="submit"
          style={{
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          공유하기
        </button>
      </form>
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
  width: '100%',
  boxSizing: 'border-box',
};
