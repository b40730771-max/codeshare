// app/mail/page.tsx — 받은 우편함
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Mail = {
  id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
  sender_id: string;
  profiles: { username: string };
};

export default function MailPage() {
  const [mails, setMails] = useState<Mail[]>([]);
  const [selected, setSelected] = useState<Mail | null>(null);
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [myId, setMyId] = useState('');
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
      setMyId(user.id);
      fetchMails(user.id, tab);
    };
    load();
  }, [tab]);

  const fetchMails = async (uid: string, t: 'inbox' | 'sent') => {
    const field = t === 'inbox' ? 'receiver_id' : 'sender_id';
    const joinField =
      t === 'inbox'
        ? 'profiles!mails_sender_id_fkey'
        : 'profiles!mails_receiver_id_fkey';
    const { data } = await supabase
      .from('mails')
      .select(`*, ${joinField}(username)`)
      .eq(field, uid)
      .order('created_at', { ascending: false });
    setMails((data as any) || []);
  };

  const openMail = async (mail: Mail) => {
    setSelected(mail);
    if (!mail.is_read && tab === 'inbox') {
      await supabase.from('mails').update({ is_read: true }).eq('id', mail.id);
      setMails((ms) =>
        ms.map((m) => (m.id === mail.id ? { ...m, is_read: true } : m))
      );
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>✉️ 우편함</h1>
        <Link href="/mail/compose" style={btnStyle}>
          새 쪽지 쓰기
        </Link>
      </div>

      {/* 탭 */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          marginBottom: '1.5rem',
          border: '1px solid #2a2a2a',
          borderRadius: '8px',
          overflow: 'hidden',
          width: 'fit-content',
        }}
      >
        {(['inbox', 'sent'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSelected(null);
            }}
            style={{
              background: tab === t ? '#6366f1' : 'transparent',
              color: tab === t ? '#fff' : '#888',
              border: 'none',
              padding: '8px 20px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {t === 'inbox' ? '받은 쪽지' : '보낸 쪽지'}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selected ? '1fr 1fr' : '1fr',
          gap: '1rem',
        }}
      >
        {/* 목록 */}
        <div>
          {mails.length === 0 && (
            <p style={{ color: '#555' }}>쪽지가 없습니다</p>
          )}
          {mails.map((m) => (
            <div
              key={m.id}
              onClick={() => openMail(m)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selected?.id === m.id ? '#1e1e2e' : '#1a1a1a',
                border: `1px solid ${
                  !m.is_read && tab === 'inbox' ? '#6366f1' : '#2a2a2a'
                }`,
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontWeight: !m.is_read && tab === 'inbox' ? 600 : 400,
                    fontSize: '0.95rem',
                  }}
                >
                  {!m.is_read && tab === 'inbox' && (
                    <span style={{ color: '#6366f1', marginRight: '6px' }}>
                      ●
                    </span>
                  )}
                  {m.subject}
                </span>
                <span style={{ color: '#555', fontSize: '0.75rem' }}>
                  {new Date(m.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <p
                style={{ margin: '4px 0 0', color: '#888', fontSize: '0.8rem' }}
              >
                {tab === 'inbox' ? 'From: ' : 'To: '}
                {(m as any).profiles?.username}
              </p>
            </div>
          ))}
        </div>

        {/* 본문 */}
        {selected && (
          <div
            style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
                {selected.subject}
              </h2>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                ✕
              </button>
            </div>
            <p
              style={{
                color: '#888',
                fontSize: '0.8rem',
                marginBottom: '1.5rem',
              }}
            >
              {tab === 'inbox' ? 'From: ' : 'To: '}
              {(selected as any).profiles?.username} ·{' '}
              {new Date(selected.created_at).toLocaleString('ko-KR')}
            </p>
            <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {selected.body}
            </p>
            {tab === 'inbox' && (
              <Link
                href={`/mail/compose?to=${selected.sender_id}&subject=Re: ${selected.subject}`}
                style={{
                  ...btnStyle,
                  display: 'inline-block',
                  marginTop: '1rem',
                  textDecoration: 'none',
                }}
              >
                답장하기
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
