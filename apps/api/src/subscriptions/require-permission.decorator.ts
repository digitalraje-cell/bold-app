import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '@boldmeet/shared';

export const PERMISSION_KEY = 'permission';

export const RequirePermission = (permission: PermissionKey) =>
  SetMetadata(PERMISSION_KEY, permission);
