import { withApiAuth } from "@/lib/auth/api-auth";
import { User } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    return withApiAuth(request, async (req: NextRequest, { user }: { user: User }) => {
        return NextResponse.json({ message: `Hello ${user.name}, you’re successfully authenticated.` });
    });
}