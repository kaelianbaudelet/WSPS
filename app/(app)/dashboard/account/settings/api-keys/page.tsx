import { Container } from "@/components/shared/container";
import { Description } from "@/components/ui/field";
import { Heading } from "@/components/ui/heading";
import { APIKeysSettings } from "../components/api-keys";

export const metadata = {
    title: "Clef API",
};
export const dynamic = "force-dynamic";

export default async function Page() {
    return (
        <Container className="space-y-6">
            <div className="mt-6">
                <Heading>Clefs API</Heading>
                <Description>Consultez et gérez vos clef d'API.</Description>
            </div>
            <div className="w-full">
                <APIKeysSettings />
            </div>
        </Container>
    );
}
