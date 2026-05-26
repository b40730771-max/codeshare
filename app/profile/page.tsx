'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  followers_count: number
  following_count: number
}

export default function ProfilePage() {
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState<'edit' | 'followers' | 'following'>('edit')
  const [followers, setFollowers] = useState<Profile[]>([])
  const [following, setFollowing] = useState<Profile[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [myId, setMyId] = useState('')
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setMyId(user.id)

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setUsername(data.username)
        setBio(data.bio || '')
        setAvatarUrl(data.avatar_url || '')
        setFollowersCount(data.followers_count || 0)
        setFollowingCount(data.following_count || 0)
      }

      // 팔로워 목록
      const { data: followerData } = await supabase
        .from('follows')
        .select('profiles!follows_follower_id_fkey(id, username, avatar_url, bio, followers_count, following_count)')
        .eq('following_id', user.id)
      setFollowers((followerData?.map((f: any) => f.profiles) || []))

      // 팔로잉 목록
      const { data: followingData } = await supabase
        .from('follows')
        .select('profiles!follows_following_id_fkey(id, username, avatar_url, bio, followers_count, following_count)')
        .eq('follower_id', user.id)
      setFollowing((followingData?.map((f: any) => f.profiles) || []))
    }
    load()
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let newAvatarUrl = avatarUrl
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `avatars/${user.id}_${Date.now()}.${ext}`
      await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      newAvatarUrl = data.publicUrl
    }

    const { error } = await supabase.from('profiles')
      .update({ username, bio, avatar_url: newAvatarUrl })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      setMsg('저장 실패: ' + error.message)
    } else {
      setAvatarUrl(newAvatarUrl)
      setMsg('저장되었습니다 ✓')
    }
  }

  const unfollow = async (targetId: string) => {
    await supabase.from('follows').delete().eq('follower_id', myId).eq('following_id', targetId)
    setFollowing(f => f.filter(u => u.id !== targetId))
    setFollowingCount(c => c - 1)
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>내 프로필</h1>

      {/* 통계 */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', flex: 1, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>{followersCount}</p>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>팔로워</p>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', flex: 1, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>{followingCount}</p>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>팔로잉</p>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        {([['edit', '✏️ 프로필 수정'], ['followers', '👥 팔로워'], ['following', '👤 팔로잉']] as const).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, background: tab === t ? '#6366f1' : 'transparent',
            color: tab === t ? '#fff' : 'var(--text-muted)',
            border: 'none', padding: '10px', cursor: 'pointer', fontSize: '0.875rem'
          }}>{l}</button>
        ))}
      </div>

      {/* 프로필 수정 탭 */}
      {tab === 'edit' && (
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#6366f1', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '1.4rem', color: '#fff'
            }}>
              {avatarUrl
                ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" />
                : username[0]?.toUpperCase()}
            </div>
            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'block', marginBottom: '4px' }}>프로필 사진</label>
              <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)}
                style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>사용자 이름</label>
            <input value={username} onChange={e => setUsername(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>자기소개</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
              placeholder="간단한 소개를 작성해보세요" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          {msg && <p style={{ color: msg.includes('실패') ? '#f87171' : '#4ade80', fontSize: '0.875rem' }}>{msg}</p>}
          <button type="submit" disabled={saving} style={btnStyle}>
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </form>
      )}

      {/* 팔로워 탭 */}
      {tab === 'followers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {followers.length === 0 && <p style={{ color: 'var(--text-dim)' }}>팔로워가 없어요</p>}
          {followers.map(u => (
            <div key={u.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="" /> : u.username[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <a href={`/user/${u.username}`} style={{ margin: 0, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>{u.username}</a>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.bio || '소개 없음'}</p>
              </div>
              <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.8rem' }}>팔로워 {u.followers_count}</p>
            </div>
          ))}
        </div>
      )}

      {/* 팔로잉 탭 */}
      {tab === 'following' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {following.length === 0 && <p style={{ color: 'var(--text-dim)' }}>팔로잉하는 사람이 없어요</p>}
          {following.map(u => (
            <div key={u.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="" /> : u.username[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <a href={`/user/${u.username}`} style={{ margin: 0, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>{u.username}</a>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.bio || '소개 없음'}</p>
              </div>
              <button onClick={() => unfollow(u.id)} style={{ background: '#2a2a2a', color: '#f87171', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                언팔로우
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: '0.875rem', display: 'block', marginBottom: '6px' }
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
