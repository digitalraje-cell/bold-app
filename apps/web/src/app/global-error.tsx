'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1.5rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#faf8f5',
          color: '#111111',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Something went wrong</h2>
        <p style={{ margin: 0, maxWidth: '28rem', textAlign: 'center', color: '#6b7280' }}>
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            border: 'none',
            borderRadius: '9999px',
            padding: '0.625rem 1.25rem',
            background: '#111111',
            color: '#ffffff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
