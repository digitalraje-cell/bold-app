import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GatewayModule } from '../gateway/gateway.module';
import { YoutubeModule } from '../youtube/youtube.module';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';
import { StreamRelayService } from './stream-relay.service';
import { StreamIngestGateway } from './stream-ingest.gateway';
import {
  CustomRtmpBroadcastProvider,
  YoutubeRtmpBroadcastProvider,
} from './stream.providers';

@Module({
  imports: [AuthModule, SubscriptionsModule, GatewayModule, YoutubeModule],
  controllers: [StreamController],
  providers: [
    StreamService,
    StreamRelayService,
    StreamIngestGateway,
    YoutubeRtmpBroadcastProvider,
    CustomRtmpBroadcastProvider,
  ],
  exports: [StreamService, StreamRelayService],
})
export class StreamModule {}
