import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from './auth.guard';

@Injectable()
export class VerifiedGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthUser }>();
    const user = await this.prisma.user.findUnique({
      where: { id: request.user.id },
      select: { isVerified: true },
    });

    if (!user?.isVerified) {
      throw new ForbiddenException('Verify your account to host meetings');
    }

    return true;
  }
}
