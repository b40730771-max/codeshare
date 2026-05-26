'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Member = {
  id: string
  username: string
  bio: string | null
  avatar_url: string | null
  followers_count: number
  following_count: number
  post_count: number
  is_following: boolean
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [myId, setMyId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setMyId(user.id)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (!profiles) return

      const withData = await Promise.all(profiles.map(async p => {
        const { count: postCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', p.id)

        let isFollowing = false
        if (user) {
          const { data: follow } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', p.id)
            .single()
          isFollowing = !!follow
        }

        return {
          ...p,
          post_count: postCount || 0,
          is_following: isFollowing
        }
      }))

      setMembers(withData)
      setLoading(false)
    }
    load()
  }, [])

  const toggleFollow = async (member: Member) => {
    if (!myId) { window.location.href = '/login'; return }
    if (member.id === myId) return

    if (member.is_following) {
      await supabase.from('follows')
        .delete()
        .eq('follower_id', myId)
        .eq('following_id', member.id)
    } else {
      await supabase.from('follows')
        .insert({ follower_id: myId, following_id: member.id })
      await supabase.from('notifications').insert({
        user_id: member.id, from_user_id: myId, type: 'follow'
      })
    }

    setMembers(ms => ms.map(m =>
      m.id === member.id
        ? {
            ...m,
            is_following: !m.is_following,
            followers_count: m.is_following ? m.followers_count - 1 : m.followers_count + 1
          }
        : m
    ))
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>멤버 목록</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>총 {members.length}명이 함께하고 있어요</p>

      {loading && <p style={{ color: '#555' }}>불러오는 중...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {members.map(m => (
          <div key={m.id} style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            borderRadius: '12px', padding: '1.25rem',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: '#6366f1', overflow: 'hidden',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#fff'
              }}>
                {m.avatar_url
                  ? <img src={m.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  : m.username[0]?.toUpperCase()}
              </div>
              {m.id !== myId && (
                <button onClick={() => toggleFollow(m)} style={{
                  background: m.is_following ? '#2a2a2a' : '#6366f1',
                  color: '#fff', border: 'none', padding: '6px 14px',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem'
                }}>
                  {m.is_following ? '팔로잉 ✓' : '팔로우'}
                </button>
              )}
            </div>
            <a href={`/user/${m.username}`} style={{ margin: 0, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>{m.username}</a>
            <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>{m.bio || '소개 없음'}</p>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#666' }}>
              <span>게시물 {m.post_count}</span>
              <span>팔로워 {m.followers_count}</span>
              <span>팔로잉 {m.following_count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
