"use server";
import { db } from "@/lib/db";

export async function getUserById(userId: string) {
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                createdAt: true,
                updatedAt: true,
                role: true,
                banned: true,
                banReason: true,
                banExpires: true,
                accounts: {
                    select: {
                        providerId: true,
                        accountId: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                sessions: {
                    select: {
                        id: true,
                        expiresAt: true,
                        createdAt: true,
                        updatedAt: true,
                        ipAddress: true,
                        userAgent: true,
                        activeOrganizationId: true,
                    },
                },
                apikeys: {
                    select: {
                        id: true,
                        name: true,
                        enabled: true,
                        createdAt: true,
                        updatedAt: true,
                        expiresAt: true,
                    },
                },
            },
        });
        return {
            ...user,
        };
    } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error);
        return null;
    }
}