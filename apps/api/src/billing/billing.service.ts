import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SubscriptionPlan, PLAN_PRICING_INR, resolveEffectivePlan } from '@boldmeet/shared';
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

    const [hosted, joined, payments, pending] = await Promise.all([
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
      this.prisma.pendingPayment.findFirst({
        where: { userId, paymentStatus: { in: ['pending', 'paid'] } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const plan =
      ctx.plan === SubscriptionPlan.PRO
        ? SubscriptionPlan.PRO
        : SubscriptionPlan.FREE;

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
      paymentHistory: payments.map((p) => ({
        id: p.id,
        amountInr: p.amountInr,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      })),
      pendingPayment: pending
        ? {
            id: pending.id,
            status: pending.paymentStatus,
            createdAt: pending.createdAt.toISOString(),
          }
        : null,
      razorpayConfigured: this.isRazorpayConfigured(),
    };
  }

  private isRazorpayConfigured(): boolean {
    return Boolean(
      process.env.RAZORPAY_PRO_PAYMENT_LINK?.trim() ||
      (process.env.RAZORPAY_KEY_ID?.trim() &&
        process.env.RAZORPAY_KEY_SECRET?.trim()),
    );
  }

  async createProPaymentLink(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, subscriptionPlan: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const effectivePlan = resolveEffectivePlan(
      user.role,
      user.subscriptionPlan as SubscriptionPlan,
      user.email,
    );

    if (effectivePlan !== SubscriptionPlan.FREE) {
      throw new BadRequestException('Your account already has full plan access.');
    }

    const frontend =
      process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3000';
    const amountInr = PLAN_PRICING_INR[SubscriptionPlan.PRO];

    const pending = await this.prisma.pendingPayment.create({
      data: {
        userId: user.id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        plan: SubscriptionPlan.PRO,
        paymentStatus: 'pending',
      },
    });

    const callbackUrl = `${frontend}/billing/success?pending=${pending.id}`;
    const cancelUrl = `${frontend}/billing/cancelled?pending=${pending.id}`;

    const staticLink = process.env.RAZORPAY_PRO_PAYMENT_LINK?.trim();
    if (staticLink) {
      const url = new URL(staticLink);
      url.searchParams.set('email', user.email);
      if (user.name) {
        url.searchParams.set('prefill[name]', user.name);
      }
      url.searchParams.set('notes[user_id]', user.id);
      url.searchParams.set('notes[plan]', SubscriptionPlan.PRO);
      url.searchParams.set('notes[pending_id]', pending.id);

      return {
        paymentUrl: url.toString(),
        pendingPaymentId: pending.id,
        amountInr,
        cancelUrl,
        callbackUrl,
        mode: 'static_link' as const,
      };
    }

    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException(
        'Razorpay is not configured. Set RAZORPAY_PRO_PAYMENT_LINK or RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET.',
      );
    }

    const link = await this.createRazorpayPaymentLink({
      amountInr,
      description: 'Bold Pro — Early Founder Pricing (₹299/month)',
      customer: {
        name: user.name || user.email.split('@')[0],
        email: user.email,
      },
      notes: {
        user_id: user.id,
        plan: SubscriptionPlan.PRO,
        pending_id: pending.id,
      },
      callbackUrl,
    });

    await this.prisma.pendingPayment.update({
      where: { id: pending.id },
      data: { razorpayPaymentLinkId: link.id },
    });

    return {
      paymentUrl: link.short_url,
      pendingPaymentId: pending.id,
      amountInr,
      cancelUrl,
      callbackUrl,
      mode: 'api_link' as const,
    };
  }

  /** @deprecated use createProPaymentLink */
  createProCheckout(userId: string) {
    return this.createProPaymentLink(userId);
  }

  async markPendingPaid(userId: string, pendingId: string) {
    const pending = await this.prisma.pendingPayment.findFirst({
      where: { id: pendingId, userId },
    });

    if (!pending) {
      throw new NotFoundException('Pending payment not found');
    }

    if (pending.paymentStatus === 'activated') {
      return { ok: true, status: pending.paymentStatus };
    }

    const updated = await this.prisma.pendingPayment.update({
      where: { id: pendingId },
      data: { paymentStatus: 'paid' },
    });

    return {
      ok: true,
      status: updated.paymentStatus,
      message:
        'Thank you! Your payment is recorded. Pro access is activated manually within 24 hours after verification.',
    };
  }

  async cancelPending(userId: string, pendingId: string) {
    const pending = await this.prisma.pendingPayment.findFirst({
      where: { id: pendingId, userId },
    });

    if (!pending) {
      throw new NotFoundException('Pending payment not found');
    }

    if (pending.paymentStatus === 'activated') {
      throw new BadRequestException('Payment already activated');
    }

    await this.prisma.pendingPayment.update({
      where: { id: pendingId },
      data: { paymentStatus: 'cancelled' },
    });

    return { ok: true, status: 'cancelled' };
  }

  private async createRazorpayPaymentLink(params: {
    amountInr: number;
    description: string;
    customer: { name: string; email: string };
    notes: Record<string, string>;
    callbackUrl: string;
  }): Promise<{ id: string; short_url: string }> {
    const keyId = process.env.RAZORPAY_KEY_ID!.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET!.trim();
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amountInr * 100,
        currency: 'INR',
        description: params.description,
        customer: params.customer,
        notify: { sms: false, email: true },
        reminder_enable: true,
        notes: params.notes,
        callback_url: params.callbackUrl,
        callback_method: 'get',
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new ServiceUnavailableException(
        `Razorpay payment link failed: ${body.slice(0, 200)}`,
      );
    }

    const data = (await res.json()) as { id: string; short_url: string };
    return data;
  }
}
