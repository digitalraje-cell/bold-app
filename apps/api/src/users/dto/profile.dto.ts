import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  mobile?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  organization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  designation?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'Website must be a valid URL' })
  website?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'LinkedIn URL must be valid' })
  linkedInUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'Avatar URL must be valid' })
  avatarUrl?: string;
}
