'use client'
import { Post } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export default function CodeCard({ post }: { post: Post }) {
  const [likes, setLikes] = useState(post.likes_count)
  const [stars, setStars] = useState((post as any).stars_count || 0)
  const [liked, setLiked] = useState(false)
  const [starred, setStarred] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: like } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle()
      setLiked(!!like)

      const { data: star } = await supabase
        .from('stars')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle()
      setStarred(!!star)
    }
    checkStatus()
  }, [post.id])

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('로그인이 필요합니다'); return }

    if (liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id)
      setLikes(l => l - 1)
      setLiked(false)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id })
      setLikes(l => l + 1)
      setLiked(true)
      if (user.id !== post.user_id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id, from_user_id: user.id,
          type: 'like', post_id: post.id
        })
      }
    }
  }

  const handleStar = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('로그인이 필요합니다'); return }

    if (starred) {
      await supabase.from('stars').delete().eq('post_id', post.id).eq('user_id', user.id)
      setStars((s: number) => s - 1)
      setStarred(false)
    } else {
      await supabase.from('stars').insert({ post_id: post.id, user_id: user.id })
      setStars((s: number) => s + 1)
      setStarred(true)
      if (user.id !== post.user_id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id, from_user_id: user.id,
          type: 'star', post_id: post.id
        })
      }
    }
  }

  const goToPost = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    window.location.href = `/post/${post.id}`
  }

  const preview = post.code.split('\n').slice(0, 3).join('\n')

  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <span style={{ color: '#eee', fontWeight: 600, fontSize: '1.05rem' }}>
            {post.title}
          </span>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85rem' }}>
            by {post.profiles?.username} · {new Date(post.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <span style={{ background: '#2a2a3a', color: '#a5b4fc', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>
          {post.language}
        </span>
      </div>
      <pre style={{ background: '#111', borderRadius: '8px', padding: '1rem', overflowX: 'auto', fontSize: '0.8rem', color: '#ccc', margin: '0 0 1rem', maxHeight: '80px', overflow: 'hidden' }}>
        <code>{preview}{post.code.split('\n').length > 3 ? '\n...' : ''}</code>
      </pre>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {post.tags?.map(tag => (
          <span key={tag} style={{ background: '#222', color: '#888', padding: '2px 10px', borderRadius: '20px', fontSize: '0.78rem' }}>#{tag}</span>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <button onClick={handleStar} style={{ background: 'none', border: 'none', color: starred ? '#fbbf24' : '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>
            ⭐ {stars}
          </button>
          <button onClick={handleLike} style={{ background: 'none', border: 'none', color: liked ? '#f87171' : '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>
            ♥ {likes}
          </button>
          <button onClick={goToPost} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.875rem' }}>
            자세히 보기 →
          </button>
        </div>
      </div>
    </div>
  )
}
