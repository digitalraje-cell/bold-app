import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { JitsiTokenService } from './jitsi-token.service';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [AuthModule, SubscriptionsModule, GatewayModule],
  controllers: [MeetingsController],
  providers: [MeetingsService, JitsiTokenService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
