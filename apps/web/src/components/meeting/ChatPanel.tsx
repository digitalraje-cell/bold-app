'use client';

import { X, Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ChatMode } from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { useSocket } from '@/hooks/useSocket';
import { useMediaQuery, MOBILE_MEETING_MEDIA_QUERY } from '@/hooks/useMediaQuery';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset';
import { cn } from '@/lib/utils';

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
  controlsHeight: number;
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
  controlsHeight,
  onClose,
  onSend,
  onChatModeChange,
}: ChatPanelProps) {
  const isMobile = useMediaQuery(MOBILE_MEETING_MEDIA_QUERY);
  const keyboardInset = useVisualViewportInset(isMobile);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<
    { senderName: string; content: string; createdAt: string }[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { on } = useSocket(meetingId);

  const bottomOffset = Math.max(controlsHeight, 72) + keyboardInset;

  useEffect(() => {
    const unsub = on('chat:message', (data: unknown) => {
      const msg = data as { senderName: string; content: string; createdAt: string };
      setMessages((prev) => [...prev, msg]);
    });
    return () => unsub?.();
  }, [meetingId, on]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    if (!isMobile) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [isMobile]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !canSend) return;

    onSend(message.trim());
    setMessage('');
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }

  return (
    <div
      className={cn(
        'z-40 flex flex-col border-white/10 bg-slate-900/98 backdrop-blur',
        isMobile
          ? 'fixed inset-x-0 top-0 meeting-panel-slide-up border-t'
          : 'absolute right-0 top-0 z-40 h-full w-80 border-l',
      )}
      style={
        isMobile
          ? {
              bottom: `${bottomOffset}px`,
              paddingTop: 'env(safe-area-inset-top)',
            }
          : undefined
      }
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h3 className="font-semibold text-white">Chat</h3>
          <p className="text-xs text-white/40">
            {chatEnabled ? CHAT_MODE_LABELS[chatMode] : 'Disabled'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {isHost && onChatModeChange && (
        <div className="shrink-0 border-b border-white/10 px-3 py-2">
          <select
            value={chatMode}
            onChange={(e) => onChatModeChange(e.target.value as ChatMode)}
            className="w-full rounded-lg bg-white/10 px-2 py-2 text-xs text-white focus:outline-none"
          >
            {Object.entries(CHAT_MODE_LABELS).map(([value, label]) => (
              <option key={value} value={value} className="bg-slate-900">
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        <div className="space-y-3">
          {!chatEnabled && (
            <p className="text-center text-sm text-white/40">Chat is disabled by the host</p>
          )}
          {chatEnabled && messages.length === 0 && (
            <p className="text-center text-sm text-white/40">No messages yet</p>
          )}
          {messages.map((msg, i) => (
            <div key={`${msg.createdAt}-${i}`}>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-white/80">{msg.senderName}</span>
                <span className="text-xs text-white/30">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="mt-0.5 break-words text-sm text-white/90">{msg.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} aria-hidden />
        </div>
      </div>

      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-white/10 bg-slate-900/98 p-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        {!canSend && chatEnabled && (
          <p className="mb-2 text-xs text-amber-400/80">
            Chat is restricted to {CHAT_MODE_LABELS[chatMode]?.toLowerCase()}
          </p>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={canSend ? 'Type a message...' : 'Chat unavailable'}
            disabled={!canSend || !chatEnabled}
            enterKeyHint="send"
            autoComplete="off"
            className="min-h-11 flex-1 rounded-lg bg-white/10 px-3 py-2.5 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 sm:text-sm"
          />
          <Button
            type="submit"
            size="sm"
            className="h-11 w-11 shrink-0 p-0"
            disabled={!canSend || !chatEnabled || !message.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
