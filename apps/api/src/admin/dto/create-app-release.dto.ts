import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAppReleaseDto {
  @IsString()
  @MinLength(1)
  version!: string;

  @IsDateString()
  releaseDate!: string;

  @IsArray()
  @IsString({ each: true })
  releaseNotes!: string[];

  @IsOptional()
  @IsBoolean()
  forceUpdate?: boolean;
}
