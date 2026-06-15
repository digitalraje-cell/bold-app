import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChatMode } from '@prisma/client';

export class MeetingSettingsDto {
  @IsOptional()
  @IsBoolean()
  chatEnabled?: boolean;

  @IsOptional()
  @IsEnum(ChatMode)
  chatMode?: ChatMode;

  @IsOptional()
  @IsBoolean()
  reactionsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  raiseHandEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  screenShareEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  screenShareHostOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  waitingRoomEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  participantRenameEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  participantMicAccess?: boolean;

  @IsOptional()
  @IsBoolean()
  coHostPermissionsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  autoMuteParticipants?: boolean;
}

export class CreateMeetingDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MeetingSettingsDto)
  settings?: MeetingSettingsDto;
}

export class UpdateMeetingSettingsDto extends MeetingSettingsDto {}

export class JoinMeetingDto {
  @IsOptional()
  @IsString()
  password?: string;

  @IsString()
  @MinLength(1)
  displayName: string;
}

export class JoinByCodeDto {
  @IsString()
  meetingCode: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsString()
  @MinLength(1)
  displayName: string;
}
