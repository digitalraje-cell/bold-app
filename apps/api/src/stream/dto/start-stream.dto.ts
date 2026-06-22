import {
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  MeetingBroadcastProviderType,
  type YouTubePrivacyStatus,
} from '@boldmeet/shared';

export class StartStreamDto {
  @IsEnum(MeetingBroadcastProviderType)
  provider!: MeetingBroadcastProviderType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  rtmpUrl?: string;

  /** Legacy manual RTMP — omitted when using YouTube OAuth API flow */
  @ValidateIf((dto: StartStreamDto) => Boolean(dto.streamKey))
  @IsString()
  @MinLength(4)
  streamKey?: string;

  @IsOptional()
  @IsString()
  watchUrl?: string;

  @IsOptional()
  @IsIn(['public', 'unlisted', 'private'])
  visibility?: YouTubePrivacyStatus;

  /** @deprecated use youtubeAccountIds */
  @IsOptional()
  @IsString()
  @MinLength(1)
  youtubeAccountId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  youtubeAccountIds?: string[];
}
