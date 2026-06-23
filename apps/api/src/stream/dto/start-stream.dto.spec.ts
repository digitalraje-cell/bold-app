import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  MeetingBroadcastProviderType,
  toStartYouTubeLiveApiBody,
} from '@boldmeet/shared';
import { StartStreamDto } from './start-stream.dto';

async function validateStartStreamBody(body: Record<string, unknown>) {
  const dto = plainToInstance(StartStreamDto, body);
  return validate(dto, { whitelist: true, forbidNonWhitelisted: true });
}

describe('StartStreamDto', () => {
  const validYoutubeBody = {
    provider: MeetingBroadcastProviderType.YOUTUBE_RTMP,
    youtubeAccountIds: ['acc_123'],
    visibility: 'unlisted',
  };

  it('accepts a valid YouTube OAuth start payload', async () => {
    const errors = await validateStartStreamBody(validYoutubeBody);
    expect(errors).toHaveLength(0);
  });

  it('rejects captureMode (client-only field)', async () => {
    const errors = await validateStartStreamBody({
      ...validYoutubeBody,
      captureMode: 'camera',
    });

    expect(errors.length).toBeGreaterThan(0);
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );
    expect(messages.some((message) => message.includes('captureMode'))).toBe(
      true,
    );
  });

  it('rejects other unknown client fields', async () => {
    const errors = await validateStartStreamBody({
      ...validYoutubeBody,
      displaySurface: 'monitor',
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('toStartYouTubeLiveApiBody', () => {
  it('strips captureMode before API validation', async () => {
    const apiBody = toStartYouTubeLiveApiBody({
      provider: MeetingBroadcastProviderType.YOUTUBE_RTMP,
      youtubeAccountIds: ['acc_123'],
      visibility: 'unlisted',
      captureMode: 'tab',
    });

    expect(apiBody).toEqual({
      provider: MeetingBroadcastProviderType.YOUTUBE_RTMP,
      youtubeAccountIds: ['acc_123'],
      visibility: 'unlisted',
    });
    expect('captureMode' in apiBody).toBe(false);

    const errors = await validateStartStreamBody(
      apiBody as Record<string, unknown>,
    );
    expect(errors).toHaveLength(0);
  });

  it('strips legacy captureMode if present on older clients', () => {
    const apiBody = toStartYouTubeLiveApiBody({
      provider: MeetingBroadcastProviderType.YOUTUBE_RTMP,
      youtubeAccountIds: ['acc_123'],
      captureMode: 'camera',
    });
    expect(apiBody).not.toHaveProperty('captureMode');
  });
});
