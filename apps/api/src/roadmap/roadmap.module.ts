import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { RoadmapController } from './roadmap.controller';
import { RoadmapService } from './roadmap.service';

@Module({
  imports: [AuthModule],
  controllers: [RoadmapController],
  providers: [RoadmapService, OptionalAuthGuard],
})
export class RoadmapModule {}
