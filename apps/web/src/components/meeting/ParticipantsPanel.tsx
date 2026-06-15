'use client';

import { X, Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface ParticipantsPanelProps {
  meetingId: string;
  isHost: boolean;
  onClose: () => void;
}

export function ParticipantsPanel({ isHost, onClose }: ParticipantsPanelProps) {
  const participants = [
    { id: '1', name: 'You', role: isHost ? 'HOST' : 'PARTICIPANT', isMuted: false, isVideoOff: false },
  ];

  return (
    <div className="absolute right-0 top-0 z-40 flex h-full w-80 flex-col border-l border-white/10 bg-slate-900/95 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="font-semibold text-white">
          Participants ({participants.length})
        </h3>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
              {p.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-white">{p.name}</span>
                {p.role === 'HOST' && (
                  <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                    Host
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-white/40">
              {p.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {p.isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
