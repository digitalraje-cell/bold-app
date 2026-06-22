import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { PWA_ANALYTICS_EVENTS } from '@boldmeet/shared';

export class TrackPwaAnalyticsDto {
  @IsIn(PWA_ANALYTICS_EVENTS)
  event!: (typeof PWA_ANALYTICS_EVENTS)[number];

  @IsOptional()
  @IsString()
  meetingId?: string;

  @IsOptional()
  @IsString()
  meetingCode?: string;

  @IsOptional()
  @IsString()
  browser?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
