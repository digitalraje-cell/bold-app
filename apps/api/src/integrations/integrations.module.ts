import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConnectedAccountService } from './connected-account.service';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [AuthModule],
  controllers: [IntegrationsController],
  providers: [ConnectedAccountService, IntegrationsService],
  exports: [ConnectedAccountService, IntegrationsService],
})
export class IntegrationsModule {}
