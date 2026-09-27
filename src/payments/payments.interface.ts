import { PaymentAction, Prisma } from "@prisma/client";

export interface PaymentOperationResult {
  userId: number;
  newBalance: Prisma.Decimal;
  transaction: {
    id: number;
    userId: number;
    action: PaymentAction;
    amount: Prisma.Decimal;
    ts: Date;
  };
}