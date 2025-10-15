import { getSessions } from "@/app/actions/auth.actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { siteConfig } from "@/resources/site";
import { formatDistance } from "date-fns";
import { Laptop, Smartphone } from "lucide-react";
import { cookies } from "next/headers";
import { userAgentFromString } from "next/server";
import RevokeSessionButton from "./revoke-session-button";

export default async function ActiveSessionsCard() {
    const sessions = await getSessions();

    type BaseSession = (typeof sessions)[0];
    interface Session extends BaseSession {
        device: string | undefined;
        browser: string | undefined;
        sameDevice: boolean;
    }
    const redefinedSessions: Session[] = [];
    const betterAuthSessionCookie = (await auth.$context).authCookies.sessionToken.name;
    const authToken = (await cookies()).get(betterAuthSessionCookie)?.value;

    sessions.forEach((session) => {
        const agent = userAgentFromString(`${session.userAgent}`);
        redefinedSessions.push({
            ...session,
            sameDevice: `${authToken || "."}`.split(".")[0]?.trim() == session.token,
            device: agent.device.type || agent.os.name,
            browser: agent.browser.name,
            ipAddress: session.ipAddress,
        });
    });
    return (
        <Card>
            <Card.Header>
                <Card.Title>Active Sessions</Card.Title>
                <Card.Description>
                    Monitor devices currently logged into your account.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div className="space-y-4">
                    {(!siteConfig.demo.enabled
                        ? redefinedSessions
                        : redefinedSessions.slice(0, 2)
                    ).map((session) => (
                        <div
                            key={session.id}
                            className={
                                "bg-muted ring-2 ring-border items-center flex-wrap justify-between flex p-2 rounded-lg"
                            }
                        >
                            <div className="flex items-center gap-3">
                                <DeviceIcon device={session.device} data-slot="icon" />
                                <dl>
                                    <dt className="font-semibold text-lg">
                                        {session.device
                                            ? `${session.device} - ${session.browser}`
                                            : session.device}
                                    </dt>
                                    <dd className="flex gap-x-1">
                                        Last active:{" "}
                                        {session.sameDevice
                                            ? "Current active"
                                            : formatDistance(session.updatedAt, new Date())}
                                        <span className="hidden sm:block font-semibold">
                                            - IP: {session.ipAddress}
                                        </span>
                                    </dd>
                                    <dd className="block sm:hidden text-xs !font-bold">
                                        IP: {session.ipAddress}
                                    </dd>
                                </dl>
                            </div>
                            <div className="sm:ml-auto">
                                {session.sameDevice ? (
                                    <Badge intent="success">Active</Badge>
                                ) : (
                                    <RevokeSessionButton sessionToken={session.token} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card.Content>
        </Card>
    );
}

const DeviceIcon = ({ device }: { device: string | undefined }) => {
    let icon;
    let mobilePhoneDevices = ["mobile", "ios", "android"];
    if (mobilePhoneDevices.includes(`${device}`.toLowerCase())) {
        icon = <Smartphone className="text-fg size-8" />;
    } else {
        icon = <Laptop className="text-fg size-8" />;
    }
    return icon;
};
