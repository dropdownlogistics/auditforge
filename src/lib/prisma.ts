import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

async function resolveCompanyId(idOrNaturalId: string) {
  if (idOrNaturalId.startsWith("c") && idOrNaturalId.length > 20) {
    return idOrNaturalId;
  }
  const company = await prisma.company.findUnique({
    where: { companyId: idOrNaturalId },
  });
  return company?.id || null;
}

export { prisma, resolveCompanyId };
