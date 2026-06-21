import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MeetingsModule } from './meetings/meetings.module';
import { GatewayModule } from './gateway/gateway.module';
import { ParticipantsModule } from './participants/participants.module';
import { YoutubeModule } from './youtube/youtube.module';
import { BillingModule } from './billing/billing.module';
import { AdminModule } from './admin/admin.module';
import { RoadmapModule } from './roadmap/roadmap.module';

import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { RecordingModule } from './recording/recording.module';
import { WebinarModule } from './webinar/webinar.module';
import { RoomModule } from './room/room.module';
import { StreamModule } from './stream/stream.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    BillingModule,
    AdminModule,
    RoadmapModule,
    MeetingsModule,
    ParticipantsModule,
    GatewayModule,
    RecordingModule,
    WebinarModule,
    RoomModule,
    StreamModule,
    YoutubeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
