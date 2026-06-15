import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    const databaseConfigured = Boolean(process.env.DATABASE_URL);
    const databaseConnected = this.prisma.isDatabaseConnected();

    return {
      status: 'ok',
      service: 'bold-api',
      timestamp: new Date().toISOString(),
      database: {
        configured: databaseConfigured,
        connected: databaseConnected,
      },
    };
  }
}
