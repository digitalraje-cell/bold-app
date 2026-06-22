'use client';

export function YouTubeBetaBanner({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        'rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100'
      }
    >
      <p className="font-medium text-amber-50">YouTube Live is currently Beta.</p>
      <p className="mt-1 text-amber-100/90">
        For best results share the Bold meeting tab and enable Share Tab Audio.
      </p>
    </div>
  );
}
