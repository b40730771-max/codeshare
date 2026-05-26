'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

const LANGUAGES = ['javascript', 'typescript', 'python', 'rust', 'go', 'css', 'html', 'java', 'cpp', 'c', 'other']

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [tags, setTags] = useState('')
  const [commitMsg, setCommitMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [versionNumber, setVersionNumber] = useState(1)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: post } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()

      if (!post) { router.push('/'); return }
      if (post.user_id !== user.id) { router.push(`/post/${id}`); return }

      setTitle(post.title)
      setDescription(post.description || '')
      setCode(post.code)
      setLanguage(post.language)
      setTags(post.tags?.join(', ') || '')

      const { count } = await supabase
        .from('post_versions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', id)
      setVersionNumber((count || 0) + 1)
      setLoading(false)
    }
    load()
  }, [id])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commitMsg.trim()) { setError('커밋 메시지를 입력해주세요'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 수정된 버전을 커밋으로 저장
    await supabase.from('post_versions').insert({
      post_id: id,
      user_id: user.id,
      code: code,
      title: title,
      description: description,
      commit_message: commitMsg,
      version_number: versionNumber
    })

    // 게시물 업데이트
    const { error } = await supabase.from('posts').update({
      title, description, code, language,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean)
    }).eq('id', id)

    if (error) setError(error.message)
    else window.location.href = `/post/${id}`
  }

  if (loading) return <p style={{ color: 'var(--text-dim)' }}>불러오는 중...</p>

  return (
    <div style={{ maxWidth: '700px' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '2rem', color: 'var(--text)' }}>코드 수정하기</h1>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <input placeholder="제목" value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
        <textarea placeholder="설명 (선택)" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        <select value={language} onChange={e => setLanguage(e.target.value)} style={inputStyle}>
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <textarea placeholder="코드" value={code} onChange={e => setCode(e.target.value)} required rows={12}
          style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.875rem', resize: 'vertical' }} />
        <input placeholder="태그 (쉼표로 구분)" value={tags} onChange={e => setTags(e.target.value)} style={inputStyle} />

        {/* 커밋 메시지 */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid #6366f1', borderRadius: '8px', padding: '1rem' }}>
          <label style={{ color: '#a5b4fc', fontSize: '0.875rem', display: 'block', marginBottom: '8px' }}>
            💾 커밋 메시지 (v{versionNumber})
          </label>
          <input
            placeholder="어떤 부분을 수정했나요? (예: 버그 수정, 성능 개선)"
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            required
            style={{ ...inputStyle, border: 'none', padding: '8px 0', background: 'transparent' }}
          />
        </div>

        {error && <p style={{ color: '#f87171' }}>{error}</p>}
        <button type="submit" style={btnStyle}>커밋 & 저장</button>
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)',
  padding: '10px 14px', borderRadius: '8px', fontSize: '0.95rem',
  outline: 'none', width: '100%', boxSizing: 'border-box'
}
const btnStyle: React.CSSProperties = {
  background: '#6366f1', color: '#fff', border: 'none',
  padding: '12px', borderRadius: '8px', cursor: 'pointer',
  fontSize: '1rem', fontWeight: 600
}
