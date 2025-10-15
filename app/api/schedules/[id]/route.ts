import { getScheduleByIdAndByUserId } from "@/app/actions/schedule.actions";
import { withApiAuth } from "@/lib/auth/api-auth";
import { User } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    return withApiAuth(
        request,
        async (req: NextRequest, { apiKey, user }: { apiKey: any; user: User }) => {
            const versionParam = req.nextUrl.searchParams.get("version");
            const version = versionParam ? parseInt(versionParam, 10) : undefined;
            const { id: scheduleId } = params; // Use resolved params
            const scheduleResponse = await getScheduleByIdAndByUserId(
                scheduleId,
                user.id,
                version
            );

            if (!scheduleResponse.success) {
                return NextResponse.json(
                    { error: scheduleResponse.message || "Failed to retrieve schedule." },
                    { status: 404 }
                );
            }

            return NextResponse.json(scheduleResponse.data);
        }
    );
}