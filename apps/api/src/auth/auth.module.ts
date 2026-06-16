import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { OptionalAuthGuard } from './optional-auth.guard';
import { VerifiedGuard } from './verified.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      global: true,
      secret:
        process.env.JWT_SECRET ||
        process.env.AUTH_SECRET ||
        'bold-dev-jwt-secret-change-in-production',
    }),
  ],
  providers: [AuthGuard, OptionalAuthGuard, VerifiedGuard],
  exports: [AuthGuard, OptionalAuthGuard, VerifiedGuard, JwtModule],
})
export class AuthModule {}
