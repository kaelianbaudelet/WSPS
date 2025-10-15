import { WSPSLogo } from "@/components/logos";
import { Heading } from "@/components/ui/heading";
import { Metadata } from "next";
import SignInForm from "../components/sign-in-form";

export const metadata: Metadata = {
    title: "Connexion",
};

export default async function Page(props: { searchParams: Promise<{ callback: string }> }) {
    const { callback } = await props.searchParams;
    return (
        <div className="space-y-8 w-full max-w-md mx-auto">
            <div className="text-center flex flex-col justify-center items-center">
                <WSPSLogo className="h-16 mb-6" />
                <Heading level={1} className="mb-1">
                    Connectez-vous à votre compte
                </Heading>
                <p>Connectez-vous pour accéder à votre compte</p>
            </div>
            <div className="space-y-4">
                <SignInForm callbackURL={callback} />
            </div>
        </div>
    );
}
