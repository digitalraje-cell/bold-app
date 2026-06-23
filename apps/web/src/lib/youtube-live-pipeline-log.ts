/** Structured client-side logs for the post–Go Live ingest pipeline (grep: youtube-live-pipeline). */
export function logYouTubePipeline(
  stage: string,
  step: string,
  detail?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV !== 'development') return;
  const payload = detail ? ` ${JSON.stringify(detail)}` : '';
  console.log(`[youtube-live-pipeline] ${stage} ${step}${payload}`);
}

export function logYouTubePipelineError(
  stage: string,
  step: string,
  error: unknown,
  detail?: Record<string, unknown>,
): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[youtube-live-pipeline] ${stage} ${step}`, {
    ...detail,
    error: message,
  });
}
