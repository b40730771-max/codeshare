'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setUsername(data.username);
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
      }
    };
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let newAvatarUrl = avatarUrl;
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true });
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      newAvatarUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username, bio, avatar_url: newAvatarUrl })
      .eq('id', user.id);

    setSaving(false);
    setMsg(error ? '저장 실패: ' + error.message : '저장되었습니다 ✓');
  };

  return (
    <div style={{ maxWidth: '500px' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>프로필 수정</h1>
      <form
        onSubmit={save}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}
      >
        {/* 아바타 미리보기 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#6366f1',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.4rem',
              color: '#fff',
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt="avatar"
              />
            ) : (
              username[0]?.toUpperCase()
            )}
          </div>
          <div>
            <label
              style={{
                color: '#888',
                fontSize: '0.875rem',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              프로필 사진
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              style={{ color: '#aaa', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>사용자 이름</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>자기소개</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="간단한 소개를 작성해보세요"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {msg && (
          <p
            style={{
              color: msg.includes('실패') ? '#f87171' : '#4ade80',
              fontSize: '0.875rem',
            }}
          >
            {msg}
          </p>
        )}
        <button type="submit" disabled={saving} style={btnStyle}>
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  color: '#888',
  fontSize: '0.875rem',
  display: 'block',
  marginBottom: '6px',
};
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
const btnStyle: React.CSSProperties = {
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  padding: '12px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: 600,
};
