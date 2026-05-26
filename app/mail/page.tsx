'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Mail = {
  id: string
  subject: string
  body: string
  is_read: boolean
  created_at: string
  sender_id: string
  receiver_id: string
  profiles: { username: string }
}

export default function MailPage() {
  const [mails, setMails] = useState<Mail[]>([])
  const [selected, setSelected] = useState<Mail | null>(null)
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox')
  const [myId, setMyId] = useState('')
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setMyId(user.id)
      fetchMails(user.id, tab)
    }
    load()
  }, [tab])

  const fetchMails = async (uid: string, t: 'inbox' | 'sent') => {
    const field = t === 'inbox' ? 'receiver_id' : 'sender_id'
    const joinField = t === 'inbox' ? 'profiles!mails_sender_id_fkey' : 'profiles!mails_receiver_id_fkey'
    const { data } = await supabase
      .from('mails')
      .select(`*, ${joinField}(username)`)
      .eq(field, uid)
      .order('created_at', { ascending: false })
    setMails((data as any) || [])
  }

  const openMail = async (mail: Mail) => {
    setSelected(mail)
    if (!mail.is_read && tab === 'inbox') {
      await supabase.from('mails').update({ is_read: true }).eq('id', mail.id)
      setMails(ms => ms.map(m => m.id === mail.id ? { ...m, is_read: true } : m))
    }
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>✉️ 우편함</h1>
        <Link href="/mail/compose" style={btnStyle}>새 쪽지 쓰기</Link>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
        {(['inbox', 'sent'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setSelected(null) }} style={{
            background: tab === t ? '#6366f1' : 'transparent',
            color: tab === t ? '#fff' : 'var(--text-muted)',
            border: 'none', padding: '8px 20px', cursor: 'pointer', fontSize: '0.9rem'
          }}>{t === 'inbox' ? '받은 쪽지' : '보낸 쪽지'}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '1rem' }}>
        {/* 목록 */}
        <div>
          {mails.length === 0 && <p style={{ color: 'var(--text-dim)' }}>쪽지가 없습니다</p>}
          {mails.map(m => (
            <div key={m.id} onClick={() => openMail(m)} style={{
              padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
              background: selected?.id === m.id ? 'var(--bg-input)' : 'var(--bg-card)',
              border: `1px solid ${!m.is_read && tab === 'inbox' ? '#6366f1' : 'var(--border)'}`,
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: !m.is_read && tab === 'inbox' ? 600 : 400, fontSize: '0.95rem', color: 'var(--text)' }}>
                  {!m.is_read && tab === 'inbox' && <span style={{ color: '#6366f1', marginRight: '6px' }}>●</span>}
                  {m.subject}
                </span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                  {new Date(m.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {tab === 'inbox' ? 'From: ' : 'To: '}{(m as any).profiles?.username}
              </p>
            </div>
          ))}
        </div>

        {/* 본문 */}
        {selected && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text)' }}>{selected.subject}</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              {tab === 'inbox' ? 'From: ' : 'To: '}{(selected as any).profiles?.username} · {new Date(selected.created_at).toLocaleString('ko-KR')}
            </p>
            <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{selected.body}</p>
            {tab === 'inbox' && (
              <Link href={`/mail/compose?to=${selected.sender_id}&subject=Re: ${selected.subject}`}
                style={{ ...btnStyle, display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>
                답장하기
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: '#6366f1', color: '#fff', border: 'none',
  padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
  fontSize: '0.95rem', fontWeight: 600
}
