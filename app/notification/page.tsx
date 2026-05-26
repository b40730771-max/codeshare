'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  type: string
  is_read: boolean
  created_at: string
  post_id: string | null
  from_user: { username: string; avatar_url: string | null }
}

const typeLabel: Record<string, string> = {
  like: '님이 회원님의 코드를 좋아합니다 ♥',
  comment: '님이 댓글을 달았습니다 💬',
  follow: '님이 회원님을 팔로우합니다 👤',
  star: '님이 회원님의 코드에 별을 달았습니다 ⭐',
  friend_request: '님이 친구 요청을 보냈습니다 🤝',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('notifications')
        .select('*, from_user:profiles!notifications_from_user_id_fkey(username, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setNotifications((data as any) || [])
      setLoading(false)

      // 전체 읽음 처리
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
    }
    load()
  }, [])

  const handleClick = (n: Notification) => {
    if (n.post_id) router.push(`/post/${n.post_id}`)
  }

  return (
    <div style={{ maxWidth: '700px' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>🔔 알림</h1>
      {loading && <p style={{ color: '#555' }}>불러오는 중...</p>}
      {!loading && notifications.length === 0 && (
        <p style={{ color: '#555' }}>알림이 없습니다</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notifications.map(n => (
          <div key={n.id} onClick={() => handleClick(n)} style={{
            background: n.is_read ? '#1a1a1a' : '#1e1e2e',
            border: `1px solid ${n.is_read ? '#2a2a2a' : '#6366f1'}`,
            borderRadius: '10px', padding: '14px 16px',
            cursor: n.post_id ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: '#6366f1', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 700, flexShrink: 0
            }}>
              {n.from_user?.username?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{n.from_user?.username}</span>
                <span style={{ color: '#ccc' }}>{typeLabel[n.type] || ''}</span>
              </p>
              <p style={{ margin: '4px 0 0', color: '#555', fontSize: '0.75rem' }}>
                {new Date(n.created_at).toLocaleString('ko-KR')}
              </p>
            </div>
            {!n.is_read && (
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
