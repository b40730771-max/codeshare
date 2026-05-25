'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function ComposeForm() {
  const sp = useSearchParams()
  const [to, setTo] = useState(sp.get('to') || '')
  const [toName, setToName] = useState(sp.get('name') || sp.get('to') || '')
  const [subject, setSubject] = useState(sp.get('subject') || '')
  const [body, setBody] = useState('')
  const [myId, setMyId] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setMyId(data.user.id)
    })
  }, [])

  const searchReceiver = async () => {
    const { data } = await supabase.from('profiles').select('id, username').ilike('username', `%${to}%`).limit(5)
    if (data && data.length > 0) { setTo(data[0].id); setToName(data[0].username) }
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('mails').insert({
      sender_id: myId, receiver_id: to, subject, body
    })
    if (error) setMsg('전송 실패: ' + error.message)
    else { setMsg('전송 완료!'); setTimeout(() => router.push('/mail'), 1500) }
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>✉️ 새 쪽지</h1>
      <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={toName} onChange={e => { setToName(e.target.value); setTo(e.target.value) }}
            placeholder="받는 사람 (이름 검색)" style={{ ...inputStyle, flex: 1 }} required />
          <button type="button" onClick={searchReceiver} style={smallBtn}>검색</button>
        </div>
        <input value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="제목" style={inputStyle} required />
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder="내용을 입력하세요" rows={10} style={{ ...inputStyle, resize: 'vertical' }} required />
        {msg && <p style={{ color: msg.includes('실패') ? '#f87171' : '#4ade80' }}>{msg}</p>}
        <button type="submit" style={btnStyle}>전송하기</button>
      </form>
    </div>
  )
}

export default function ComposePage() {
  return (
    <Suspense fallback={<p style={{ color: '#555' }}>불러오는 중...</p>}>
      <ComposeForm />
    </Suspense>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#eee',
  padding: '10px 14px', borderRadius: '8px', fontSize: '0.95rem',
  outline: 'none', width: '100%', boxSizing: 'border-box'
}
const btnStyle: React.CSSProperties = {
  background: '#6366f1', color: '#fff', border: 'none',
  padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600
}
const smallBtn: React.CSSProperties = {
  background: '#2a2a2a', color: '#eee', border: 'none',
  padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem'
}
