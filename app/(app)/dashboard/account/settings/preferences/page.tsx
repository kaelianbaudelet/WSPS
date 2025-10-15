import { Container } from "@/components/shared/container";
import { Heading } from "@/components/ui/heading";
import { Suspense } from "react";
import ThemeSelectors from "../components/theme-selectors";

export const metadata = {
    title: "Personalization",
};
export default function Page() {
    return (
        <Container className="space-y-6">
            <div>
                <Heading>Préférences</Heading>
                Gérez vos paramètres de personnalisation.
            </div>
            <div className="max-w-2xl">
                <Suspense fallback={<div>Chargement...</div>}>
                    <ThemeSelectors />
                </Suspense>
            </div>
        </Container>
    );
}
