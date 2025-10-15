import { Container } from "@/components/shared/container";
import { Description } from "@/components/ui/field";
import { Heading } from "@/components/ui/heading";
import DashboardCard from "./components/dashboard-card";

export const metadata = {
    title: "Accueil",
};
export const dynamic = "force-dynamic";

export default async function Page() {
    return (
        <Container className="space-y-6">
            <div className="mt-6">
                <Heading>Accueil</Heading>
                <Description>Bienvenue sur WSPS</Description>
            </div>
            <div className="w-full">
                <DashboardCard />
            </div>
        </Container>
    );
}
