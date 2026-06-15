import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { RecordingProviderType } from '@boldmeet/shared';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { VerifiedGuard } from '../auth/verified.guard';
import { PermissionsGuard } from '../subscriptions/permissions.guard';
import { RequirePermission } from '../subscriptions/require-permission.decorator';
import { RecordingProviderRegistry } from './recording.providers';

@Controller('recording')
export class RecordingController {
  constructor(private readonly registry: RecordingProviderRegistry) {}

  @Get('providers')
  @UseGuards(AuthGuard, VerifiedGuard, PermissionsGuard)
  @RequirePermission('canStreamToYoutube')
  async listProviders(@Req() req: Request & { user: AuthUser }) {
    const available = await this.registry.getAvailableProviders(req.user.id);
    return {
      providers: Object.values(RecordingProviderType).map((type) => ({
        type,
        available: available.includes(type),
        label:
          type === RecordingProviderType.YOUTUBE
            ? 'YouTube'
            : type === RecordingProviderType.BOLD_VIDEO
              ? 'Bold Video Platform'
              : 'Cloud Storage',
      })),
    };
  }
}
