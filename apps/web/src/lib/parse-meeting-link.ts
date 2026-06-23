import { normalizeMeetingCode } from '@boldmeet/shared';

const MIN_CODE_LENGTH = 6;
const TYPICAL_CODE_LENGTH = 10;

function isValidMeetingCode(code: string): boolean {
  return /^\d+$/.test(code) && code.length >= MIN_CODE_LENGTH && code.length <= 12;
}

function tryNormalizeCode(raw: string): string | null {
  const code = normalizeMeetingCode(raw.trim());
  return isValidMeetingCode(code) ? code : null;
}

function extractFromUrl(trimmed: string): string | null {
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const match = url.pathname.match(/\/(?:meeting|join)\/([^/]+)/i);
      if (match?.[1]) return tryNormalizeCode(match[1]);
    } catch {
      return null;
    }
  }

  const pathMatch = trimmed.match(/\/(?:meeting|join)\/([^/\s?#]+)/i);
  if (pathMatch?.[1]) return tryNormalizeCode(pathMatch[1]);
  return null;
}

function extractLabeledCode(trimmed: string): string | null {
  const labeled = trimmed.match(
    /(?:meeting\s*(?:id|code)|join\s*(?:link|code|id)|code|id)\s*[:#]?\s*([\d\s-]+)/i,
  );
  if (labeled?.[1]) return tryNormalizeCode(labeled[1]);
  return null;
}

function extractEmbeddedDigitRuns(trimmed: string): string | null {
  const runs = trimmed.match(/\d(?:[\s-]*\d)+/g) ?? [];
  let best: string | null = null;

  for (const run of runs) {
    const code = tryNormalizeCode(run);
    if (!code) continue;
    if (code.length === TYPICAL_CODE_LENGTH) return code;
    if (!best || code.length > best.length) best = code;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= MIN_CODE_LENGTH) {
    if (digitsOnly.length === TYPICAL_CODE_LENGTH) return digitsOnly;
    const tenDigit = digitsOnly.match(/\d{10}/);
    if (tenDigit) return tenDigit[0];
  }

  return best;
}

/** Extract a meeting id/code from a link, path, label, or any text containing a valid code. */
export function parseMeetingLinkOrCode(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  return (
    extractFromUrl(trimmed) ??
    extractLabeledCode(trimmed) ??
    extractEmbeddedDigitRuns(trimmed) ??
    tryNormalizeCode(trimmed)
  );
}
