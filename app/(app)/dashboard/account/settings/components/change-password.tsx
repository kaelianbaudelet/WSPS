"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { TextField } from "@/components/ui/text-field";

import { authClient } from "@/lib/auth/auth.client";
import { useForm } from "@/lib/utils/hooks/use-form";
import { toast } from "sonner";
import { z } from "zod/v3";

const formSchema = z
    .object({
        currentPassword: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères"),
        newPassword: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères"),
    })
    .superRefine(({ newPassword, currentPassword }, ctx) => {
        if (currentPassword === newPassword) {
            ctx.addIssue({
                code: "custom",
                message: "Le nouveau mot de passe doit être différent de l'ancien mot de passe",
                path: ["newPassword"],
            });
        }
    });

export default function ChangePasswordCard() {
    const { inputValues, inputErrors, handleChange, setError, handleSubmit, isLoading } = useForm({
        schema: formSchema,
        initialValues: { currentPassword: "", newPassword: "" },
    });
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        await authClient
            .changePassword(
                {
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword,
                },
                {
                    onSuccess: (ctx) => {
                        toast.success("Votre mot de passe a été mis à jour.");
                    },
                    onError: (ctx) => {
                        const errorMessage = ctx.error.message;
                        console[process.env.NODE_ENV == "production" ? "error" : "log"](
                            errorMessage,
                        );
                        setError("currentPassword", errorMessage);
                    },
                },
            )
            .catch((e) => e);
    };
    return (
        <Card>
            <Card.Header>
                <Card.Title>Mettre à jour le mot de passe</Card.Title>
                <Card.Description>
                    Assurez-vous que votre compte utilise un mot de passe long et aléatoire pour
                    rester sécurisé.
                </Card.Description>
            </Card.Header>
            <Form validationErrors={inputErrors} onSubmit={handleSubmit(onSubmit)}>
                <Card.Content className="flex flex-col">
                    <div className="w-full xl:flex [&>div]:w-full xl:max-w-[60%] gap-6">
                        <TextField
                            errorMessage={inputErrors.currentPassword}
                            value={inputValues.currentPassword}
                            onChange={(v) => handleChange("currentPassword", v)}
                            label="Mot de passe actuel"
                            type="password"
                            isRevealable
                        />
                        <TextField
                            errorMessage={inputErrors.newPassword}
                            value={inputValues.newPassword}
                            onChange={(v) => handleChange("newPassword", v)}
                            label="Nouveau mot de passe"
                            type="password"
                            isRevealable
                        />
                    </div>
                </Card.Content>
                <Card.Footer className="flex flex-wrap gap-x-4 gap-y-2 md:gap-y-0  justify-between">
                    <Button type="submit" isPending={isLoading} className={"w-fit"}>
                        Mettre à jour le mot de passe
                    </Button>
                </Card.Footer>
            </Form>
        </Card>
    );
}
