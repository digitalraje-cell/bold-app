import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
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

  @IsOptional()
  @IsBoolean()
  registrationRequired?: boolean;
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
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(500)
  participantLimit?: number;

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

  /** Direct invite link join — skip password prompt (link is the access grant). */
  @IsOptional()
  @IsBoolean()
  viaDirectLink?: boolean;

  /** Rejoin as existing anonymous participant. */
  @IsOptional()
  @IsString()
  participantId?: string;

  /** Email used during registration (when registrationRequired). */
  @IsOptional()
  @IsString()
  registrantEmail?: string;
}

export class RegisterMeetingDto {
  @IsString()
  @MinLength(1)
  fullName: string;

  @IsString()
  @MinLength(3)
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  designation?: string;
}

export class LeaveGuestDto {
  @IsString()
  participantId: string;
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
