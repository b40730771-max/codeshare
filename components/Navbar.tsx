'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/theme'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [unread, setUnread] = useState(0)
  const { theme, toggle } = useTheme()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      if (data.user) fetchUnread(data.user.id)
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchUnread(session.user.id)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const fetchUnread = async (uid: string) => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('is_read', false)
    setUnread(count || 0)
  }

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => setUnread(n => n + 1))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav style={{
      background: 'var(--nav-bg)',
      borderBottom: '1px solid var(--border)',
      padding: '0 2rem',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <Link href="/" style={{ color: 'var(--text)', fontWeight: 700, fontSize: '1.2rem', textDecoration: 'none' }}>
        {'<CodeShare />'}
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link href="/" style={navLink}>홈</Link>
        <Link href="/search" style={navLink}>검색</Link>
        <Link href="/members" style={navLink}>멤버</Link>
        {user ? (
          <>
            <Link href="/friends" style={navLink}>친구</Link>
            <Link href="/mail" style={navLink}>✉️ 우편함</Link>
            <Link href="/notifications" onClick={() => setUnread(0)} style={{ ...navLink, position: 'relative' }}>
              🔔 알림
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: '-8px', right: '-10px',
                  background: '#f87171', color: '#fff', borderRadius: '50%',
                  width: '18px', height: '18px', fontSize: '0.7rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{unread > 9 ? '9+' : unread}</span>
              )}
            </Link>
            <Link href="/profile" style={navLink}>프로필</Link>
            <Link href="/upload" style={navLink}>+ 공유하기</Link>
            <button onClick={logout} style={btnStyle}>로그아웃</button>
          </>
        ) : (
          <>
            <Link href="/login" style={navLink}>로그인</Link>
            <Link href="/signup" style={{ ...btnStyle, textDecoration: 'none', padding: '6px 16px', borderRadius: '6px' }}>
              회원가입
            </Link>
          </>
        )}
        {/* 테마 토글 */}
        <button onClick={toggle} style={{
          background: 'none', border: '1px solid var(--border)',
          color: 'var(--text)', padding: '6px 10px', borderRadius: '6px',
          cursor: 'pointer', fontSize: '1rem'
        }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  )
}

const navLink: React.CSSProperties = {
  color: 'var(--text-muted)',
  textDecoration: 'none',
  fontSize: '0.9rem',
  transition: 'color 0.2s'
}

const btnStyle: React.CSSProperties = {
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  padding: '6px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem'
}
