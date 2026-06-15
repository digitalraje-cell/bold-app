import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              B
            </div>
            <span className="text-xl font-semibold tracking-tight">Bold</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Browser-based · No install required
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Professional meetings,
            <span className="block text-primary">right in your browser</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Host HD video calls, stream to your YouTube channel, and collaborate
            with chat, reactions, and real-time controls — all without downloading
            an app.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="w-full rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90 sm:w-auto"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-border bg-surface px-8 py-3.5 text-base font-semibold transition hover:bg-muted sm:w-auto"
            >
              Join a meeting
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-24 grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            {
              title: 'HD Video & Audio',
              description: 'Crystal-clear meetings powered by Jitsi Meet — camera, mic, and screen sharing built in.',
            },
            {
              title: 'YouTube Streaming',
              description: 'Stream and record directly to your own YouTube channel. Your content, your account.',
            },
            {
              title: 'Host Controls',
              description: 'Waiting rooms, co-hosts, mute controls, raise hand, reactions, and feature toggles.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-surface p-6 text-left"
            >
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Bold. All rights reserved.
      </footer>
    </div>
  );
}
