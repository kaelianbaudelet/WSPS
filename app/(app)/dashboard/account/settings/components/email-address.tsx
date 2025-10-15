"use client";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { authClient } from "@/lib/auth/auth.client";
import { useForm } from "@/lib/utils/hooks/use-form";
import { User } from "better-auth";
import { toast } from "sonner";
import { z } from "zod/v3";

const formSchema = z.object({
    email: z.string().email("L'adresse email n'est pas valide"),
});

export default function EmailAddressForm({ user }: { user: User }) {
    const { inputValues, inputErrors, handleChange, setError, handleSubmit, isLoading } = useForm({
        schema: formSchema,
        initialValues: { email: user.email },
    });
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        await authClient
            .changeEmail(
                { newEmail: data.email },
                {
                    onSuccess: (ctx) => {
                        toast.success("Email mis à jour avec succès");
                    },
                    onError: (ctx) => {
                        const errorMessage = ctx.error.message;
                        console[process.env.NODE_ENV == "production" ? "error" : "log"](
                            errorMessage,
                        );
                        setError("email", errorMessage);
                    },
                },
            )
            .catch((e) => e);
    };
    return (
        <Card>
            <Card.Header>
                <Card.Title>Adresse Email</Card.Title>
                <Card.Description>
                    Mettez à jour l'adresse email associée à votre compte.
                </Card.Description>
            </Card.Header>
            <Form
                validationErrors={inputErrors}
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
            >
                <Card.Content className="flex sm:flex-row flex-col gap-6">
                    <TextField
                        type="email"
                        label="Adresse email"
                        value={inputValues.email}
                        errorMessage={inputErrors.email}
                        isRequired
                        className="w-full"
                        placeholder="Entrez votre adresse email"
                        onChange={(v) => handleChange("email", v)}
                    />
                </Card.Content>
                <Card.Footer className="flex flex-wrap gap-x-4 gap-y-2 md:gap-y-0  justify-between">
                    <Button isPending={isLoading} intent="primary" className="w-full" type="submit">
                        {({ isPending }) => (
                            <>
                                {isPending && (
                                    <ProgressCircle
                                        isIndeterminate
                                        aria-label="Enregistrement en cours..."
                                    />
                                )}
                                {isLoading ? "Enregistrement en cours..." : "Enregistrer"}
                            </>
                        )}
                    </Button>
                </Card.Footer>
            </Form>
        </Card>
    );
}
