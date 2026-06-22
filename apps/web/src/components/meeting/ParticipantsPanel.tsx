'use client';

import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Check,
  MoreHorizontal,
  Hand,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { RoomMode } from '@boldmeet/shared';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { useRoomStore, RoomParticipant } from '@/stores/roomStore';

type ParticipantRecord = RoomParticipant & { status?: string };

interface ParticipantsPanelProps {
  meetingId: string;
  isModerator: boolean;
  isHost: boolean;
  roomMode: RoomMode;
  waitingRoomEnabled?: boolean;
  onClose: () => void;
  onPromotePanelist?: (participantId: string) => void;
  onBringOnStage?: (participantId: string) => void;
  onRemoveFromStage?: (participantId: string) => void;
  onMuteAll?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  HOST: 'Host',
  CO_HOST: 'Co-host',
  PANELIST: 'Panelist',
  PARTICIPANT: 'Participant',
  MODERATOR: 'Moderator',
  GUEST: 'Guest',
};

export function ParticipantsPanel({
  meetingId,
  isModerator,
  isHost,
  roomMode,
  waitingRoomEnabled,
  onClose,
  onPromotePanelist,
  onBringOnStage,
  onRemoveFromStage,
  onMuteAll,
}: ParticipantsPanelProps) {
  const { can } = usePermissions();
  const storeParticipants = useRoomStore((s) => s.participants);
  const [participants, setParticipants] = useState<ParticipantRecord[]>(storeParticipants);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const refresh = useCallback(async () => {
    const list = (await api.participants.list(meetingId)) as ParticipantRecord[];
    setParticipants(list);
  }, [meetingId]);

  useEffect(() => {
    if (storeParticipants.length > 0) {
      setParticipants((prev) => {
        const storeById = new Map(storeParticipants.map((p) => [p.id, p]));
        return prev.map((p) => {
          const live = storeById.get(p.id);
          if (!live) return p;
          return {
            ...p,
            handRaised: live.handRaised ?? p.handRaised,
            isMuted: live.isMuted ?? p.isMuted,
            isVideoOff: live.isVideoOff ?? p.isVideoOff,
          };
        });
      });
    }
    void refresh();
  }, [meetingId, storeParticipants, refresh]);

  const admitted = participants.filter((p) => p.status !== 'WAITING' && p.status !== 'REMOVED');
  const waiting = participants.filter((p) => p.status === 'WAITING');

  const runAction = async (participantId: string, action: () => Promise<unknown>) => {
    setLoadingId(participantId);
    try {
      await action();
      await refresh();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col meeting-panel-mobile bg-black/40 sm:absolute sm:inset-y-3 sm:right-3 sm:left-auto sm:bottom-[calc(var(--meeting-controls-offset,5.5rem)+env(safe-area-inset-bottom,0px))] sm:top-3 sm:z-40 sm:h-auto sm:w-full sm:max-w-sm sm:bg-transparent">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden meeting-glass-panel rounded-none sm:rounded-[var(--radius-meeting)]">
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        feature="Multiple co-hosts"
      />
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="font-semibold text-white">
          Participants ({admitted.length})
        </h3>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {isModerator && onMuteAll && (
        <div className="border-b border-white/10 px-4 py-2">
          <button
            type="button"
            onClick={onMuteAll}
            className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
          >
            Mute all
          </button>
        </div>
      )}

      {isModerator && waitingRoomEnabled && waiting.length > 0 && (
        <div className="border-b border-white/10 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/50">
            Waiting room ({waiting.length})
          </p>
          <div className="space-y-2">
            {waiting.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-2">
                <span className="truncate text-sm text-white">{p.displayName}</span>
                <button
                  type="button"
                  disabled={loadingId === p.id}
                  title="Admit"
                  onClick={() =>
                    runAction(p.id, () => api.participants.admitWaiting(meetingId, p.id))
                  }
                  className="rounded bg-white/10 p-1.5 text-white hover:bg-white/20 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {admitted.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white">
              {p.displayName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium text-white">{p.displayName}</span>
                {p.role !== 'PARTICIPANT' && (
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/80">
                    {ROLE_LABELS[p.role] ?? p.role}
                  </span>
                )}
                {!p.userId && p.role === 'PARTICIPANT' && (
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/60">
                    Guest
                  </span>
                )}
                {roomMode === RoomMode.WEBINAR && p.isOnStage && p.role === 'PARTICIPANT' && (
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/70">
                    On stage
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {p.handRaised && (
                <Hand className="h-4 w-4 text-amber-400" aria-label="Hand raised" />
              )}
              {p.isMuted ? (
                <MicOff className="h-4 w-4 text-red-400" aria-label="Microphone off" />
              ) : (
                <Mic className="h-4 w-4 text-emerald-400" aria-label="Microphone on" />
              )}
              {p.isVideoOff ? (
                <VideoOff className="h-4 w-4 text-red-400" aria-label="Camera off" />
              ) : (
                <Video className="h-4 w-4 text-emerald-400" aria-label="Camera on" />
              )}
            </div>
            {isModerator && p.role !== 'HOST' && (isHost || p.role === 'PARTICIPANT') && (
              <div className="relative">
                <button
                  type="button"
                  title="Participant actions"
                  disabled={loadingId === p.id}
                  onClick={() => setOpenMenuId((current) => (current === p.id ? null : p.id))}
                  className="rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {openMenuId === p.id && (
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] overflow-hidden rounded-[var(--radius-md)] meeting-glass-panel py-1 shadow-[var(--shadow-float)]">
                    <button
                      type="button"
                      className="flex w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                      onClick={() => {
                        setOpenMenuId(null);
                        void runAction(p.id, () =>
                          api.participants.mute(meetingId, p.id, !p.isMuted),
                        );
                      }}
                    >
                      {p.isMuted ? 'Ask to unmute' : 'Mute'}
                    </button>
                    {isHost && p.role === 'PARTICIPANT' && (
                      <button
                        type="button"
                        className="flex w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                        onClick={() => {
                          setOpenMenuId(null);
                          if (!can('canUseCohost')) {
                            setUpgradeOpen(true);
                            return;
                          }
                          void runAction(p.id, () => api.participants.makeCoHost(meetingId, p.id));
                        }}
                      >
                        Make co-host
                      </button>
                    )}
                    {isHost && p.role === 'CO_HOST' && (
                      <button
                        type="button"
                        className="flex w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                        onClick={() => {
                          setOpenMenuId(null);
                          void runAction(p.id, () =>
                            api.participants.removeCoHost(meetingId, p.id),
                          );
                        }}
                      >
                        Remove co-host
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                      onClick={() => {
                        setOpenMenuId(null);
                        void runAction(p.id, () => api.participants.remove(meetingId, p.id));
                      }}
                    >
                      Remove from meeting
                    </button>
                    {onPromotePanelist && p.role === 'PARTICIPANT' && (
                      <button
                        type="button"
                        className="flex w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                        onClick={() => {
                          setOpenMenuId(null);
                          onPromotePanelist(p.id);
                        }}
                      >
                        Promote to panelist
                      </button>
                    )}
                    {roomMode === RoomMode.WEBINAR && onBringOnStage && !p.isOnStage && (
                      <button
                        type="button"
                        className="flex w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                        onClick={() => {
                          setOpenMenuId(null);
                          onBringOnStage(p.id);
                        }}
                      >
                        Bring on stage
                      </button>
                    )}
                    {roomMode === RoomMode.WEBINAR && onRemoveFromStage && p.isOnStage && (
                      <button
                        type="button"
                        className="flex w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                        onClick={() => {
                          setOpenMenuId(null);
                          onRemoveFromStage(p.id);
                        }}
                      >
                        Remove from stage
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
