'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const MAX_BYTES = 400_000;
const ACCEPT = 'image/jpeg,image/png,image/webp';

type MeetingPosterUploadProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
};

export function MeetingPosterUpload({ value, onChange, className }: MeetingPosterUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    setError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Choose a JPEG, PNG, or WebP image');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be under 400KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      onChange(result);
    };
    reader.onerror = () => setError('Could not read image');
    reader.readAsDataURL(file);
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Meeting poster (optional)</p>
          <p className="text-xs text-muted-foreground">
            Shown on the invitation page. JPEG, PNG, or WebP · max 400KB
          </p>
        </div>
        {value ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => onChange(null)}>
            <X className="h-4 w-4" />
            Remove
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            <ImagePlus className="h-4 w-4" />
            Upload
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
      />

      {value ? (
        <div className="overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Meeting poster preview" className="aspect-[21/9] w-full object-cover" />
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
