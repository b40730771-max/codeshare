'use client'
import { useEffect, useState } from 'react'
import { supabase, Post } from '@/lib/supabase'
import CodeCard from '@/components/CodeCard'

const LANGUAGES = ['전체', 'javascript', 'typescript', 'python', 'rust', 'go', 'css', 'html', 'java', 'cpp', 'c']

const FEATURES = [
  { icon: '💻', title: '코드 공유', desc: '내가 만든 코드를 공유하고 피드백을 받아보세요' },
  { icon: '🌿', title: '브랜치 & PR', desc: '브랜치로 작업하고 Pull Request로 코드 리뷰를 요청하세요' },
  { icon: '📋', title: '커밋 히스토리', desc: '코드 변경 이력을 커밋으로 관리하고 롤백할 수 있어요' },
  { icon: '🐛', title: 'Issues', desc: '버그를 신고하고 기능 요청을 관리하세요' },
  { icon: '👥', title: '팔로우 & 친구', desc: '다른 개발자를 팔로우하고 친구를 만들어보세요' },
  { icon: '💬', title: '실시간 채팅', desc: '친구와 실시간으로 대화하며 코드를 논의하세요' },
  { icon: '✉️', title: '우편함', desc: '다른 사용자에게 쪽지를 보내고 받을 수 있어요' },
  { icon: '🔔', title: '알림', desc: '좋아요, 댓글, 팔로우 알림을 실시간으로 받아요' },
]

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [lang, setLang] = useState('전체')
  const [loading, setLoading] = useState(true)
  const [showFeatures, setShowFeatures] = useState(false)

  useEffect(() => {
    fetchPosts()
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

  return (
    <div>
      {/* 히어로 섹션 */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '2rem', marginBottom: '2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>
            {'<CodeShare />'}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>
            코드를 공유하고, 함께 성장하는 개발자 커뮤니티
          </p>
        </div>
        <button onClick={() => setShowFeatures(!showFeatures)} style={{
          background: 'none', border: '1px solid var(--border)',
          color: 'var(--text-muted)', padding: '8px 16px', borderRadius: '8px',
          cursor: 'pointer', fontSize: '0.875rem'
        }}>
          {showFeatures ? '기능 숨기기 ▲' : '기능 보기 ▼'}
        </button>
      </div>

      {/* 기능 설명 */}
      {showFeatures && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem', marginBottom: '2rem'
        }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '1.25rem'
            }}>
              <p style={{ margin: '0 0 8px', fontSize: '1.5rem' }}>{f.icon}</p>
              <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>{f.title}</p>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* 최근 코드 */}
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
