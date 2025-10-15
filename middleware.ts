import type { auth } from "@/lib/auth";
import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";
import { siteConfig } from "./resources/site";

type Session = typeof auth.$Infer.Session;

export default async function authMiddleware(request: NextRequest) {
    try {
        const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
            baseURL: request.nextUrl.origin || siteConfig.domains.current,
            headers: {
                cookie: request.headers.get("cookie") || "",
            },
        });

        const pathname = request.nextUrl.pathname;

        if (session && (pathname.startsWith("/auth/sign-in"))) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        if (!session && (pathname.startsWith("/dashboard"))) {
            return NextResponse.redirect(
                new URL(`/auth/sign-in?callback=${pathname}`, request.url),
            );
        }

    } catch (error) {
        return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-next-pathname", request.nextUrl.pathname);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/auth/sign-in",
        "/auth/sign-up",
    ],
};