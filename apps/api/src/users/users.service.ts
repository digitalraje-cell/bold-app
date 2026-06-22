import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  getProfileCompletionPercent,
  isHostProfileComplete,
  isSignupProfileComplete,
} from '@boldmeet/shared';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        isActive: true,
        verifiedAt: true,
        lastLoginAt: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        profile: true,
        subscription: true,
        _count: { select: { hostedMeetings: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatProfileResponse(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new BadRequestException('Account is deactivated');
    }

    const merged = {
      name: dto.name?.trim() ?? user.name,
      email: user.email,
      mobile: dto.mobile?.trim() ?? user.profile?.mobile,
      country: dto.country?.trim() ?? user.profile?.country,
      organization: dto.organization?.trim() ?? user.profile?.organization,
      designation: dto.designation?.trim() ?? user.profile?.designation,
      avatarUrl: dto.avatarUrl?.trim() ?? user.avatarUrl,
      website: dto.website?.trim() ?? user.profile?.website,
      linkedInUrl: dto.linkedInUrl?.trim() ?? user.profile?.linkedInUrl,
    };

    const signupComplete = isSignupProfileComplete(merged);
    const hostComplete = isHostProfileComplete(merged);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: merged.name,
        avatarUrl: merged.avatarUrl,
        profile: {
          upsert: {
            create: {
              mobile: merged.mobile,
              country: merged.country,
              organization: merged.organization,
              designation: merged.designation,
              website: merged.website,
              linkedInUrl: merged.linkedInUrl,
              profileCompletedAt: signupComplete ? new Date() : null,
            },
            update: {
              mobile: merged.mobile,
              country: merged.country,
              organization: merged.organization,
              designation: merged.designation,
              website: merged.website,
              linkedInUrl: merged.linkedInUrl,
              profileCompletedAt: signupComplete ? new Date() : null,
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        isActive: true,
        verifiedAt: true,
        lastLoginAt: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        profile: true,
        subscription: true,
        _count: { select: { hostedMeetings: true } },
      },
    });

    return {
      ...this.formatProfileResponse(updated),
      hostProfileComplete: hostComplete,
      signupProfileComplete: signupComplete,
    };
  }

  async assertHostProfileComplete(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const complete = isHostProfileComplete({
      name: user.name,
      mobile: user.profile?.mobile,
      organization: user.profile?.organization,
      designation: user.profile?.designation,
    });

    if (!complete) {
      throw new BadRequestException({
        message: 'Complete your Host Profile before creating a meeting',
        code: 'HOST_PROFILE_INCOMPLETE',
      });
    }
  }

  private formatProfileResponse(user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
    isVerified: boolean;
    isActive: boolean;
    verifiedAt: Date | null;
    lastLoginAt: Date | null;
    subscriptionPlan: string;
    subscriptionExpiresAt: Date | null;
    createdAt: Date;
    profile: {
      mobile: string | null;
      country: string | null;
      organization: string | null;
      designation: string | null;
      website: string | null;
      linkedInUrl: string | null;
      profileCompletedAt: Date | null;
    } | null;
    subscription: {
      planName: string;
      planStatus: string;
      planStartDate: Date | null;
      planExpiryDate: Date | null;
      paymentStatus: string;
      paymentProvider: string | null;
    } | null;
    _count: { hostedMeetings: number };
  }) {
    const input = {
      name: user.name,
      email: user.email,
      mobile: user.profile?.mobile,
      country: user.profile?.country,
      organization: user.profile?.organization,
      designation: user.profile?.designation,
      avatarUrl: user.avatarUrl,
      website: user.profile?.website,
      linkedInUrl: user.profile?.linkedInUrl,
    };

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      verifiedAt: user.verifiedAt,
      lastLoginAt: user.lastLoginAt,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      createdAt: user.createdAt,
      profile: user.profile,
      subscription: user.subscription,
      meetingsCreated: user._count.hostedMeetings,
      profileCompletionPercent: getProfileCompletionPercent(input),
      hostProfileComplete: isHostProfileComplete(input),
      signupProfileComplete: isSignupProfileComplete(input),
    };
  }
}
