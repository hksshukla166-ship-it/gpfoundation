import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { applicationIdFor } from "./utils";

type Db = Prisma.TransactionClient | typeof prisma;

export async function nextApplicationId() {
  const year = new Date().getFullYear();
  const result = await prisma.$transaction(async (tx) => {
    const seq = await tx.applicationSequence.upsert({
      where: { year },
      create: { year, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });
    return applicationIdFor(year, seq.lastNumber);
  });
  return result;
}

export async function nextReceiptNumber(db: Db = prisma) {
  const year = new Date().getFullYear();
  const seq = await db.receiptSequence.upsert({
    where: { year },
    create: { year, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return `RCP-${year}-${String(seq.lastNumber).padStart(6, "0")}`;
}
