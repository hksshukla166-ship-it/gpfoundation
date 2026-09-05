import { prisma } from "./prisma";
import { applicationIdFor } from "./utils";

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
