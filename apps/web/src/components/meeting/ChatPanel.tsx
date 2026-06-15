'use client';

import { X, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ChatMode } from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { useSocket } from '@/hooks/useSocket';

const CHAT_MODE_LABELS: Record<string, string> = {
  EVERYONE: 'Everyone',
  HOST_ONLY: 'Host only',
  HOST_PANELISTS: 'Host + Panelists',
  DISABLED: 'Disabled',
};

interface ChatPanelProps {
  meetingId: string;
  chatMode: ChatMode;
  chatEnabled: boolean;
  canSend: boolean;
  isHost: boolean;
  onClose: () => void;
  onSend: (content: string) => void;
  onChatModeChange?: (mode: ChatMode) => void;
}

export function ChatPanel({
  meetingId,
  chatMode,
  chatEnabled,
  canSend,
  isHost,
  onClose,
  onSend,
  onChatModeChange,
}: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<
    { senderName: string; content: string; createdAt: string }[]
  >([]);
  const { on } = useSocket(meetingId);

  useEffect(() => {
    const unsub = on('chat:message', (data: unknown) => {
      const msg = data as { senderName: string; content: string; createdAt: string };
      setMessages((prev) => [...prev, msg]);
    });
    return () => unsub?.();
  }, [meetingId, on]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !canSend) return;

    const msg = {
      senderName: 'You',
      content: message.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    onSend(message.trim());
    setMessage('');
  }

  return (
    <div className="absolute right-0 top-0 z-40 flex h-full w-80 flex-col border-l border-white/10 bg-slate-900/95 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h3 className="font-semibold text-white">Chat</h3>
          <p className="text-xs text-white/40">
            {chatEnabled ? CHAT_MODE_LABELS[chatMode] : 'Disabled'}
          </p>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {isHost && onChatModeChange && (
        <div className="border-b border-white/10 px-3 py-2">
          <select
            value={chatMode}
            onChange={(e) => onChatModeChange(e.target.value as ChatMode)}
            className="w-full rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white focus:outline-none"
          >
            {Object.entries(CHAT_MODE_LABELS).map(([value, label]) => (
              <option key={value} value={value} className="bg-slate-900">
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!chatEnabled && (
          <p className="text-center text-sm text-white/40">Chat is disabled by the host</p>
        )}
        {chatEnabled && messages.length === 0 && (
          <p className="text-center text-sm text-white/40">No messages yet</p>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-white/80">{msg.senderName}</span>
              <span className="text-xs text-white/30">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-white/90">{msg.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="border-t border-white/10 p-3">
        {!canSend && chatEnabled && (
          <p className="mb-2 text-xs text-amber-400/80">
            Chat is restricted to {CHAT_MODE_LABELS[chatMode]?.toLowerCase()}
          </p>
        )}
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={canSend ? 'Type a message...' : 'Chat unavailable'}
            disabled={!canSend || !chatEnabled}
            className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
          <Button type="submit" size="sm" className="shrink-0" disabled={!canSend || !chatEnabled}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
