import { Module } from '@nestjs/common';
import { MeetingGateway } from './meeting.gateway';

@Module({
  providers: [MeetingGateway],
  exports: [MeetingGateway],
})
export class GatewayModule {}
