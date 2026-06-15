import { Module } from '@nestjs/common';
import { WebinarService } from './webinar.service';
import { WebinarController } from './webinar.controller';

@Module({
  controllers: [WebinarController],
  providers: [WebinarService],
  exports: [WebinarService],
})
export class WebinarModule {}
