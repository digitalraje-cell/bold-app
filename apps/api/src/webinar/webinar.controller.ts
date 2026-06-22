import { Controller, Get } from '@nestjs/common';
import { WebinarService } from './webinar.service';

@Controller('webinars')
export class WebinarController {
  constructor(private readonly webinarService: WebinarService) {}

  @Get('status')
  status() {
    return {
      implemented: false,
      message:
        'Evergreen webinar mode architecture is prepared. UI and features coming soon.',
      capabilities: [
        'Recorded video webinars (YouTube → Bold Video)',
        'Unlimited configurable attendees',
        'Multiple start/end schedules',
        'Pre-assigned moderators by email',
        'Future AI + human chat moderation',
      ],
    };
  }
}
