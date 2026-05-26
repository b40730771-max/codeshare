'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type Branch = {
  id: string
  name: string
  code: string
  description: string | null
  created_at: string
  user_id: string
  profiles: { username: string }
}

export default function BranchesPage() {
  const { id: postId } = useParams<{ id: string }>()
  const [branches, setBranches] = useState<Branch[]>([])
  const [myId, setMyId] = useState('')
  const [postOwnerId, setPostOwnerId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setMyId(user.id)

      const { data: post } = await supabase.from('posts').select('user_id, code').eq('id', postId).single()
      if (post) { setPostOwnerId(post.user_id); setCode(post.code) }

      fetchBranches()
    }
    load()
  }, [])

  const fetchBranches = async () => {
    const { data } = await supabase
      .from('branches')
      .select('*, profiles(username)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
    setBranches((data as any) || [])
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await supabase.from('branches').insert({
      post_id: postId, user_id: user.id, name, description, code
    })
    setName(''); setDescription(''); setShowForm(false)
    fetchBranches()
  }

  const deleteBranch = async (id: string) => {
    if (!confirm('브랜치를 삭제할까요?')) return
    await supabase.from('branches').delete().eq('id', id)
    fetchBranches()
  }

  const createPR = (branch: Branch) => {
    router.push(`/post/${postId}/pulls?branch=${branch.id}&title=${encodeURIComponent(branch.name)}&code=${encodeURIComponent(branch.code)}`)
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>🌿 브랜치</h1>
        <button onClick={() => setShowForm(!showForm)} style={btnStyle}>+ 새 브랜치</button>
      </div>

      {/* 새 브랜치 폼 */}
      {showForm && (
        <form onSubmit={submit} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input placeholder="브랜치 이름 (예: fix/bug-123, feature/new-ui)" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
          <textarea placeholder="이 브랜치에서 뭘 작업하나요? (선택)" value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          <textarea placeholder="코드를 여기에 작성하세요" value={code} onChange={e => setCode(e.target.value)} rows={10} required style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.875rem', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={btnStyle}>브랜치 생성</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ ...btnStyle, background: '#2a2a2a' }}>취소</button>
          </div>
        </form>
      )}

      {/* 브랜치 목록 */}
      {branches.length === 0 && <p style={{ color: '#555' }}>브랜치가 없습니다</p>}

      {/* main 브랜치 */}
      <div style={{ background: '#1a1a2a', border: '1px solid #6366f1', borderRadius: '10px', padding: '14px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#a5b4fc', fontSize: '0.8rem' }}>🌿</span>
          <span style={{ color: '#eee', fontWeight: 600 }}>main</span>
          <span style={{ background: '#6366f1', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem' }}>기본</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {branches.map(branch => (
          <div key={branch.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ color: '#4ade80', fontSize: '0.8rem' }}>🌿</span>
                  <span style={{ color: '#eee', fontWeight: 600 }}>{branch.name}</span>
                </div>
                {branch.description && <p style={{ margin: '0 0 6px', color: '#888', fontSize: '0.875rem' }}>{branch.description}</p>}
                <p style={{ margin: 0, color: '#555', fontSize: '0.75rem' }}>
                  {branch.profiles?.username} · {new Date(branch.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                <button onClick={() => setExpanded(expanded === branch.id ? null : branch.id)} style={smallBtn}>
                  {expanded === branch.id ? '숨기기' : '코드 보기'}
                </button>
                <button onClick={() => createPR(branch)} style={{ ...smallBtn, color: '#a78bfa' }}>
                  PR 만들기
                </button>
                {myId === branch.user_id && (
                  <button onClick={() => deleteBranch(branch.id)} style={{ ...smallBtn, color: '#f87171' }}>삭제</button>
                )}
              </div>
            </div>
            {expanded === branch.id && (
              <pre style={{ background: '#111', padding: '1rem', margin: 0, fontSize: '0.8rem', color: '#ccc', overflowX: 'auto', borderTop: '1px solid #2a2a2a' }}>
                <code>{branch.code}</code>
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
