import "dotenv/config";
import path from "node:path";
import type { PrismaConfig } from "prisma";

export default {
    experimental: {
        adapter: true,
        externalTables: true,
        studio: true,
    },
    schema: path.join("prisma", "schema"),
    migrations: {
        path: path.join("prisma", "migrations"),
        seed: "bun prisma/seed.ts"
    },
    views: {
        path: path.join("prisma", "views"),
    },
    typedSql: {
        path: path.join("prisma", "queries"),
    }

} satisfies PrismaConfig;