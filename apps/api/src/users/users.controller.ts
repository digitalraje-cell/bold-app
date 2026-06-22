import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { UpdateProfileDto } from './dto/profile.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  getProfile(@Req() req: Request & { user: AuthUser }) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me/profile')
  @UseGuards(AuthGuard)
  updateProfile(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }
}
