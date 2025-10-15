import { Container } from "@/components/shared/container";
import { Description } from "@/components/ui/field";
import { Heading } from "@/components/ui/heading";
import { SchedulesCard } from "./components/schedules-card";

export const metadata = {
    title: "Emploi du temps",
};
export const dynamic = "force-dynamic";

export default async function Page() {
    return (
        <Container className="space-y-6">
            <div className="mt-6">
                <Heading>Emplois du temps</Heading>
                <Description>Consultez et gérez vos emplois du temps</Description>
            </div>
            <div className="w-full">
                <SchedulesCard />
            </div>
        </Container>
    );
}
