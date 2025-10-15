import { PrismaClient } from "@prisma/client";

const createPrismaClient = () =>
    new PrismaClient({
        errorFormat: "pretty",
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

declare global {
    interface BigInt {
        toJSON(): Number;
    }
}

BigInt.prototype.toJSON = function () {
    return Number(this);
};
