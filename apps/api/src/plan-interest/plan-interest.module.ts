import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlanInterestController } from './plan-interest.controller';
import { PlanInterestService } from './plan-interest.service';

@Module({
  imports: [AuthModule],
  controllers: [PlanInterestController],
  providers: [PlanInterestService],
  exports: [PlanInterestService],
})
export class PlanInterestModule {}
