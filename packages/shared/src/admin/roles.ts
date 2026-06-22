export const SUPER_ADMIN_EMAIL = 'digitalraje@gmail.com';

export enum PlatformRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export function isPlatformAdmin(role: string | undefined | null): boolean {
  return role === PlatformRole.ADMIN || role === PlatformRole.SUPER_ADMIN;
}

export function isSuperAdmin(role: string | undefined | null): boolean {
  return role === PlatformRole.SUPER_ADMIN;
}
