import { getAuth } from "@/app/actions/auth.actions";
import { Container } from "@/components/shared/container";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Note } from "@/components/ui/note";
import { Separator } from "@/components/ui/separator";

import { Description } from "@/components/ui/field";
import { NonNullableAuth } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import DisplayNameForm from "./components/display-name";
import EmailAddressForm from "./components/email-address";

export const metadata = {
    title: "Compte / Paramètres",
};
export const dynamic = "force-dynamic";

export default async function Page() {
    const session = (await getAuth()) as NonNullableAuth;
    return (
        <Container className="space-y-6">
            <div className="mt-6">
                <Heading>Emplois du temps</Heading>
                <Description>Consultez et gérez vos emplois du temps</Description>
            </div>
            <DisplayNameForm user={session?.user} />
            <EmailAddressForm user={session?.user} />
            <Card>
                <Card.Header>
                    <Card.Title>Informations du Compte</Card.Title>
                    <Card.Description>Visualisez les informations de votre compte</Card.Description>
                </Card.Header>
                <Card.Content>
                    <div className="space-y-4">
                        <div className="flex sm:flex-row flex-col  space-y-2 sm:space-y-0">
                            <dl>
                                <dt className="font-semibold text-sm">ID du Compte</dt>
                                <dd className="text-xs">Votre identifiant unique de compte</dd>
                            </dl>
                            <div className="sm:ml-auto">
                                <Note className="w-fit py-2 flex items-center px-4">
                                    {session.user.id}
                                </Note>
                            </div>
                        </div>
                        <Separator className="sm:max-w-[90%] mx-auto" />
                        <div className="flex sm:flex-row flex-col space-y-2 sm:space-y-0">
                            <dl>
                                <dt className="font-semibold text-sm">Membre Depuis</dt>
                                <dd className="text-xs">Date de création du compte</dd>
                            </dl>
                            <div className="sm:ml-auto">
                                <Note className="w-fit py-2 px-4 flex items-center">
                                    {format(session.user.createdAt, "dd MMMM yyyy", { locale: fr })}
                                </Note>
                            </div>
                        </div>
                    </div>
                </Card.Content>
            </Card>
        </Container>
    );
}
