'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type PR = {
  id: string
  title: string
  body: string
  code: string
  status: string
  created_at: string
  user_id: string
  profiles: { username: string }
}

export default function PullsPage() {
  const { id: postId } = useParams<{ id: string }>()
  const [prs, setPrs] = useState<PR[]>([])
  const [myId, setMyId] = useState('')
  const [postOwnerId, setPostOwnerId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [code, setCode] = useState('')
  const [filter, setFilter] = useState<'open' | 'merged' | 'closed'>('open')
  const [expanded, setExpanded] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setMyId(user.id)

      const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single()
      if (post) setPostOwnerId(post.user_id)

      fetchPRs()
    }
    load()
  }, [filter])

  const fetchPRs = async () => {
    const { data } = await supabase
      .from('pull_requests')
      .select('*, profiles(username)')
      .eq('post_id', postId)
      .eq('status', filter)
      .order('created_at', { ascending: false })
    setPrs((data as any) || [])
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await supabase.from('pull_requests').insert({
      post_id: postId, user_id: user.id, title, body, code
    })
    await supabase.from('notifications').insert({
      user_id: postOwnerId, from_user_id: user.id, type: 'comment', post_id: postId
    })
    setTitle(''); setBody(''); setCode(''); setShowForm(false)
    fetchPRs()
  }

  const mergePR = async (pr: PR) => {
    if (!confirm(`"${pr.title}" PR을 머지할까요? 현재 코드가 교체됩니다.`)) return
    await supabase.from('posts').update({ code: pr.code }).eq('id', postId)
    await supabase.from('pull_requests').update({ status: 'merged' }).eq('id', pr.id)
    fetchPRs()
    alert('머지 완료! 코드가 업데이트됐어요 ✅')
  }

  const closePR = async (pr: PR) => {
    await supabase.from('pull_requests').update({ status: 'closed' }).eq('id', pr.id)
    fetchPRs()
  }

  const statusColor: Record<string, string> = {
    open: '#4ade80', merged: '#a78bfa', closed: '#f87171'
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>🔀 Pull Requests</h1>
        <button onClick={() => setShowForm(!showForm)} style={btnStyle}>+ 새 PR</button>
      </div>

      {/* 새 PR 폼 */}
      {showForm && (
        <form onSubmit={submit} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input placeholder="PR 제목" value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
          <textarea placeholder="어떤 변경을 했나요?" value={body} onChange={e => setBody(e.target.value)} rows={3} required style={{ ...inputStyle, resize: 'vertical' }} />
          <textarea placeholder="변경된 코드를 여기에 붙여넣으세요" value={code} onChange={e => setCode(e.target.value)} rows={10} required style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.875rem', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={btnStyle}>PR 제출</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ ...btnStyle, background: '#2a2a2a' }}>취소</button>
          </div>
        </form>
      )}

      {/* 필터 */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', border: '1px solid #2a2a2a', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
        {(['open', 'merged', 'closed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? '#6366f1' : 'transparent',
            color: filter === f ? '#fff' : '#888',
            border: 'none', padding: '8px 20px', cursor: 'pointer', fontSize: '0.85rem'
          }}>
            {f === 'open' ? '🟢 Open' : f === 'merged' ? '🟣 Merged' : '🔴 Closed'}
          </button>
        ))}
      </div>

      {/* PR 목록 */}
      {prs.length === 0 && <p style={{ color: '#555' }}>PR이 없습니다</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {prs.map(pr => (
          <div key={pr.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ color: statusColor[pr.status], fontSize: '0.8rem', fontWeight: 600 }}>
                      ● {pr.status.toUpperCase()}
                    </span>
                    <span style={{ color: '#eee', fontWeight: 600 }}>{pr.title}</span>
                  </div>
                  <p style={{ margin: '0 0 8px', color: '#888', fontSize: '0.875rem' }}>{pr.body}</p>
                  <p style={{ margin: 0, color: '#555', fontSize: '0.75rem' }}>
                    {pr.profiles?.username} · {new Date(pr.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                  <button onClick={() => setExpanded(expanded === pr.id ? null : pr.id)} style={smallBtn}>
                    {expanded === pr.id ? '코드 숨기기' : '코드 보기'}
                  </button>
                  {pr.status === 'open' && myId === postOwnerId && (
                    <>
                      <button onClick={() => mergePR(pr)} style={{ ...smallBtn, background: '#4c1d95', color: '#a78bfa' }}>머지</button>
                      <button onClick={() => closePR(pr)} style={{ ...smallBtn, color: '#f87171' }}>닫기</button>
                    </>
                  )}
                </div>
              </div>
            </div>
            {expanded === pr.id && (
              <pre style={{ background: '#111', padding: '1rem', margin: 0, fontSize: '0.8rem', color: '#ccc', overflowX: 'auto', borderTop: '1px solid #2a2a2a' }}>
                <code>{pr.code}</code>
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#111', border: '1px solid #2a2a2a', color: '#eee',
  padding: '10px 14px', borderRadius: '8px', fontSize: '0.95rem',
  outline: 'none', width: '100%', boxSizing: 'border-box'
}
const btnStyle: React.CSSProperties = {
  background: '#6366f1', color: '#fff', border: 'none',
  padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600
}
const smallBtn: React.CSSProperties = {
  background: '#2a2a2a', color: '#eee', border: 'none',
  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem'
}
