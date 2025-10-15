import { Container } from "@/components/shared/container";
import { Heading } from "@/components/ui/heading";
import { Suspense } from "react";
import ActiveSessionsCard from "../components/active-sessions";
import ChangePasswordCard from "../components/change-password";

export const metadata = {
    title: "Account / Security",
};

export default async function Page() {
    return (
        <Container className="space-y-6">
            <div>
                <Heading>Account Security</Heading>
            </div>

            <ChangePasswordCard />
            <Suspense fallback={<h1>Loading Sessions</h1>}>
                <ActiveSessionsCard />
            </Suspense>
        </Container>
    );
}
