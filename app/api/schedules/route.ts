
import { getAllSchedulesByUserId } from "@/app/actions/schedule.actions";
import { withApiAuth } from "@/lib/auth/api-auth";
import { User } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    return withApiAuth(
        request,
        async (req: NextRequest, { apiKey, user }: { apiKey: any; user: User }) => {

            const schedules = await getAllSchedulesByUserId(user.id)
            return NextResponse.json(schedules);
        },
        { service: "schedules", permissions: ["read"] }
    );
}