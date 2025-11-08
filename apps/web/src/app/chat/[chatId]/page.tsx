/* eslint-env browser */
'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { Button } from '@sparesx/ui';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { isAuthError } from '@/lib/session-utils';

interface ChatPageProps {
  params: {
    chatId: string;
  };
}

interface ApiMessage {
  _id?: string;
  chatId: string;
  senderId: string;
  text?: string;
  type?: string;
  status?: string;
  createdAt: string;
  localId?: string;
}

interface SocketPayload {
  chatId: string;
  senderId: string;
  text?: string;
  status?: string;
  createdAt: string;
  localId?: string;
}

interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  status?: string;
  createdAt: string;
  localId?: string;
  pending?: boolean;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export default function ChatPage({ params }: ChatPageProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isFetchingMessages, setIsFetchingMessages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef(null);
  const messagingBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003', []);

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      if (!user) {
        setIsFetchingMessages(false);
        return;
      }

      try {
        setError(null);
        setIsFetchingMessages(true);

        const response = await apiClient.get(`${messagingBaseUrl}/api/chat/${params.chatId}/messages`, {
          params: { limit: 100 },
        });

        if (!isMounted) {
          return;
        }

        if (response.data?.success) {
          const apiMessages: ApiMessage[] = Array.isArray(response.data.data) ? response.data.data : [];
          const normalised = apiMessages
            .slice()
            .reverse()
            .map<ChatMessage>((message) => ({
              id: message._id || message.localId || `${message.senderId}-${message.createdAt}`,
              chatId: message.chatId,
              senderId: message.senderId,
              text: message.text,
              status: message.status ?? 'sent',
              createdAt: message.createdAt,
              localId: message.localId,
              pending: false,
            }));

          setMessages(normalised);
          setParticipants(response.data?.metadata?.participants ?? []);
        } else {
          throw new Error('Unexpected response format while loading messages.');
        }
      } catch (err: unknown) {
        if (!isMounted) {
          return;
        }

        console.error('Failed to load chat messages', err);

        if (isAuthError(err)) {
          toast.error('Your session expired. Please log in again.');
          router.push(`/auth/login?redirect=/chat/${params.chatId}`);
          return;
        }

        setError('Unable to load messages right now. Please try again later.');
      } finally {
        if (isMounted) {
          setIsFetchingMessages(false);
        }
      }
    };

    if (!authLoading) {
      loadMessages();
    }

    return () => {
      isMounted = false;
    };
  }, [authLoading, messagingBaseUrl, params.chatId, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const token = typeof window !== 'undefined' ? window.localStorage.getItem('accessToken') : null;

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: {
        token: token ?? undefined,
      },
      autoConnect: true,
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionState('connected');
      socket.emit('join:chat', { chatId: params.chatId });
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error', err);
      setConnectionState('disconnected');
      toast.error('Failed to connect to messaging service.');
    });

    socket.on('message:receive', (payload: SocketPayload) => {
      setMessages((prev) => {
        const normalised: ChatMessage = {
          id: payload.localId || `${payload.senderId}-${payload.createdAt}`,
          chatId: payload.chatId,
          senderId: payload.senderId,
          text: payload.text,
          status: payload.status ?? 'sent',
          createdAt: payload.createdAt,
          localId: payload.localId,
          pending: false,
        };

        const existingIndex = payload.localId
          ? prev.findIndex((message) => message.localId && message.localId === payload.localId)
          : -1;

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...normalised, pending: false };
          return updated;
        }

        return [...prev, normalised];
      });
    });

    socket.on('error', (socketError: Error) => {
      console.error('Socket error', socketError);
      toast.error(socketError.message || 'Messaging error occurred.');
    });

    return () => {
      socket.disconnect();
    };
  }, [params.chatId, user]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!socketRef.current || !input.trim() || !user) {
      return;
    }

    const trimmed = input.trim();
    const localId = `local-${Date.now()}`;

    const optimisticMessage: ChatMessage = {
      id: localId,
      chatId: params.chatId,
      senderId: user.id,
      text: trimmed,
      status: 'sending',
      createdAt: new Date().toISOString(),
      localId,
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    socketRef.current.emit('message:send', {
      chatId: params.chatId,
      localId,
      type: 'text',
      text: trimmed,
    });

    setInput('');
  };

  const formatTime = (isoDate: string) =>
    new Date(isoDate).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  const otherParticipant =
    user && participants.length > 0 ? participants.find((participant) => participant !== user.id) : undefined;

  if (!user && !authLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Messaging</h1>
        <p className="text-muted-foreground mb-4">You need to be logged in to access chat.</p>
        <Button onClick={() => router.push(`/auth/login?redirect=/chat/${params.chatId}`)}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] max-w-5xl mx-auto px-6 py-8">
      <div className="flex flex-1 flex-col border rounded-2xl shadow-sm bg-card">
        <header className="border-b px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {otherParticipant ? `Conversation with ${otherParticipant}` : 'Conversation'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Status: <span className="capitalize">{connectionState}</span>
                {participants.length > 0 ? ` • ${participants.length} participant${participants.length > 1 ? 's' : ''}` : ''}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">Chat ID: {params.chatId}</span>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-6 py-5 space-y-4 bg-background">
            {isFetchingMessages ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading messages…</p>
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = user && message.senderId === user.id;
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow ${
                        isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      } ${message.pending ? 'opacity-70' : ''}`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.text || '[unsupported message]'}</p>
                      <div
                        className={`mt-1 text-[10px] uppercase tracking-wide ${
                          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {formatTime(message.createdAt)}
                        {isOwn && (
                          <span className="ml-2">
                            {message.pending ? 'Sending…' : message.status === 'sent' ? 'Sent' : message.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <footer className="border-t px-6 py-4">
          <form onSubmit={handleSubmit} className="flex w-full gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your message…"
              rows={1}
              className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              disabled={connectionState !== 'connected' || isFetchingMessages}
            />
            <Button
              type="submit"
              disabled={connectionState !== 'connected' || !input.trim() || isFetchingMessages}
            >
              Send
            </Button>
          </form>
          {connectionState !== 'connected' && (
            <p className="mt-2 text-xs text-muted-foreground">
              Waiting for connection… messages will send when reconnected.
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
