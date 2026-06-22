import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminYoutubeService } from './admin-youtube.service';

@Controller('admin/youtube')
@UseGuards(AuthGuard, AdminGuard)
export class AdminYoutubeController {
  constructor(private readonly youtubeService: AdminYoutubeService) {}

  @Get('stats')
  stats() {
    return this.youtubeService.getStats();
  }
}
