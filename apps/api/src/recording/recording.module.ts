import { Module } from '@nestjs/common';
import {
  YouTubeRecordingProvider,
  BoldVideoRecordingProvider,
  StorageRecordingProvider,
  RecordingProviderRegistry,
} from './recording.providers';
import { RecordingController } from './recording.controller';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [AuthModule, SubscriptionsModule],
  controllers: [RecordingController],
  providers: [
    YouTubeRecordingProvider,
    BoldVideoRecordingProvider,
    StorageRecordingProvider,
    RecordingProviderRegistry,
  ],
  exports: [RecordingProviderRegistry],
})
export class RecordingModule {}
