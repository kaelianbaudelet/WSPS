import { db } from "@/lib/db";
import { siteConfig } from "@/resources/site";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { apiKey, createAuthMiddleware } from "better-auth/plugins";
import ms from "ms";

export const auth = betterAuth({
    user: {
        changeEmail: {
            enabled: true,
        }
    },
    appName: siteConfig.name,
    rateLimit: {
        window: 60,
        max: 100,
    },
    database: prismaAdapter(db, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        minPasswordLength: 6,
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: ms("30min"),
        },
    },

    plugins: [

        apiKey({
            enableMetadata: true,
            rateLimit: {
                enabled: true,
                timeWindow: 1000 * 60 * 60,
                maxRequests: 1000,
            },
        }),
        nextCookies(),
    ],
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
        }),
    },
    trustedOrigins: [
        "http://localhost:3000", "http://0.0.0.0:3000"
    ]
});