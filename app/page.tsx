'use client'
import { useEffect, useState } from 'react'
import { supabase, Post } from '@/lib/supabase'
import CodeCard from '@/components/CodeCard'
import Link from 'next/link'

const LANGUAGES = ['전체', 'javascript', 'typescript', 'python', 'rust', 'go', 'css', 'html', 'java', 'c++', 'c']

const SLIDES = [
  {
    icon: '⚡',
    title: 'CodeShare',
    subtitle: 'Share & Recommend & Follow & Talk',
    desc: '개발자들과 코드를 공유하고 함께 성장하는 커뮤니티',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    color: '#a5b4fc'
  },
  {
    icon: '💻',
    title: '코드 공유',
    subtitle: 'Share Your Code',
    desc: '내가 만든 코드를 공유하고 다른 개발자들의 피드백을 받아보세요. 좋아요와 별로 좋은 코드를 추천할 수 있어요.',
    bg: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    color: '#4ade80'
  },
  {
    icon: '🌿',
    title: '브랜치 & PR',
    subtitle: 'Branch & Pull Request',
    desc: '브랜치로 새 기능을 개발하고 Pull Request로 코드 리뷰를 요청하세요. 자신이 원하는 버전을 골라 그 버전을 관리할 수 있어요.',
    bg: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    color: '#fbbf24'
  },
  {
    icon: '👥',
    title: '소셜 기능',
    subtitle: 'Follow & Chat & Mail',
    desc: '다른 개발자를 팔로우하고, 친구를 추가하고, 실시간 채팅과 쪽지로 소통하세요.',
    bg: 'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
    color: '#f87171'
  },
  {
    icon: '👨‍💻',
    title: '개발자 소개',
    subtitle: 'Developer',
    desc: 'CodeShare는 개발자들이 서로 코드를 공유하고 성장할 수 있는 공간을 만들기 위해 개발됐어요.',
    extra: 'csw20100411@gmail.com',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #4a1942 100%)',
    color: '#a5b4fc'
  },
]

function Carousel({ showButtons }: { showButtons: boolean }) {
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide(s => (s + 1) % SLIDES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ position: 'relative', marginBottom: '2rem' }}>
      <div style={{
        background: SLIDES[slide].bg,
        borderRadius: '20px',
        padding: '4rem 2rem',
        textAlign: 'center',
        transition: 'all 0.5s ease',
        minHeight: '280px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{SLIDES[slide].icon}</div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#fff' }}>
          {SLIDES[slide].title}
        </h1>
        <p style={{ fontSize: '1rem', color: SLIDES[slide].color, marginBottom: '1rem', fontWeight: 600 }}>
          {SLIDES[slide].subtitle}
        </p>
        <p style={{ fontSize: '0.95rem', color: '#aaa', maxWidth: '600px', lineHeight: 1.7, marginBottom: '0.5rem' }}>
          {SLIDES[slide].desc}
        </p>
        {(SLIDES[slide] as any).extra && (
          <p style={{ color: '#6366f1', fontSize: '0.9rem' }}>📧 {(SLIDES[slide] as any).extra}</p>
        )}

        {/* 로그인 전 버튼 */}
        {showButtons && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/signup" style={{
              background: '#6366f1', color: '#fff', padding: '12px 32px',
              borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem'
            }}>
              Sign Up
            </Link>
            <Link href="/login" style={{
              background: 'transparent', color: '#fff', padding: '12px 32px',
              borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* 좌우 버튼 */}
      <button onClick={() => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length)} style={{
        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
        width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
        fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>‹</button>
      <button onClick={() => setSlide(s => (s + 1) % SLIDES.length)} style={{
        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
        width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
        fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>›</button>

      {/* 점 인디케이터 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '1rem' }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setSlide(i)} style={{
            width: i === slide ? '24px' : '8px', height: '8px',
            borderRadius: '4px', border: 'none', cursor: 'pointer',
            background: i === slide ? '#6366f1' : '#444',
            transition: 'all 0.3s ease', padding: 0
          }} />
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [lang, setLang] = useState('전체')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userChecked, setUserChecked] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setUserChecked(true)
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
    const { data } = await query.limit(10)
    setPosts(data || [])
    setLoading(false)
  }

  if (!userChecked) return null

  return (
    <div>
      {/* 캐러셀 — 항상 보임 */}
      <Carousel showButtons={!user} />

      {/* 로그인 안 된 경우 기능 카드 */}
      {!user && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {[
            { icon: '💻', title: 'Share', desc: '내가 만든 코드를 공유하세요' },
            { icon: '⭐', title: 'Recommend', desc: '좋은 코드에 별과 하트를 남기세요' },
            { icon: '👥', title: 'Follow', desc: '다른 개발자를 팔로우하세요' },
            { icon: '💬', title: 'Talk', desc: '친구와 실시간으로 대화하세요' },
          ].map(f => (
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
      )}

      {/* 로그인 된 경우 피드 */}
      {user && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)' }}>
              최근 공유된 코드
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>개발자들이 공유한 코드와 아이디어를 탐색해보세요</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {LANGUAGES.map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                background: lang === l ? '#6366f1' : 'var(--bg-card)',
                color: lang === l ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                padding: '4rem 2rem',
                borderRadius: '20px',
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
        </>
      )}
    </div>
  )
}
