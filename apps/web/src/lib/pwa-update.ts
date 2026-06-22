export function isInMeetingPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith('/meeting/') || pathname.startsWith('/join/');
}

export async function activateWaitingServiceWorker(
  registration: ServiceWorkerRegistration,
): Promise<void> {
  const waiting = registration.waiting;
  if (!waiting) return;

  await new Promise<void>((resolve) => {
    const onControllerChange = () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      resolve();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    waiting.postMessage({ type: 'SKIP_WAITING' });
  });

  window.location.reload();
}

export function getServiceWorkerUrl(buildId: string): string {
  return `/sw.js?build=${encodeURIComponent(buildId)}`;
}
