'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import {
  compressMeetingPoster,
  formatPosterBytes,
  type CompressedMeetingPoster,
} from '@/lib/meeting-poster-image';

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg';

type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'uploaded' | 'error';

type MeetingPosterUploadProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
  className?: string;
};

export function MeetingPosterUpload({
  value,
  onChange,
  onUploadingChange,
  className,
}: MeetingPosterUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [sizeInfo, setSizeInfo] = useState<{
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  useEffect(() => {
    onUploadingChange?.(status === 'compressing' || status === 'uploading');
  }, [onUploadingChange, status]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  function clearLocalPreview() {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
  }

  function handleRemove() {
    clearLocalPreview();
    setError(null);
    setStatus('idle');
    setSizeInfo(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  async function handleFile(file: File | null) {
    setError(null);
    setSizeInfo(null);
    clearLocalPreview();

    if (!file) return;

    setStatus('compressing');

    let compressed: CompressedMeetingPoster;
    try {
      compressed = await compressMeetingPoster(file);
    } catch (compressError) {
      setStatus('error');
      setError(
        compressError instanceof Error
          ? compressError.message
          : 'Could not process image',
      );
      onChange(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      return;
    }

    setLocalPreviewUrl(compressed.previewUrl);
    setSizeInfo({
      originalSize: compressed.originalSize,
      compressedSize: compressed.compressedSize,
    });
    setStatus('uploading');

    try {
      const result = await api.meetings.uploadPoster(
        compressed.blob,
        compressed.filename,
      );
      clearLocalPreview();
      onChange(result.posterUrl);
      setStatus('uploaded');
      setError(null);
    } catch (uploadError) {
      clearLocalPreview();
      setStatus('error');
      onChange(null);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Poster upload failed',
      );
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  const previewSrc = value ?? localPreviewUrl;
  const isBusy = status === 'compressing' || status === 'uploading';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Meeting poster (optional)</p>
          <p className="text-xs text-muted-foreground">
            Shown on the invitation page. JPG, JPEG, PNG, or WebP · maximum upload size: 5MB
          </p>
        </div>
        {value ? (
          <Button type="button" variant="secondary" size="sm" onClick={handleRemove} disabled={isBusy}>
            <X className="h-4 w-4" />
            Remove
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
          >
            <ImagePlus className="h-4 w-4" />
            {isBusy ? 'Uploading…' : 'Upload'}
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={isBusy}
        onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
      />

      {previewSrc ? (
        <div className="overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewSrc} alt="Meeting poster preview" className="aspect-[21/9] w-full object-cover" />
        </div>
      ) : null}

      {sizeInfo ? (
        <p className="text-xs text-muted-foreground">
          Original {formatPosterBytes(sizeInfo.originalSize)} · compressed{' '}
          {formatPosterBytes(sizeInfo.compressedSize)}
          {status === 'uploading' ? ' · uploading…' : null}
          {status === 'uploaded' ? ' · uploaded' : null}
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
