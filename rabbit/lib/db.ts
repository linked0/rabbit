// Prisma 클라이언트 싱글톤 — dev에서 HMR로 커넥션이 누적되는 것 방지
import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = g.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") g.prisma = prisma;
