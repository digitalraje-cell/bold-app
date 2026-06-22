import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { isSuperAdmin } from '@boldmeet/shared';
import { Request } from 'express';
import { AuthUser } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Super admin access required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });

    const email = user?.email ?? request.user?.email;
    if (!isSuperAdmin(user?.role ?? '', email)) {
      throw new ForbiddenException('Super admin access required');
    }

    return true;
  }
}
