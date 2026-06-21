import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { RoadmapService } from './roadmap.service';

@Controller('roadmap')
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Get('votes')
  @UseGuards(OptionalAuthGuard)
  getVotes(@Req() req: Request & { user?: AuthUser }) {
    return this.roadmapService.getVoteSummary(req.user?.id);
  }

  @Post('votes')
  @UseGuards(AuthGuard)
  vote(@Req() req: Request & { user: AuthUser }, @Body() body: { featureKey: string }) {
    return this.roadmapService.vote(req.user.id, body.featureKey);
  }

  @Delete('votes/:featureKey')
  @UseGuards(AuthGuard)
  removeVote(@Req() req: Request & { user: AuthUser }, @Param('featureKey') featureKey: string) {
    return this.roadmapService.removeVote(req.user.id, featureKey);
  }
}
