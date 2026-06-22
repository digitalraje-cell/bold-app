import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  RegistrationFieldType,
  RegistrationStatus,
  StandardRegistrationField,
} from '@prisma/client';

export class RegistrationFieldDto {
  @IsString()
  @MinLength(1)
  fieldKey: string;

  @IsString()
  @MinLength(1)
  label: string;

  @IsEnum(RegistrationFieldType)
  fieldType: RegistrationFieldType;

  @IsOptional()
  @IsEnum(StandardRegistrationField)
  standardField?: StandardRegistrationField | null;

  @IsBoolean()
  isRequired: boolean;

  @IsBoolean()
  isEnabled: boolean;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsInt()
  @Min(0)
  sortOrder: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsOptional()
  @IsBoolean()
  isCustom?: boolean;
}

export class RegistrationFormSettingsDto {
  @IsBoolean()
  requireApproval: boolean;

  @IsBoolean()
  autoApprove: boolean;

  @IsBoolean()
  sendConfirmationEmail: boolean;

  @IsBoolean()
  limitRegistrations: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxRegistrations?: number | null;
}

export class UpsertRegistrationFormDto {
  @ValidateNested()
  @Type(() => RegistrationFormSettingsDto)
  settings: RegistrationFormSettingsDto;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => RegistrationFieldDto)
  fields: RegistrationFieldDto[];
}

export class SubmitRegistrationDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  /** fieldKey -> value (including custom questions) */
  @IsObject()
  answers: Record<string, string | string[]>;
}

export class UpdateRegistrationStatusDto {
  @IsEnum(RegistrationStatus)
  status: RegistrationStatus;
}
