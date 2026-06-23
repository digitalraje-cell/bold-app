import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingPostersController } from './meeting-posters.controller';
import { MeetingsService } from './meetings.service';
import { MeetingPosterService } from './meeting-poster.service';
import { JitsiTokenService } from './jitsi-token.service';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [AuthModule, SubscriptionsModule, GatewayModule],
  controllers: [MeetingsController, MeetingPostersController],
  providers: [MeetingsService, MeetingPosterService, JitsiTokenService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
