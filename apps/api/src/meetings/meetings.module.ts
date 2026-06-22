import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { JitsiTokenService } from './jitsi-token.service';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GatewayModule } from '../gateway/gateway.module';
import { UsersModule } from '../users/users.module';
import { RegistrationModule } from '../registration/registration.module';

@Module({
  imports: [
    AuthModule,
    SubscriptionsModule,
    GatewayModule,
    UsersModule,
    RegistrationModule,
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService, JitsiTokenService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
