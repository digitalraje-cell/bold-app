import { cn } from '@/lib/utils';

const GRADIENT_ID = 'bold-mark-gradient';

/** Inline Bold icon mark — Concept A: Bold Beacon */
export function BoldIconMark({
  size = 32,
  className,
  gradientId = GRADIENT_ID,
}: {
  size?: number;
  className?: string;
  gradientId?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gradientId})`} />
      <path
        fill="#fff"
        d="M12 10h9.8c3.6 0 5.7 1.8 5.7 4.6 0 1.9-1 3.3-2.8 4 2.1.6 3.5 2.3 3.5 4.8 0 3.4-2.6 5.6-6.8 5.6H12V10zm4 6.2h5.4c1.4 0 2.2-.8 2.2-1.9s-.8-1.9-2.2-1.9H16v3.8zm0 7.4h6c1.6 0 2.6-.9 2.6-2.3s-1-2.3-2.6-2.3H16v4.6z"
      />
      <circle cx="29" cy="29" r="3" fill="#93C5FD" />
      <circle cx="29" cy="29" r="1.5" fill="#2563EB" />
    </svg>
  );
}
