import type { MeetingMediaProvider } from '@boldmeet/shared';
import { jitsiMediaProvider } from './jitsi-provider';

const providerName = (process.env.NEXT_PUBLIC_MEDIA_PROVIDER || 'jitsi') as 'jitsi';

const providers: Record<string, MeetingMediaProvider> = {
  jitsi: jitsiMediaProvider,
};

export function getMeetingMediaProvider(): MeetingMediaProvider {
  return providers[providerName] ?? jitsiMediaProvider;
}

export { getJitsiDomain } from './jitsi-provider';
