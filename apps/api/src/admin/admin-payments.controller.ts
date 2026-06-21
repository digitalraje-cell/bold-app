import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminPaymentsService } from './admin-payments.service';

@Controller('admin/payments')
@UseGuards(AuthGuard, AdminGuard)
export class AdminPaymentsController {
  constructor(private readonly adminPaymentsService: AdminPaymentsService) {}

  @Get('pending')
  listPending() {
    return this.adminPaymentsService.listPendingPayments();
  }

  @Post(':id/activate')
  activate(@Param('id') id: string, @Req() req: Request & { user: AuthUser }) {
    return this.adminPaymentsService.activatePro(id, req.user.id);
  }
}
