import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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
    return this.billingService.createProPaymentLink(req.user.id);
  }

  @Post('payment-link/pro')
  @UseGuards(AuthGuard)
  createProPaymentLink(@Req() req: Request & { user: AuthUser }) {
    return this.billingService.createProPaymentLink(req.user.id);
  }

  @Post('pending/:id/mark-paid')
  @UseGuards(AuthGuard)
  markPaid(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.billingService.markPendingPaid(req.user.id, id);
  }

  @Post('pending/:id/cancel')
  @UseGuards(AuthGuard)
  cancelPending(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.billingService.cancelPending(req.user.id, id);
  }
}
