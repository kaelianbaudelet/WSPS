"use client";
import { Button } from "@/components/ui/button";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { authClient } from "@/lib/auth/auth.client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function RevokeSessionButton({ sessionToken }: { sessionToken: string }) {
    const router = useRouter();
    const [isLoading, setLoading] = useState(false);
    const revokeSession = async () => {
        await authClient.revokeSession(
            {
                token: sessionToken,
            },
            {
                onRequest: () => setLoading(true),
                onSuccess: () => {
                    setLoading(false);
                    router.refresh();
                },
                onError: (ctx) => {
                    const errorMessage = ctx.error.message;
                    console[process.env.NODE_ENV == "production" ? "error" : "log"](
                        "Error revoking session",
                        ctx.error,
                    );
                    toast.error(errorMessage || "Error revoking session.");
                    setLoading(false);
                },
            },
        );
    };
    return (
        <Button isPending={isLoading} onPress={revokeSession} intent="danger">
            {({ isPending }) => (
                <>
                    {false ? "Revoking session...." : "Revoke"}
                    {isPending && <ProgressCircle isIndeterminate aria-label="Creating..." />}
                </>
            )}
        </Button>
    );
}
