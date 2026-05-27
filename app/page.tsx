'use client'
import { useEffect, useState } from 'react'
import { supabase, Post } from '@/lib/supabase'
import CodeCard from '@/components/CodeCard'
import Link from 'next/link'

const LANGUAGES = ['전체', 'javascript', 'typescript', 'python', 'rust', 'go', 'css', 'html', 'java', 'cpp', 'c']

const FEATURES = [
  { icon: '💻', title: 'Share', desc: '내가 만든 코드를 공유하세요' },
  { icon: '⭐', title: 'Recommend', desc: '좋은 코드에 별과 하트를 남기세요' },
  { icon: '👥', title: 'Follow', desc: '다른 개발자를 팔로우하세요' },
  { icon: '💬', title: 'Talk', desc: '친구와 실시간으로 대화하세요' },
]

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [lang, setLang] = useState('전체')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      if (data.user) fetchPosts()
      else setLoading(false)
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchPosts()
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) fetchPosts()
  }, [lang])

  const fetchPosts = async () => {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false })
    if (lang !== '전체') query = query.eq('language', lang)
    const { data } = await query
    setPosts(data || [])
    setLoading(false)
  }

  // 로그인 안 된 경우 랜딩 페이지
  if (!user) return (
    <div>
      {/* 히어로 섹션 */}
      <div style={{
        textAlign: 'center',
        padding: '5rem 1rem',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: '20px',
        marginBottom: '4rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 1rem', color: '#fff' }}>
          CodeShare
        </h1>
        <p style={{ fontSize: '1.3rem', color: '#a5b4fc', marginBottom: '0.5rem' }}>
          Share & Recommend & Follow & Talk
        </p>
        <p style={{ fontSize: '1rem', color: '#888', marginBottom: '3rem' }}>
          with other users
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{
            background: '#6366f1', color: '#fff', padding: '14px 36px',
            borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem'
          }}>
            Sign Up
          </Link>
          <Link href="/login" style={{
            background: 'transparent', color: '#fff', padding: '14px 36px',
            borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem',
            border: '1px solid #6366f1'
          }}>
            Sign In
          </Link>
        </div>
      </div>

      {/* 기능 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '2rem', textAlign: 'center'
          }}>
            <p style={{ fontSize: '2.5rem', margin: '0 0 1rem' }}>{f.icon}</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>{f.title}</p>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* 하단 CTA */}
      <div style={{
        textAlign: 'center', padding: '3rem',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px'
      }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' }}>
          지금 바로 시작하세요!
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          개발자들과 코드를 공유하고 함께 성장하세요
        </p>
        <Link href="/signup" style={{
          background: '#6366f1', color: '#fff', padding: '14px 36px',
          borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem'
        }}>
          무료로 시작하기 →
        </Link>
      </div>
    </div>
  )

  // 로그인 된 경우 피드
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)' }}>
          최근 공유된 코드
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>개발자들이 공유한 코드와 아이디어를 탐색해보세요</p>
      </div>

      {/* 언어 필터 */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {LANGUAGES.map(l => (
          <button key={l} onClick={() => setLang(l)} style={{
            background: lang === l ? '#6366f1' : 'var(--bg-card)',
            color: lang === l ? '#fff' : 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '6px 14px', borderRadius: '20px',
            cursor: 'pointer', fontSize: '0.85rem'
          }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-dim)' }}>불러오는 중...</p>
      ) : posts.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>아직 게시물이 없습니다.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts.map(post => (
            <CodeCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
