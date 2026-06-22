/** Build-time app version exposed to the client. */
export const appVersion =
  process.env.NEXT_PUBLIC_APP_VERSION?.trim() || '1.0.0';

/** ISO date string (YYYY-MM-DD) when this build was produced. */
export const buildTimestamp =
  process.env.NEXT_PUBLIC_BUILD_TIMESTAMP?.trim() ||
  new Date().toISOString().slice(0, 10);

/** Cache-bust service worker registration on each deploy. */
export const serviceWorkerBuildId =
  process.env.NEXT_PUBLIC_BUILD_ID?.trim() ||
  `${appVersion}-${buildTimestamp}`;
