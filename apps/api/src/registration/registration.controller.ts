import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Request } from 'express';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import {
  SubmitRegistrationDto,
  UpdateRegistrationStatusDto,
  UpsertRegistrationFormDto,
} from './dto/registration.dto';
import { RegistrationService } from './registration.service';

@Controller('meetings/:meetingId/registration')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Get('form')
  @UseGuards(AuthGuard)
  getForm(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
  ) {
    return this.registrationService.getFormForHost(meetingId, req.user.id);
  }

  @Put('form')
  @UseGuards(AuthGuard)
  upsertForm(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Body() dto: UpsertRegistrationFormDto,
  ) {
    return this.registrationService.upsertForm(meetingId, req.user.id, dto);
  }

  @Get('form/public')
  getPublicForm(@Param('meetingId') meetingId: string) {
    return this.registrationService.getPublicForm(meetingId);
  }

  @Post('submit')
  submit(
    @Param('meetingId') meetingId: string,
    @Body() dto: SubmitRegistrationDto,
  ) {
    return this.registrationService.submitRegistration(meetingId, dto);
  }

  @Get('status')
  getStatus(
    @Param('meetingId') meetingId: string,
    @Query('email') email: string,
  ) {
    return this.registrationService.getRegistrationStatus(meetingId, email);
  }

  @Get('registrations')
  @UseGuards(AuthGuard)
  listRegistrations(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
  ) {
    return this.registrationService.listRegistrations(meetingId, req.user.id);
  }

  @Patch('registrations/:registrationId')
  @UseGuards(AuthGuard)
  updateStatus(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Param('registrationId') registrationId: string,
    @Body() dto: UpdateRegistrationStatusDto,
  ) {
    return this.registrationService.updateRegistrationStatus(
      meetingId,
      registrationId,
      req.user.id,
      dto.status,
    );
  }

  @Get('registrations/export')
  @UseGuards(AuthGuard)
  async exportRegistrations(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Query('format') format: 'csv' | 'excel' = 'csv',
    @Res() res: Response,
  ) {
    const exported = await this.registrationService.exportRegistrations(
      meetingId,
      req.user.id,
      format === 'excel' ? 'excel' : 'csv',
    );

    res.setHeader('Content-Type', exported.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.body);
  }
}
