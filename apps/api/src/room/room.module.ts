import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { ParticipantsModule } from '../participants/participants.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [ParticipantsModule, SubscriptionsModule, GatewayModule],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
