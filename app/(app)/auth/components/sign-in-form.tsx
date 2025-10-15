"use client";

import { Button } from "@/components/ui/button";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { TextField } from "@/components/ui/text-field";

import { Form } from "@/components/ui/form";
import { Link } from "@/components/ui/link";
import { authClient } from "@/lib/auth/auth.client";
import { useForm } from "@/lib/utils/hooks/use-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod/v3";

const signInSchema = z.object({
    email: z.string().email("Adresse email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
});

export default function SignInForm({ callbackURL = "/dashboard" }: { callbackURL?: string }) {
    const router = useRouter();

    const { inputValues, inputErrors, handleChange, setError, handleSubmit, isLoading } = useForm({
        schema: signInSchema,
        initialValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: typeof inputValues) => {
        await authClient.signIn.email(
            {
                email: data.email,
                password: data.password,
            },
            {
                onError: (ctx: { error: { message: string } }) => {
                    setError("email", "Email ou mot de passe incorrect");
                },
                onSuccess: (ctx) => {
                    toast.success("Vous avez été connecté avec succès !");
                    router.push(callbackURL);
                },
            },
        );
    };

    return (
        <>
            <Form
                validationErrors={inputErrors}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-3 w-full"
            >
                <TextField
                    type="text"
                    label="Adresse email"
                    value={inputValues.email}
                    errorMessage={inputErrors.email}
                    autoComplete="email"
                    placeholder="Entrez votre adresse email"
                    onChange={(v) => {
                        handleChange("email", v);
                    }}
                />
                <TextField
                    type="password"
                    label="Mot de passe"
                    value={inputValues.password}
                    errorMessage={inputErrors.password}
                    autoComplete="current-password"
                    placeholder="Entrez votre mot de passe"
                    isRevealable
                    onChange={(v) => handleChange("password", v)}
                />
                <div className="text-center mt-6 text-sm">
                    Pas encore de compte ?{" "}
                    <Link
                        isDisabled={isLoading}
                        href={`/auth/sign-up${callbackURL ? `?callback=${encodeURIComponent(callbackURL)}` : ""}`}
                        className="underline underline-offset-2 text-muted-fg cursor-pointer"
                    >
                        Créer un compte
                    </Link>
                </div>
                <Button
                    isDisabled={isLoading}
                    isPending={isLoading}
                    className="w-full mt-4"
                    type="submit"
                >
                    {({ isPending }) => (
                        <>
                            {isPending && (
                                <ProgressCircle
                                    isIndeterminate
                                    aria-label="Connexion en cours..."
                                />
                            )}
                            {isLoading ? "Connexion en cours..." : "Se connecter"}
                        </>
                    )}
                </Button>
            </Form>
        </>
    );
}
