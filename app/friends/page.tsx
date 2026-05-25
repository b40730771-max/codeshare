'use client';
import { useEffect, useState } from 'react';
import { supabase, Profile } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type FriendRequest = {
  id: string;
  status: string;
  requester_id: string;
  receiver_id: string;
  profiles: Profile;
};

export default function FriendsPage() {
  const [myId, setMyId] = useState('');
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const [pending, setPending] = useState<FriendRequest[]>([]);
  const [received, setReceived] = useState<FriendRequest[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setMyId(user.id);
      loadFriends(user.id);
    };
    load();
  }, []);

  const loadFriends = async (uid: string) => {
    const { data } = await supabase
      .from('friendships')
      .select('*, profiles!friendships_receiver_id_fkey(*)')
      .eq('requester_id', uid);

    const { data: recv } = await supabase
      .from('friendships')
      .select('*, profiles!friendships_requester_id_fkey(*)')
      .eq('receiver_id', uid);

    setFriends((data || []).filter((f: any) => f.status === 'accepted'));
    setPending((data || []).filter((f: any) => f.status === 'pending'));
    setReceived((recv || []).filter((f: any) => f.status === 'pending'));
  };

  const searchUsers = async () => {
    if (!search.trim()) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${search}%`)
      .neq('id', myId)
      .limit(10);
    setSearchResults(data || []);
  };

  const sendRequest = async (receiverId: string) => {
    await supabase
      .from('friendships')
      .insert({ requester_id: myId, receiver_id: receiverId });
    setSearchResults((r) => r.filter((u) => u.id !== receiverId));
    loadFriends(myId);
  };

  const acceptRequest = async (id: string) => {
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', id);
    loadFriends(myId);
  };

  const rejectRequest = async (id: string) => {
    await supabase.from('friendships').delete().eq('id', id);
    loadFriends(myId);
  };

  const openChat = async (friendId: string) => {
    const [u1, u2] = [myId, friendId].sort();
    const { data: existing } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('user1_id', u1)
      .eq('user2_id', u2)
      .single();

    if (existing) {
      router.push(`/chat/${existing.id}`);
      return;
    }

    const { data: newRoom } = await supabase
      .from('chat_rooms')
      .insert({ user1_id: u1, user2_id: u2 })
      .select('id')
      .single();

    if (newRoom) router.push(`/chat/${newRoom.id}`);
  };

  return (
    <div style={{ maxWidth: '700px' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>친구</h1>

      {/* 유저 검색 */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>친구 찾기</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            placeholder="사용자 이름으로 검색"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={searchUsers} style={btnStyle}>
            검색
          </button>
        </div>
        {searchResults.map((u) => (
          <div key={u.id} style={rowStyle}>
            <Avatar name={u.username} url={u.avatar_url} />
            <span style={{ flex: 1 }}>{u.username}</span>
            <button onClick={() => sendRequest(u.id)} style={smallBtn}>
              친구 추가
            </button>
          </div>
        ))}
      </section>

      {/* 받은 친구 요청 */}
      {received.length > 0 && (
        <section style={sectionStyle}>
          <h2 style={h2Style}>받은 요청 ({received.length})</h2>
          {received.map((r: any) => (
            <div key={r.id} style={rowStyle}>
              <Avatar name={r.profiles.username} url={r.profiles.avatar_url} />
              <span style={{ flex: 1 }}>{r.profiles.username}</span>
              <button
                onClick={() => acceptRequest(r.id)}
                style={{ ...smallBtn, background: '#4ade80', color: '#000' }}
              >
                수락
              </button>
              <button
                onClick={() => rejectRequest(r.id)}
                style={{ ...smallBtn, background: '#f87171', color: '#000' }}
              >
                거절
              </button>
            </div>
          ))}
        </section>
      )}

      {/* 보낸 요청 */}
      {pending.length > 0 && (
        <section style={sectionStyle}>
          <h2 style={h2Style}>보낸 요청</h2>
          {pending.map((r: any) => (
            <div key={r.id} style={rowStyle}>
              <Avatar name={r.profiles.username} url={r.profiles.avatar_url} />
              <span style={{ flex: 1 }}>{r.profiles.username}</span>
              <span style={{ color: '#888', fontSize: '0.8rem' }}>대기 중</span>
            </div>
          ))}
        </section>
      )}

      {/* 친구 목록 */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>친구 ({friends.length})</h2>
        {friends.length === 0 ? (
          <p style={{ color: '#555' }}>아직 친구가 없어요</p>
        ) : (
          friends.map((f: any) => (
            <div key={f.id} style={rowStyle}>
              <Avatar name={f.profiles.username} url={f.profiles.avatar_url} />
              <span style={{ flex: 1 }}>{f.profiles.username}</span>
              <button onClick={() => openChat(f.profiles.id)} style={smallBtn}>
                💬 대화
              </button>
              <Link
                href={`/mail/compose?to=${f.profiles.id}&name=${f.profiles.username}`}
                style={{ ...smallBtn, textDecoration: 'none' }}
              >
                ✉️ 쪽지
              </Link>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  return (
    <div
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: '#6366f1',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.95rem',
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {url ? (
        <img
          src={url}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          alt=""
        />
      ) : (
        name[0]?.toUpperCase()
      )}
    </div>
  );
}

const sectionStyle: React.CSSProperties = { marginBottom: '2rem' };
const h2Style: React.CSSProperties = {
  fontSize: '1rem',
  color: '#aaa',
  marginBottom: '1rem',
  fontWeight: 500,
};
const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 0',
  borderBottom: '1px solid #1e1e1e',
};
const inputStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  color: '#eee',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '0.95rem',
  outline: 'none',
};
const btnStyle: React.CSSProperties = {
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.9rem',
};
const smallBtn: React.CSSProperties = {
  background: '#2a2a2a',
  color: '#eee',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.8rem',
};
