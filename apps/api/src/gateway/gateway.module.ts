import { Module } from '@nestjs/common';
import { MeetingGateway } from './meeting.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MeetingGateway],
  exports: [MeetingGateway],
})
export class GatewayModule {}
