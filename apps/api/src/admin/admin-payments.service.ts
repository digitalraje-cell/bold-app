import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  listPendingPayments() {
    return this.prisma.pendingPayment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, email: true, name: true, subscriptionPlan: true } },
      },
    });
  }

  async activatePro(paymentId: string, adminUserId: string) {
    const payment = await this.prisma.pendingPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.paymentStatus === 'activated') {
      throw new BadRequestException('Payment already activated');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: payment.userId },
        data: {
          subscriptionPlan: SubscriptionPlan.PRO,
          subscriptionExpiresAt: expiresAt,
        },
      }),
      this.prisma.pendingPayment.update({
        where: { id: paymentId },
        data: { paymentStatus: 'activated' },
      }),
      this.prisma.subscriptionPayment.create({
        data: {
          userId: payment.userId,
          plan: payment.plan,
          amountInr: 299,
          status: 'activated',
          razorpayPaymentId: payment.razorpayPaymentLinkId,
        },
      }),
    ]);

    return {
      ok: true,
      userId: payment.userId,
      plan: SubscriptionPlan.PRO,
      activatedBy: adminUserId,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
