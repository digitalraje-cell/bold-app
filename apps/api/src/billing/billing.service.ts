import { Injectable } from '@nestjs/common';
import { SubscriptionPlan, PLAN_PRICING_INR } from '@boldmeet/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from '../subscriptions/permissions.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async getSummary(userId: string) {
    const ctx = await this.permissionsService.getUserPlanContext(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionExpiresAt: true },
    });

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [hosted, joined, payments] = await Promise.all([
      this.prisma.meeting.count({
        where: { hostId: userId, createdAt: { gte: monthStart } },
      }),
      this.prisma.participant.count({
        where: {
          userId,
          joinedAt: { gte: monthStart },
          status: { in: ['ADMITTED', 'LEFT'] },
        },
      }),
      this.prisma.subscriptionPayment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const plan = ctx.plan === SubscriptionPlan.PRO ? SubscriptionPlan.PRO : SubscriptionPlan.FREE;

    return {
      plan: ctx.plan,
      isVerified: ctx.isVerified,
      priceInr: PLAN_PRICING_INR[plan],
      subscriptionStatus: user?.subscriptionExpiresAt ? 'active' : 'active',
      renewsAt: user?.subscriptionExpiresAt?.toISOString() ?? null,
      usage: {
        meetingsHostedThisMonth: hosted,
        meetingsJoinedThisMonth: joined,
      },
      paymentHistory: payments.map((p: (typeof payments)[number]) => ({
        id: p.id,
        amountInr: p.amountInr,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      })),
      razorpayConfigured: Boolean(
        process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim(),
      ),
    };
  }

  createProCheckout(userId: string) {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!keyId || !keySecret) {
      return {
        checkoutUrl: null,
        message:
          'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable Pro checkout.',
      };
    }

    return {
      checkoutUrl: null,
      message:
        'Razorpay checkout integration is prepared. Wire webhook handler to activate live payments.',
      orderId: null,
      amountInr: PLAN_PRICING_INR[SubscriptionPlan.PRO],
      userId,
    };
  }
}
