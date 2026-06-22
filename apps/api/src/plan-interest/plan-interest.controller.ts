import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { isMaxPlanLaunched } from '@boldmeet/shared';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { VerifiedGuard } from '../auth/verified.guard';
import { JoinMaxWaitlistDto } from './dto/join-max-waitlist.dto';
import { PlanInterestService } from './plan-interest.service';

@Controller('plan-interest')
export class PlanInterestController {
  constructor(private readonly planInterest: PlanInterestService) {}

  @Get('max')
  @UseGuards(AuthGuard, VerifiedGuard)
  maxStatus(@Req() req: Request & { user: AuthUser }) {
    return this.planInterest.getMaxWaitlistStatus(req.user.id);
  }

  @Post('max')
  @UseGuards(AuthGuard, VerifiedGuard)
  joinMax(@Req() req: Request & { user: AuthUser }, @Body() dto: JoinMaxWaitlistDto) {
    if (isMaxPlanLaunched()) {
      return {
        comingSoon: false,
        message: 'Max is now available. Visit billing to upgrade.',
      };
    }
    return this.planInterest.joinMaxWaitlist(
      req.user.id,
      dto.requestedProviders ?? [],
      dto.expectedDestinations ?? null,
    );
  }
}
