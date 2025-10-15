"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { TextField } from "@/components/ui/text-field";
import { authClient } from "@/lib/auth/auth.client";
import { useForm } from "@/lib/utils/hooks/use-form";
import { User } from "better-auth";
import { toast } from "sonner";
import { z } from "zod/v3";

const formSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 3 caractères"),
});

export default function DisplayNameForm({ user }: { user: User }) {
    const { inputValues, inputErrors, handleChange, setError, handleSubmit, isLoading } = useForm({
        schema: formSchema,
        initialValues: { name: user.name },
    });
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        await authClient
            .updateUser(
                { name: data.name },
                {
                    onSuccess: (ctx) => {
                        toast.success("Nom mis à jour avec succès");
                    },
                    onError: (ctx) => {
                        const errorMessage = ctx.error.message;
                        console[process.env.NODE_ENV == "production" ? "error" : "log"](
                            errorMessage,
                        );
                        setError("name", errorMessage);
                    },
                },
            )
            .catch((e) => e);
    };
    return (
        <Card>
            <Card.Header>
                <Card.Title>Nom d'affichage</Card.Title>
                <Card.Description>
                    Veuillez entrer votre nom complet ou un nom d'affichage
                </Card.Description>
            </Card.Header>
            <Form
                validationErrors={inputErrors}
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
            >
                <Card.Content className="flex sm:flex-row flex-col gap-6">
                    <TextField
                        name="name"
                        isRequired
                        label="Nom"
                        className="w-full"
                        errorMessage={inputErrors.name}
                        value={inputValues.name}
                        placeholder="Enter your name"
                        onChange={(v) => handleChange("name", v)}
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
