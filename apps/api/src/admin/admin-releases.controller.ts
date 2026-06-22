import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { AdminReleasesService } from './admin-releases.service';
import { CreateAppReleaseDto } from './dto/create-app-release.dto';

@Controller('admin/releases')
@UseGuards(AuthGuard, SuperAdminGuard)
export class AdminReleasesController {
  constructor(private readonly releasesService: AdminReleasesService) {}

  @Get()
  list() {
    return this.releasesService.listReleases();
  }

  @Post()
  create(@Req() req: Request & { user: AuthUser }, @Body() dto: CreateAppReleaseDto) {
    return this.releasesService.createRelease(dto, req.user.id);
  }
}
