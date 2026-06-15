'use client';

interface ReactionsOverlayProps {
  reactions: { id: string; reaction: string }[];
}

export function ReactionsOverlay({ reactions }: ReactionsOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {reactions.map((r, index) => (
        <span
          key={r.id}
          className="absolute animate-bounce text-4xl"
          style={{
            left: `${20 + (index * 15) % 60}%`,
            bottom: `${120 + (index * 10) % 40}px`,
            animationDuration: '1s',
            animationIterationCount: 3,
          }}
        >
          {r.reaction}
        </span>
      ))}
    </div>
  );
}
