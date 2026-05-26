'use client'
import { Post } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import CodeBlock from '@/components/CodeBlock'

export default function CodeCard({ post }: { post: Post }) {
  const [likes, setLikes] = useState(post.likes_count)
  const [stars, setStars] = useState((post as any).stars_count || 0)
  const [liked, setLiked] = useState(false)
  const [starred, setStarred] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      // 실제 카운트 DB에서 다시 가져오기
      const { data: postData } = await supabase
        .from('posts')
        .select('likes_count, stars_count')
        .eq('id', post.id)
        .single()
      if (postData) {
        setLikes(postData.likes_count)
        setStars(postData.stars_count || 0)
      }

      if (!user) return

      const { data: like } = await supabase
        .from('likes').select('id')
        .eq('post_id', post.id).eq('user_id', user.id).maybeSingle()
      setLiked(!!like)

      const { data: star } = await supabase
        .from('stars').select('id')
        .eq('post_id', post.id).eq('user_id', user.id).maybeSingle()
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
          user_id: post.user_id, from_user_id: user.id, type: 'like', post_id: post.id
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
          user_id: post.user_id, from_user_id: user.id, type: 'star', post_id: post.id
        })
      }
    }
  }

  const goToPost = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    window.location.href = `/post/${post.id}`
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '1.25rem'
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '1.05rem' }}>{post.title}</span>
          <p style={{ margin: '4px 0 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            by {post.profiles?.username} · {new Date(post.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <span style={{
          background: '#2a2a3a', color: '#a5b4fc',
          padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem'
        }}>
          {post.language}
        </span>
      </div>

      {/* 코드 미리보기 */}
      <div style={{ marginBottom: '1rem' }}>
        <CodeBlock code={post.code} language={post.language} preview />
      </div>

      {/* 태그 + 버튼 */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {post.tags?.map(tag => (
          <span key={tag} style={{
            background: 'var(--border)', color: 'var(--text-muted)',
            padding: '2px 10px', borderRadius: '20px', fontSize: '0.78rem'
          }}>#{tag}</span>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={handleStar} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.875rem', padding: '4px 8px', borderRadius: '6px',
            color: starred ? '#fbbf24' : 'var(--text-dim)',
            transition: 'color 0.2s'
          }}>
            {starred ? '★' : '☆'} {stars}
          </button>
          <button onClick={handleLike} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.875rem', padding: '4px 8px', borderRadius: '6px',
            color: liked ? '#f87171' : 'var(--text-dim)',
            transition: 'color 0.2s'
          }}>
            {liked ? '♥' : '♡'} {likes}
          </button>
          <button onClick={goToPost} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6366f1', fontSize: '0.875rem', padding: '4px 8px'
          }}>
            자세히 보기 →
          </button>
        </div>
      </div>
    </div>
  )
}
