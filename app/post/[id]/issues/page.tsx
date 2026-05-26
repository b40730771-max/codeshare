'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type Issue = {
  id: string
  title: string
  body: string
  status: string
  label: string
  created_at: string
  user_id: string
  profiles: { username: string }
}

const labelColors: Record<string, string> = {
  bug: '#f87171',
  feature: '#4ade80',
  question: '#fbbf24'
}

export default function IssuesPage() {
  const { id: postId } = useParams<{ id: string }>()
  const [issues, setIssues] = useState<Issue[]>([])
  const [myId, setMyId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [label, setLabel] = useState('bug')
  const [filter, setFilter] = useState<'open' | 'closed'>('open')
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setMyId(user.id)
      fetchIssues()
    }
    load()
  }, [filter])

  const fetchIssues = async () => {
    const { data } = await supabase
      .from('issues')
      .select('*, profiles(username)')
      .eq('post_id', postId)
      .eq('status', filter)
      .order('created_at', { ascending: false })
    setIssues((data as any) || [])
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await supabase.from('issues').insert({
      post_id: postId, user_id: user.id, title, body, label
    })
    setTitle(''); setBody(''); setShowForm(false)
    fetchIssues()
  }

  const toggleStatus = async (issue: Issue) => {
    const newStatus = issue.status === 'open' ? 'closed' : 'open'
    await supabase.from('issues').update({ status: newStatus }).eq('id', issue.id)
    fetchIssues()
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>🐛 Issues</h1>
        <button onClick={() => setShowForm(!showForm)} style={btnStyle}>
          + 새 Issue
        </button>
      </div>

      {/* 새 Issue 폼 */}
      {showForm && (
        <form onSubmit={submit} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input placeholder="제목" value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
          <textarea placeholder="자세한 내용" value={body} onChange={e => setBody(e.target.value)} rows={4} required style={{ ...inputStyle, resize: 'vertical' }} />
          <select value={label} onChange={e => setLabel(e.target.value)} style={inputStyle}>
            <option value="bug">🐛 Bug</option>
            <option value="feature">✨ Feature</option>
            <option value="question">❓ Question</option>
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={btnStyle}>등록</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ ...btnStyle, background: '#2a2a2a' }}>취소</button>
          </div>
        </form>
      )}

      {/* 필터 */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', border: '1px solid #2a2a2a', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
        {(['open', 'closed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? '#6366f1' : 'transparent',
            color: filter === f ? '#fff' : '#888',
            border: 'none', padding: '8px 20px', cursor: 'pointer', fontSize: '0.9rem'
          }}>
            {f === 'open' ? '🟢 Open' : '🔴 Closed'}
          </button>
        ))}
      </div>

      {/* Issue 목록 */}
      {issues.length === 0 && <p style={{ color: '#555' }}>Issue가 없습니다</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {issues.map(issue => (
          <div key={issue.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ background: labelColors[issue.label], color: '#000', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {issue.label}
                  </span>
                  <span style={{ color: '#eee', fontWeight: 600 }}>{issue.title}</span>
                </div>
                <p style={{ margin: '0 0 8px', color: '#888', fontSize: '0.875rem', lineHeight: 1.6 }}>{issue.body}</p>
                <p style={{ margin: 0, color: '#555', fontSize: '0.75rem' }}>
                  {issue.profiles?.username} · {new Date(issue.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              {(myId === issue.user_id) && (
                <button onClick={() => toggleStatus(issue)} style={{
                  background: issue.status === 'open' ? '#2a2a2a' : '#1a2a1a',
                  color: issue.status === 'open' ? '#f87171' : '#4ade80',
                  border: 'none', padding: '6px 12px', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '0.8rem', marginLeft: '12px', flexShrink: 0
                }}>
                  {issue.status === 'open' ? '닫기' : '다시 열기'}
                </button>
              )}
            </div>
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
