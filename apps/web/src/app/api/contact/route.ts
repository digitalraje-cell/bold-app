import { NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/email';
import { LEGAL_CONFIG } from '@/lib/legal-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message is too long' }, { status: 400 });
    }

    await sendContactEmail({ name, email, subject, message });

    return NextResponse.json({
      message: `Your message was sent to ${LEGAL_CONFIG.supportEmail}.`,
    });
  } catch (error) {
    console.error('[contact-api] failed', error);
    return NextResponse.json(
      { error: 'Unable to send message right now. Please email us directly.' },
      { status: 500 },
    );
  }
}
