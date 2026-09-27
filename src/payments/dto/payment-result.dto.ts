import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

export class TransactionDto {
  @ApiProperty({ example: 1, description: 'ID транзакции' })
  id!: number;

  @ApiProperty({ example: 1, description: 'ID пользователя' })
  userId!: number;

  @ApiProperty({
    enum: ['credit', 'debit'],
    description: 'Тип операции',
  })
  action!: 'credit' | 'debit';

  @ApiProperty({ example: '100.00', description: 'Сумма операции' })
  amount!: string;

  @ApiProperty({ description: 'Дата и время операции' })
  ts!: Date;
}

export class PaymentResultDto {
  @ApiProperty({ example: 1, description: 'ID пользователя' })
  userId!: number;

  @ApiProperty({ example: '900.00', description: 'Баланс после операции' })
  newBalance!: string;

  @ApiProperty({ type: TransactionDto, description: 'Информация о транзакции' })
  transaction!: TransactionDto;
}

export function toTransactionDto(t: {
  id: number;
  userId: number;
  action: 'credit' | 'debit';
  amount: Prisma.Decimal;
  ts: Date;
}): TransactionDto {
  return {
    id: t.id,
    userId: t.userId,
    action: t.action,
    amount: t.amount.toFixed(2),
    ts: t.ts,
  };
}

export function toPaymentResult(r: {
  userId: number;
  newBalance: Prisma.Decimal;
  transaction: {
    id: number;
    userId: number;
    action: 'credit' | 'debit';
    amount: Prisma.Decimal;
    ts: Date;
  };
}): PaymentResultDto {
  return {
    userId: r.userId,
    newBalance: r.newBalance.toFixed(2),
    transaction: toTransactionDto(r.transaction),
  };
}
