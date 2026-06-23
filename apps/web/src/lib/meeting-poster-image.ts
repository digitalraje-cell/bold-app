export const MAX_POSTER_INPUT_BYTES = 5 * 1024 * 1024;
export const POSTER_MAX_LONG_EDGE = 1600;
const TARGET_MAX_BYTES = 500 * 1024;

const ALLOWED_INPUT_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export type CompressedMeetingPoster = {
  blob: Blob;
  mimeType: string;
  filename: string;
  originalSize: number;
  compressedSize: number;
  previewUrl: string;
};

export function formatPosterBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image'));
    };
    image.src = objectUrl;
  });
}

function scaledDimensions(
  width: number,
  height: number,
  maxLongEdge: number,
): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxLongEdge) {
    return { width, height };
  }
  const scale = maxLongEdge / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not compress image'));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function normalizeInputMimeType(file: File): string {
  if (file.type === 'image/jpg') return 'image/jpeg';
  return file.type;
}

function isAllowedPosterFile(file: File): boolean {
  const mime = normalizeInputMimeType(file);
  if (ALLOWED_INPUT_TYPES.has(mime)) return true;
  const lowerName = file.name.toLowerCase();
  return (
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.webp')
  );
}

export async function compressMeetingPoster(
  file: File,
): Promise<CompressedMeetingPoster> {
  if (!isAllowedPosterFile(file)) {
    throw new Error('Choose a JPG, JPEG, PNG, or WebP image');
  }

  if (file.size > MAX_POSTER_INPUT_BYTES) {
    throw new Error('Maximum upload size is 5MB');
  }

  const image = await loadImage(file);
  const { width, height } = scaledDimensions(
    image.naturalWidth,
    image.naturalHeight,
    POSTER_MAX_LONG_EDGE,
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not process image');
  }
  context.drawImage(image, 0, 0, width, height);

  const qualities = [0.85, 0.75, 0.65, 0.55, 0.45];
  const webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');

  let bestBlob: Blob | null = null;
  let bestMime = 'image/jpeg';

  if (webpSupported) {
    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, 'image/webp', quality);
      bestBlob = blob;
      bestMime = 'image/webp';
      if (blob.size <= TARGET_MAX_BYTES) break;
    }
  }

  if (!bestBlob || bestBlob.size > TARGET_MAX_BYTES) {
    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
        bestMime = 'image/jpeg';
      }
      if (blob.size <= TARGET_MAX_BYTES) {
        bestBlob = blob;
        bestMime = 'image/jpeg';
        break;
      }
    }
  }

  if (!bestBlob) {
    throw new Error('Could not compress image');
  }

  if (bestBlob.size > MAX_POSTER_INPUT_BYTES) {
    throw new Error('Image is still too large after compression. Try a smaller image.');
  }

  const extension = bestMime === 'image/webp' ? 'webp' : 'jpg';

  return {
    blob: bestBlob,
    mimeType: bestMime,
    filename: `meeting-poster.${extension}`,
    originalSize: file.size,
    compressedSize: bestBlob.size,
    previewUrl: URL.createObjectURL(bestBlob),
  };
}
