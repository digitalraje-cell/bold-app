import Image from 'next/image';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';

type BoldLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

/** Official Bold logo mark (square). */
export function BoldLogo({ size = 36, className, priority }: BoldLogoProps) {
  return (
    <Image
      src={BRAND.logo}
      alt={BRAND.logoAlt}
      width={size}
      height={size}
      priority={priority}
      className={cn('shrink-0 rounded-[22%]', className)}
    />
  );
}
