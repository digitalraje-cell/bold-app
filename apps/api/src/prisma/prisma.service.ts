import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      this.logger.warn('DATABASE_URL is not set — database features disabled until configured');
      return;
    }

    try {
      await this.$connect();
      this.connected = true;
      this.logger.log('Database connected');
    } catch (error) {
      this.connected = false;
      this.logger.error(
        'Database connection failed at startup — API will still serve health checks',
        error instanceof Error ? error.message : error,
      );
    }
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.$disconnect();
    }
  }

  isDatabaseConnected(): boolean {
    return this.connected;
  }
}
