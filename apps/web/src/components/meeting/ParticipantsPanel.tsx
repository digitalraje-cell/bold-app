'use client';

import { X, Mic, MicOff, Video, VideoOff, UserPlus, Presentation } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RoomMode } from '@boldmeet/shared';
import { api } from '@/lib/api';
import { useRoomStore, RoomParticipant } from '@/stores/roomStore';

interface ParticipantsPanelProps {
  meetingId: string;
  isHost: boolean;
  roomMode: RoomMode;
  onClose: () => void;
  onPromotePanelist?: (participantId: string) => void;
  onBringOnStage?: (participantId: string) => void;
  onRemoveFromStage?: (participantId: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  HOST: 'Host',
  CO_HOST: 'Co-host',
  PANELIST: 'Panelist',
  PARTICIPANT: 'Participant',
  MODERATOR: 'Moderator',
};

export function ParticipantsPanel({
  meetingId,
  isHost,
  roomMode,
  onClose,
  onPromotePanelist,
  onBringOnStage,
  onRemoveFromStage,
}: ParticipantsPanelProps) {
  const storeParticipants = useRoomStore((s) => s.participants);
  const [participants, setParticipants] = useState<RoomParticipant[]>(storeParticipants);

  useEffect(() => {
    if (storeParticipants.length > 0) {
      setParticipants(storeParticipants);
      return;
    }

    api.participants.list(meetingId).then((list) => {
      setParticipants(list as RoomParticipant[]);
    });
  }, [meetingId, storeParticipants]);

  const admitted = participants.filter((p) => p.role !== undefined);

  return (
    <div className="absolute right-0 top-0 z-40 flex h-full w-80 flex-col border-l border-white/10 bg-slate-900/95 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="font-semibold text-white">
          Participants ({admitted.length})
        </h3>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {admitted.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
              {p.displayName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium text-white">{p.displayName}</span>
                {p.role !== 'PARTICIPANT' && (
                  <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                    {ROLE_LABELS[p.role] ?? p.role}
                  </span>
                )}
                {roomMode === RoomMode.WEBINAR && p.isOnStage && p.role === 'PARTICIPANT' && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
                    On stage
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-white/40">
              {p.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {p.isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </div>
            {isHost && p.role === 'PARTICIPANT' && (
              <div className="flex flex-col gap-1">
                {onPromotePanelist && (
                  <button
                    type="button"
                    title="Promote to panelist"
                    onClick={() => onPromotePanelist(p.id)}
                    className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                )}
                {roomMode === RoomMode.WEBINAR && onBringOnStage && !p.isOnStage && (
                  <button
                    type="button"
                    title="Bring on stage"
                    onClick={() => onBringOnStage(p.id)}
                    className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
                  >
                    <Presentation className="h-4 w-4" />
                  </button>
                )}
                {roomMode === RoomMode.WEBINAR && onRemoveFromStage && p.isOnStage && (
                  <button
                    type="button"
                    title="Remove from stage"
                    onClick={() => onRemoveFromStage(p.id)}
                    className="rounded px-1 text-[10px] text-white/50 hover:bg-white/10 hover:text-white"
                  >
                    Off
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
