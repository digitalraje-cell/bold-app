import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('summary')
  @UseGuards(AuthGuard)
  getSummary(@Req() req: Request & { user: AuthUser }) {
    return this.billingService.getSummary(req.user.id);
  }

  @Post('checkout/pro')
  @UseGuards(AuthGuard)
  createProCheckout(@Req() req: Request & { user: AuthUser }) {
    return this.billingService.createProCheckout(req.user.id);
  }
}
