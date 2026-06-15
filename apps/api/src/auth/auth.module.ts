import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
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
  providers: [AuthGuard, VerifiedGuard],
  exports: [AuthGuard, VerifiedGuard, JwtModule],
})
export class AuthModule {}
