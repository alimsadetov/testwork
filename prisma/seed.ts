import { PrismaClient, Prisma, PaymentAction } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, balance: new Prisma.Decimal('1000.00') },
  });

  const historyCount = await prisma.paymentHistory.count({ where: { userId: user.id } });
  if (historyCount === 0) {
    await prisma.paymentHistory.createMany({
      data: [
        {
          userId: user.id,
          action: PaymentAction.credit,
          amount: new Prisma.Decimal('1500.00'),
          ts: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        },
        {
          userId: user.id,
          action: PaymentAction.debit,
          amount: new Prisma.Decimal('500.00'),
          ts: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
      ],
    });
  }

  console.log('Seed completed: user id=1, balance=1000.00, 2 history rows');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
