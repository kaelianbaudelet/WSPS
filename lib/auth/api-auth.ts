import { verifyApiKey } from "@/app/actions/apikey.actions";
import { getUserById } from "@/app/actions/user.actions";
import { NextRequest, NextResponse } from "next/server";

export async function withApiAuth(
    request: NextRequest,
    handler: (request: NextRequest, context?: any) => Promise<Response>,
    options?: { service?: string; permissions?: string[]; context?: any }
) {
    try {
        const authHeader = request.headers.get("Authorization");
        const tokenHeader = request.headers.get("X-API-Key");
        let token = "";

        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1] || "";
        } else if (tokenHeader) {
            token = tokenHeader;
        }

        if (!token) {
            return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
        }

        const apiKey = await verifyApiKey(token);

        if (!apiKey) {
            return NextResponse.json(
                { message: `Internal Server Error` },
                { status: 500 }
            );
        }

        if (!apiKey?.valid || !apiKey?.key) {
            return NextResponse.json(
                { message: "API key is invalid, expired, or temporarily disabled due to exceeded usage limit" },
                { status: 401 }
            );
        }

        const user = await getUserById(apiKey.key.userId);

        if (!user) {
            return NextResponse.json(
                { message: `Internal Server Error` },
                { status: 500 }
            );
        }

        //const isAdmin = user.role == "admin"

        const isAdmin = false

        if (options?.service && options?.permissions && !isAdmin) {
            const apiKeyPermissions = apiKey?.key?.permissions?.[options.service] || [];
            const missingPermissions = options.permissions.filter(perm => !apiKeyPermissions.includes(perm));
            if (missingPermissions.length > 0) {
                return NextResponse.json(
                    { message: `Insufficient permissions on this API key to perform this action.` },
                    { status: 403 }
                );
            }
        }

        return handler(request, options?.context ? { ...options.context, apiKey: apiKey.key, user } : { apiKey: apiKey.key, user });
    } catch (error) {
        console.error("Erreur auth:", error);
        return NextResponse.json({ message: "Internal authentication error" }, { status: 500 });
    }
}