import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { MeetingBroadcastProviderType } from '@boldmeet/shared';

export class StartStreamDto {
  @IsEnum(MeetingBroadcastProviderType)
  provider!: MeetingBroadcastProviderType;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  rtmpUrl?: string;

  @IsString()
  @MinLength(4)
  streamKey!: string;

  @IsOptional()
  @IsString()
  watchUrl?: string;
}
