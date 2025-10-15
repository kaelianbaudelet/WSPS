"use server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { authorizeThisAction } from "./auth.actions";
export async function createApiKey(name: string, expiresIn: number, prefix: string, permissions: Record<string, string[]> = {}) {

    const authSession = await authorizeThisAction();
    if (!authSession) {
        return {
            success: false,
            message: "Authentication required",
        };
    }

    try {
        const data = await auth.api.createApiKey({
            body: {
                name: name,
                expiresIn: expiresIn,
                userId: authSession.user.id,
                prefix: prefix,
                permissions: permissions,
            },
        });

        return {
            success: true,
            data: data,
        };
    } catch (error) {
        console.error("Error creating API key:", error);
        return {
            success: false,
            message: "Failed to create API key",
        };
    }
}

export async function getApiKeys() {
    const authSession = await authorizeThisAction();
    if (!authSession) {
        return {
            success: false,
            message: "Authentication required",
        };
    }

    try {
        const apiKeys = await auth.api.listApiKeys({
            headers: await headers(),
        });

        return {
            success: true,
            data: apiKeys,
        };
    } catch (error) {
        console.error("Error retrieving API keys:", error);
        return {
            success: false,
            message: "Failed to retrieve API keys",
        };
    }
}

export async function verifyApiKey(apiKey: string) {
    try {
        const data = await auth.api.verifyApiKey({
            body: { key: apiKey },
        });

        return {
            valid: data?.valid ?? false,
            key: data?.key ?? null,
            message: data?.error?.message ?? null,
        };
    } catch (error) {
        console.error("Error verifying API key:", error);
        return {
            valid: false,
            key: null,
            message: "Failed to verify API key",
        };
    }
}

export async function deleteApiKey(apiKeyId: string) {
    const authSession = await authorizeThisAction();
    if (!authSession) {
        return {
            success: false,
            message: "Authentication required",
        };
    }

    try {
        await auth.api.deleteApiKey({
            body: {
                keyId: apiKeyId,
            },
            headers: await headers(),
        });
        return {
            success: true,
            message: "API key deleted successfully",
        };
    } catch (error) {
        console.error("Error deleting API key:", error);
        return {
            success: false,
            message: "Failed to delete API key",
        };
    }
}

export async function getApiKeyDetails(apiKeyId: string) {
    try {
        const apiKey = await auth.api.getApiKey({
            query: {
                id: apiKeyId,
            },
            headers: await headers(),
        });

        return {
            success: true,
            data: apiKey,
        };
    } catch (error) {
        console.error("Error retrieving API key details:", error);
        return {
            success: false,
            message: "Failed to retrieve API key details",
        };
    }

}