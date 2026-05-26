'use client'
import { useEffect, useState } from 'react'
import { supabase, Post, Comment } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type Version = {
  id: string
  version_number: number
  commit_message: string
  code: string
  title: string
  created_at: string
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [likes, setLikes] = useState(0)
  const [myId, setMyId] = useState('')
  const [versions, setVersions] = useState<Version[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url)')
        .eq('id', id)
        .single()
      if (p) { setPost(p); setLikes(p.likes_count) }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) setMyId(user.id)

      const { data: c } = await supabase
        .from('comments')
        .select('*, profiles(username, avatar_url)')
        .eq('post_id', id)
        .order('created_at', { ascending: true })
      setComments(c || [])

      const { data: v } = await supabase
        .from('post_versions')
        .select('*')
        .eq('post_id', id)
        .order('version_number', { ascending: false })
      setVersions(v || [])
    }
    load()
  }, [id])

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('로그인이 필요합니다'); return }
    const { error } = await supabase.from('likes').insert({ post_id: id, user_id: user.id })
    if (!error) setLikes(l => l + 1)
  }

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('로그인이 필요합니다'); return }
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: id, user_id: user.id, content: newComment })
      .select('*, profiles(username, avatar_url)')
      .single()
    if (data) { setComments(c => [...c, data]); setNewComment('') }
  }

  const rollback = async (version: Version) => {
    if (!confirm(`v${version.version_number} "${version.commit_message}" 버전으로 롤백할까요?`)) return
    await supabase.from('posts').update({
      code: version.code,
      title: version.title,
    }).eq('id', id)
    window.location.reload()
  }

  if (!post) return <p style={{ color: '#555' }}>불러오는 중...</p>

  const isOwner = myId === post.user_id

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>{post.title}</h1>
          <span style={{ background: '#2a2a3a', color: '#a5b4fc', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
            {post.language}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          <p style={{ color: '#888', margin: 0, fontSize: '0.875rem' }}>
            by {post.profiles?.username} · {new Date(post.created_at).toLocaleDateString('ko-KR')}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => router.push(`/post/${id}/issues`)} style={smallBtn}>🐛 Issues</button>
            <button onClick={() => router.push(`/post/${id}/pulls`)} style={smallBtn}>🔀 PR</button>
            <button onClick={() => router.push(`/post/${id}/branches`)} style={smallBtn}>🌿 브랜치</button>
            {isOwner && (
              <button onClick={() => router.push(`/post/${id}/edit`)} style={smallBtn}>✏️ 수정하기</button>
            )}
          </div>
        </div>
        {post.description && <p style={{ marginTop: '1rem', color: '#ccc', lineHeight: 1.7 }}>{post.description}</p>}
      </div>

      {/* 코드 */}
      <pre style={{
        background: '#111', borderRadius: '12px', padding: '1.5rem',
        overflowX: 'auto', fontSize: '0.875rem', color: '#ccc',
        lineHeight: 1.6, marginBottom: '1.5rem'
      }}>
        <code>{post.code}</code>
      </pre>

      {/* 태그 + 좋아요 */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {post.tags?.map(tag => (
          <span key={tag} style={{ background: '#222', color: '#888', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>
            #{tag}
          </span>
        ))}
        <button onClick={handleLike} style={{
          marginLeft: 'auto', background: '#1a1a1a', border: '1px solid #2a2a2a',
          color: '#f87171', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem'
        }}>
          ♥ {likes}
        </button>
      </div>

      {/* 버전 히스토리 */}
      {versions.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <button onClick={() => setShowVersions(!showVersions)} style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#a5b4fc',
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            📋 커밋 히스토리 ({versions.length}) {showVersions ? '▲' : '▼'}
          </button>
          {showVersions && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {versions.map(v => (
                <div key={v.id} style={{
                  background: '#1a1a1a', border: '1px solid #2a2a2a',
                  borderRadius: '8px', padding: '12px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <span style={{ color: '#6366f1', fontSize: '0.8rem', marginRight: '8px' }}>v{v.version_number}</span>
                    <span style={{ color: '#eee', fontSize: '0.9rem' }}>{v.commit_message}</span>
                    <p style={{ margin: '4px 0 0', color: '#555', fontSize: '0.75rem' }}>
                      {new Date(v.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  {isOwner && (
                    <button onClick={() => rollback(v)} style={smallBtn}>
                      ↩ 롤백
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 댓글 */}
      <div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>댓글 {comments.length}개</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
          {comments.map(c => (
            <div key={c.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px 16px' }}>
              <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '0.875rem', color: '#a5b4fc' }}>
                {c.profiles?.username}
                <span style={{ color: '#555', fontWeight: 400, marginLeft: '8px', fontSize: '0.8rem' }}>
                  {new Date(c.created_at).toLocaleDateString('ko-KR')}
                </span>
              </p>
              <p style={{ margin: 0, color: '#ccc', lineHeight: 1.6 }}>{c.content}</p>
            </div>
          ))}
        </div>
        <form onSubmit={submitComment} style={{ display: 'flex', gap: '8px' }}>
          <input
            value={newComment} onChange={e => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요..." required
            style={{
              flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a',
              color: '#eee', padding: '10px 14px', borderRadius: '8px',
              fontSize: '0.95rem', outline: 'none'
            }}
          />
          <button type="submit" style={{
            background: '#6366f1', color: '#fff', border: 'none',
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem'
          }}>등록</button>
        </form>
      </div>
    </div>
  )
}

const smallBtn: React.CSSProperties = {
  background: '#2a2a2a', color: '#eee', border: 'none',
  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem'
}
