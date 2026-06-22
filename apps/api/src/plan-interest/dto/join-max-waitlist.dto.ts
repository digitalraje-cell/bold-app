import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { MAX_DESTINATION_DEMAND_OPTIONS } from '@boldmeet/shared';

const DESTINATION_IDS = MAX_DESTINATION_DEMAND_OPTIONS.map((o) => o.id);

export class JoinMaxWaitlistDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requestedProviders?: string[];

  @IsOptional()
  @IsString()
  @IsIn(DESTINATION_IDS)
  expectedDestinations?: string;
}
