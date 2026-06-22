import { Module, forwardRef } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { JitsiTokenService } from './jitsi-token.service';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GatewayModule } from '../gateway/gateway.module';
import { StreamModule } from '../stream/stream.module';

@Module({
  imports: [AuthModule, SubscriptionsModule, GatewayModule, forwardRef(() => StreamModule)],
  controllers: [MeetingsController],
  providers: [MeetingsService, JitsiTokenService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
