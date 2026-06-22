'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const TOPICS = [
  'General support',
  'Billing & Pro subscription',
  'Sales inquiry',
  'Partnership',
  'Technical issue',
  'Other',
] as const;

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject: topic, message }),
      });
      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setStatus('error');
        setErrorMessage(data.error || 'Could not send message. Please email us directly.');
        return;
      }

      setStatus('success');
      setName('');
      setEmail('');
      setTopic(TOPICS[0]);
      setMessage('');
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Your full name"
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="you@company.com"
      />
      <div className="space-y-2.5">
        <label htmlFor="contact-topic" className="block text-sm font-medium text-foreground">
          Topic
        </label>
        <select
          id="contact-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className={cn(
            'w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm',
            'focus:border-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/8',
          )}
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2.5">
        <label htmlFor="contact-message" className="block text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={6}
          placeholder="How can we help?"
          className={cn(
            'w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm',
            'placeholder:text-muted-foreground/70',
            'focus:border-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/8',
          )}
        />
      </div>

      {status === 'success' && (
        <p className="rounded-[var(--radius-md)] border border-border bg-[var(--badge-bg)] px-4 py-3 text-sm text-foreground">
          Thank you. We received your message and will respond within 48 business hours.
        </p>
      )}

      {status === 'error' && (
        <p className="rounded-[var(--radius-md)] border border-border bg-[var(--badge-bg)] px-4 py-3 text-sm text-foreground">
          {errorMessage}
        </p>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full sm:w-auto">
        Send message
      </Button>
    </form>
  );
}
