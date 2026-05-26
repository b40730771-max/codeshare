'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import CodeCard from '@/components/CodeCard'

type Profile = {
  id: string
  username: string
  bio: string | null
  avatar_url: string | null
  followers_count: number
  following_count: number
}

type Post = {
  id: string
  title: string
  code: string
  language: string
  tags: string[]
  likes_count: number
  stars_count: number
  created_at: string
  user_id: string
  profiles?: { username: string; avatar_url: string | null }
}

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [myId, setMyId] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setMyId(user.id)

      // 프로필 가져오기
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (!p) { router.push('/'); return }
      setProfile(p)

      // 내가 팔로우하는지 확인
      if (user) {
        const { data: follow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', p.id)
          .maybeSingle()
        setIsFollowing(!!follow)
      }

      // 올린 코드 가져오기
      const { data: userPosts } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url)')
        .eq('user_id', p.id)
        .order('created_at', { ascending: false })
      setPosts((userPosts as any) || [])
      setLoading(false)
    }
    load()
  }, [username])

  const toggleFollow = async () => {
    if (!myId) { router.push('/login'); return }
    if (!profile) return

    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', myId).eq('following_id', profile.id)
      setIsFollowing(false)
      setProfile(p => p ? { ...p, followers_count: p.followers_count - 1 } : p)
    } else {
      await supabase.from('follows').insert({ follower_id: myId, following_id: profile.id })
      await supabase.from('notifications').insert({
        user_id: profile.id, from_user_id: myId, type: 'follow'
      })
      setIsFollowing(true)
      setProfile(p => p ? { ...p, followers_count: p.followers_count + 1 } : p)
    }
  }

  if (loading) return <p style={{ color: 'var(--text-dim)' }}>불러오는 중...</p>
  if (!profile) return <p style={{ color: 'var(--text-dim)' }}>유저를 찾을 수 없습니다</p>

  const isMe = myId === profile.id

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* 프로필 헤더 */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '2rem', marginBottom: '2rem',
        display: 'flex', gap: '1.5rem', alignItems: 'flex-start'
      }}>
        {/* 아바타 */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: '#6366f1', overflow: 'hidden', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '2rem', color: '#fff'
        }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : profile.username[0]?.toUpperCase()}
        </div>

        {/* 정보 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                {profile.username}
              </h1>
              {profile.bio && <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>{profile.bio}</p>}
            </div>
            {isMe ? (
              <button onClick={() => router.push('/profile')} style={btnStyle}>
                ✏️ 프로필 수정
              </button>
            ) : (
              <button onClick={toggleFollow} style={{
                ...btnStyle,
                background: isFollowing ? 'var(--bg)' : '#6366f1',
                color: isFollowing ? 'var(--text)' : '#fff',
                border: isFollowing ? '1px solid var(--border)' : 'none'
              }}>
                {isFollowing ? '팔로잉 ✓' : '팔로우'}
              </button>
            )}
          </div>

          {/* 통계 */}
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem', color: 'var(--text)' }}>{posts.length}</p>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>게시물</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem', color: 'var(--text)' }}>{profile.followers_count}</p>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>팔로워</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem', color: 'var(--text)' }}>{profile.following_count}</p>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>팔로잉</p>
            </div>
          </div>
        </div>
      </div>

      {/* 게시물 목록 */}
      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text)' }}>
        올린 코드 {posts.length}개
      </h2>
      {posts.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>아직 올린 코드가 없어요</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts.map(post => (
            <CodeCard key={post.id} post={post as any} />
          ))}
        </div>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: '#6366f1', color: '#fff', border: 'none',
  padding: '8px 20px', borderRadius: '8px', cursor: 'pointer',
  fontSize: '0.9rem', fontWeight: 600
}
