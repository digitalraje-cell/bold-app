'use client';

import { X, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ChatPanelProps {
  meetingId: string;
  onClose: () => void;
  onSend: (content: string) => void;
}

export function ChatPanel({ onClose, onSend }: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<
    { senderName: string; content: string; createdAt: string }[]
  >([]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

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
        <h3 className="font-semibold text-white">Chat</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
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
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button type="submit" size="sm" className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
