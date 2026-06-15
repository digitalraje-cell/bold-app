import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'bold-api',
      timestamp: new Date().toISOString(),
    };
  }
}
