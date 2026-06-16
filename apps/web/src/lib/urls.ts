import {
  APP_CONFIG,
  formatMeetingInvite,
  getEmailInviteUrl,
  getWhatsAppInviteUrl,
  formatMeetingCode,
  normalizeMeetingCode,
} from '@boldmeet/shared';
import { getAppOrigin } from './app-origin';

export {
  APP_CONFIG,
  formatMeetingInvite,
  formatMeetingCode,
  normalizeMeetingCode,
  getEmailInviteUrl,
  getWhatsAppInviteUrl,
};
export { getAppOrigin, getClientAppOrigin, getServerAppOrigin } from './app-origin';

export function getMeetingUrl(meetingId: string): string {
  return `${getAppOrigin()}/meeting/${meetingId}`;
}

export function getMeetingRoomUrl(meetingId: string): string {
  return `${getAppOrigin()}/meeting/${meetingId}/room`;
}

export function getMeetingInviteUrl(meetingId: string): string {
  return `${getAppOrigin()}/join/${meetingId}`;
}
