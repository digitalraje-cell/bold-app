'use client';

import { useEffect, useState } from 'react';
import { Copy, Mail, MessageCircle, X } from 'lucide-react';
import {
  formatMeetingInvite,
  getEmailInviteUrl,
  getMeetingUrl,
  getWhatsAppInviteUrl,
} from '@/lib/urls';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface InviteModalProps {
  meetingId: string;
  open: boolean;
  onClose: () => void;
}

export function InviteModal({ meetingId, open, onClose }: InviteModalProps) {
  const [details, setDetails] = useState<{
    title: string;
    meetingCode: string;
    passcode?: string | null;
  } | null>(null);
  const [copied, setCopied] = useState<'invite' | 'link' | null>(null);

  useEffect(() => {
    if (!open) return;
    api.meetings
      .getInvite(meetingId)
      .then((data) => setDetails(data as typeof details))
      .catch(() => setDetails(null));
  }, [open, meetingId]);

  if (!open) return null;

  const meetingLink = getMeetingUrl(meetingId);
  const inviteText = details
    ? formatMeetingInvite({
        topic: details.title,
        meetingId,
        meetingCode: details.meetingCode,
        passcode: details.passcode,
        link: meetingLink,
      })
    : '';

  async function copyText(text: string, type: 'invite' | 'link') {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold">Invite to meeting</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Meeting Topic</p>
            <p className="mt-1 font-medium">{details?.title || 'Loading...'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Meeting Link</p>
            <p className="mt-1 break-all text-sm text-blue-300">{meetingLink}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">Meeting ID</p>
              <p className="mt-1 font-mono text-sm">{details?.meetingCode || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">Passcode</p>
              <p className="mt-1 font-mono text-sm">{details?.passcode || 'None'}</p>
            </div>
          </div>

          <pre className="max-h-40 overflow-auto rounded-xl bg-black/30 p-4 text-xs leading-relaxed text-white/80 whitespace-pre-wrap">
            {inviteText || 'Loading invite...'}
          </pre>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/20"
              onClick={() => copyText(inviteText, 'invite')}
            >
              <Copy className="h-4 w-4" />
              {copied === 'invite' ? 'Copied!' : 'Copy Invite'}
            </Button>
            <Button
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/20"
              onClick={() => copyText(meetingLink, 'link')}
            >
              <Copy className="h-4 w-4" />
              {copied === 'link' ? 'Copied!' : 'Copy Link'}
            </Button>
            <a
              href={
                details
                  ? getEmailInviteUrl({ topic: details.title, inviteText })
                  : '#'
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
            >
              <Mail className="h-4 w-4" />
              Email Invite
            </a>
            <a
              href={inviteText ? getWhatsAppInviteUrl(inviteText) : '#'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Invite
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
