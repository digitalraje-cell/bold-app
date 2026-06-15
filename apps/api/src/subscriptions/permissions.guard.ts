import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionKey } from '@boldmeet/shared';
import { PERMISSION_KEY } from './require-permission.decorator';
import { PermissionsService } from './permissions.service';
import { AuthUser } from '../auth/auth.guard';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<PermissionKey>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    if (!permission) return true;

    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    await this.permissionsService.check(userId, permission);
    return true;
  }
}
