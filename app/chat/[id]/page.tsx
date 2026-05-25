'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

type Msg = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: { username: string; avatar_url: string | null };
};

export default function ChatPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const [myId, setMyId] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [otherUser, setOtherUser] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setMyId(user.id);

      // 채팅방 정보 (상대방 이름 가져오기)
      const { data: room } = await supabase
        .from('chat_rooms')
        .select(
          '*, p1:profiles!chat_rooms_user1_id_fkey(username), p2:profiles!chat_rooms_user2_id_fkey(username)'
        )
        .eq('id', roomId)
        .single();

      if (room) {
        const other =
          room.user1_id === user.id ? (room as any).p2 : (room as any).p1;
        setOtherUser(other?.username || '상대방');
      }

      // 이전 메시지 로드
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, profiles(username, avatar_url)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      setMessages(msgs || []);

      // 실시간 구독
      const channel = supabase
        .channel(`room-${roomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${roomId}`,
          },
          async (payload) => {
            const { data } = await supabase
              .from('messages')
              .select('*, profiles(username, avatar_url)')
              .eq('id', payload.new.id)
              .single();
            if (data) setMessages((m) => [...m, data]);
          }
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    };
    init();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    await supabase
      .from('messages')
      .insert({ room_id: roomId, sender_id: myId, content: input.trim() });
    setInput('');
  };

  return (
    <div
      style={{
        maxWidth: '700px',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
      }}
    >
      <div
        style={{
          padding: '1rem 0',
          borderBottom: '1px solid #1e1e1e',
          marginBottom: '1rem',
        }}
      >
        <h1 style={{ fontSize: '1.2rem', margin: 0 }}>💬 {otherUser}</h1>
      </div>

      {/* 메시지 목록 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingBottom: '1rem',
        }}
      >
        {messages.map((m) => {
          const isMine = m.sender_id === myId;
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{ maxWidth: '70%' }}>
                {!isMine && (
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: '0.75rem',
                      color: '#888',
                    }}
                  >
                    {m.profiles?.username}
                  </p>
                )}
                <div
                  style={{
                    background: isMine ? '#6366f1' : '#1e1e1e',
                    color: '#eee',
                    padding: '10px 14px',
                    borderRadius: isMine
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                  }}
                >
                  {m.content}
                </div>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '0.7rem',
                    color: '#555',
                    textAlign: isMine ? 'right' : 'left',
                  }}
                >
                  {new Date(m.created_at).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          paddingTop: '1rem',
          borderTop: '1px solid #1e1e1e',
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="메시지를 입력하세요..."
          style={{
            flex: 1,
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            color: '#eee',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.95rem',
            outline: 'none',
          }}
        />
        <button
          onClick={send}
          style={{
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          전송
        </button>
      </div>
    </div>
  );
}
