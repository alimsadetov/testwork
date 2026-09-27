import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PaymentAction, PrismaClient } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { PaymentOperationResult } from './payments.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // списание средств
  async debit(
    userId: number,
    amount: Prisma.Decimal,
  ): Promise<PaymentOperationResult> {
    if (amount.lte(0)) throw new BadRequestException('amount must be positive');
    return this.executePayment(userId, PaymentAction.debit, amount);
  }

  // выполнение платежа (списание или пополнение)
  private async executePayment(
    userId: number,
    action: PaymentAction,
    amount: Prisma.Decimal,
  ): Promise<PaymentOperationResult> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException(`User ${userId} not found`);

      const historySum = await this.sumHistory(tx, userId);
      if (!historySum.eq(user.balance)) {
        this.logger.warn(
          `Balance drift detected for user=${userId}: stored=${user.balance.toFixed(
            2,
          )} history=${historySum.toFixed(2)}. Syncing stored balance with history.`,
        );
        await tx.user.update({
          where: { id: userId },
          data: { balance: historySum },
        });
      }

      const currentBalance = historySum;

      if (action === PaymentAction.debit && currentBalance.lt(amount)) {
        throw new BadRequestException(
          `Insufficient funds: balance=${currentBalance.toFixed(
            2,
          )}, required=${amount.toFixed(2)}`,
        );
      }

      const signedDelta =
        action === PaymentAction.credit ? amount : amount.negated();

      const updatedCount = await tx.user.updateMany({
        where: {
          id: userId,
          ...(action === PaymentAction.debit
            ? { balance: { gte: amount } }
            : {}),
        },
        data: { balance: { increment: signedDelta } },
      });

      if (updatedCount.count !== 1) {
        throw new BadRequestException(
          'Concurrent balance change detected, please retry the operation',
        );
      }

      const transaction = await tx.paymentHistory.create({
        data: { userId, action, amount },
      });

      const refreshed = await tx.user.findUniqueOrThrow({
        where: { id: userId },
      });
      return {
        userId,
        newBalance: refreshed.balance,
        transaction,
      };
    });
  }

  private async sumHistory(
    tx: Prisma.TransactionClient | PrismaClient,
    userId: number,
  ): Promise<Prisma.Decimal> {
    const grouped = await tx.paymentHistory.groupBy({
      by: ['action'],
      where: { userId },
      _sum: { amount: true },
    });

    let total = new Prisma.Decimal(0);
    for (const row of grouped) {
      const sum = row._sum.amount ?? new Prisma.Decimal(0);
      total =
        row.action === PaymentAction.credit
          ? total.plus(sum)
          : total.minus(sum);
    }
    return total;
  }
}
