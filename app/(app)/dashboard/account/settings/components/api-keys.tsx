"use client";

import { createApiKey, deleteApiKey, getApiKeys } from "@/app/actions/apikey.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, CheckboxGroup } from "@/components/ui/checkbox";
import {
    Disclosure,
    DisclosureGroup,
    DisclosurePanel,
    DisclosureTrigger,
} from "@/components/ui/disclosure";
import { Description, Label } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalDescription,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from "@/components/ui/modal";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { TextField } from "@/components/ui/text-field";
import { Calendar, ClipboardCheck, ClipboardCopy, User } from "lucide-react";
import ms from "ms";
import { useEffect, useState } from "react";
import slugify from "slugify";
import { toast } from "sonner";
import { z } from "zod/v3";

interface ApiKey {
    id: string;
    name: string | null;
    start: string | null;
    prefix: string | null;
    key: string;
    userId: string;
    refillInterval: number | null;
    refillAmount: number | null;
    lastRefillAt: Date | null;
    enabled: boolean | null;
    rateLimitEnabled: boolean | null;
    rateLimitTimeWindow: number | null;
    rateLimitMax: number | null;
    requestCount: number | null;
    remaining: number | null;
    lastRequest: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    permissions: Record<string, string[]> | null;
    metadata: Record<string, any> | null;
}

const apiKeySchema = z.object({
    name: z.string().min(1, "Le nom est requis."),
    prefix: z.string().min(1, "Le préfixe est requis."),
    expiresIn: z.number().min(1, "L'expiration doit être supérieure à zéro.").nullable(),
});

const expirationOptions = [
    { label: "1 Jour", value: ms("1 day") / 1000 },
    { label: "7 Jours", value: ms("7 days") / 1000 },
    { label: "30 Jours", value: ms("30 days") / 1000 },
    { label: "60 Jours", value: ms("60 days") / 1000 },
    { label: "90 Jours", value: ms("90 days") / 1000 },
    { label: "180 Jours", value: ms("180 days") / 1000 },
    { label: "1 An", value: ms("365 days") / 1000 },
    { label: "Pas d'expiration", value: null },
];

const sections = [
    {
        key: "schedules",
        title: "Emploi du temps",
        icon: Calendar,
        availablePerms: ["read", "create", "update", "delete"],
    },

    { key: "user", title: "Compte", icon: User, availablePerms: ["read"] },
];

export function APIKeysSettings() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [open, setOpen] = useState(false);
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [generatedApiKey, setGeneratedApiKey] = useState("");
    const [inputValues, setInputValues] = useState({
        name: "",
        prefix: "",
        expiresIn: 3600,
    });
    const [permissions, setPermissions] = useState<Record<string, string[]>>(() => {
        const initialPermissions: Record<string, string[]> = {};
        sections.forEach((section) => {
            initialPermissions[section.key] = [];
        });
        return initialPermissions;
    });
    const [inputErrors, setInputErrors] = useState({
        name: "",
        prefix: "",
        expiresIn: "",
    });
    const [isLoading, setLoading] = useState(false);
    const [isFetching, setFetching] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const loadApiKeys = async () => {
            setFetching(true);
            try {
                const response = await getApiKeys();
                if (response.success && response.data) {
                    setApiKeys(
                        response.data.map((key: any) => ({
                            ...key,
                            expireAt: key.expireAt ? new Date(key.expireAt) : null,
                            expiresAt: key.expiresAt ? new Date(key.expiresAt) : null,
                            createdAt: new Date(key.createdAt),
                            updatedAt: new Date(key.updatedAt),
                            lastRefillAt: key.lastRefillAt ? new Date(key.lastRefillAt) : null,
                            lastRequest: key.lastRequest ? new Date(key.lastRequest) : null,
                        })),
                    );
                } else {
                    toast.error("Échec du chargement des clés API.");
                }
            } catch (error) {
                console.error("Erreur lors du chargement des clés API:", error);
                toast.error("Une erreur s'est produite lors du chargement des clés API.");
            } finally {
                setFetching(false);
            }
        };
        loadApiKeys();
    }, []);

    const handleChange = (field: string, value: string | number | null) => {
        if (field === "prefix") {
            value = slugify(value as string, { lower: true });
        }
        setInputValues((prev) => ({ ...prev, [field]: value }));
        setInputErrors((prev) => ({ ...prev, [field]: "" }));

        if (field === "name") {
            const slugifiedPrefix = slugify(value as string, { lower: true });
            setInputValues((prev) => ({
                ...prev,
                name: value as string,
                prefix: slugifiedPrefix,
            }));
        }
    };

    const handlePermissionChange = (sectionKey: string, newVals: string[]) => {
        setPermissions((prev) => ({
            ...prev,
            [sectionKey]: newVals,
        }));
    };

    const handleFormSubmit = async () => {
        const result = apiKeySchema.safeParse(inputValues);
        if (!result.success) {
            const errors = result.error.format();
            setInputErrors({
                name: errors.name?._errors[0] || "",
                prefix: errors.prefix?._errors[0] || "",
                expiresIn: errors.expiresIn?._errors[0] || "",
            });
            return;
        }

        setLoading(true);
        try {
            const permissionsForSubmit: Record<string, string[]> = {};
            sections.forEach((section) => {
                permissionsForSubmit[section.key] = permissions[section.key] || [];
            });

            const response = await createApiKey(
                inputValues.name,
                inputValues.expiresIn,
                inputValues.prefix.toLowerCase() + "-",
                permissionsForSubmit,
            );

            if (response.success && response.data) {
                setApiKeys([
                    ...apiKeys,
                    {
                        ...response.data,
                        expiresAt: response.data.expiresAt
                            ? new Date(response.data.expiresAt)
                            : null,
                        createdAt: new Date(response.data.createdAt),
                        updatedAt: new Date(response.data.updatedAt),
                        lastRefillAt: response.data.lastRefillAt
                            ? new Date(response.data.lastRefillAt)
                            : null,
                        lastRequest: response.data.lastRequest
                            ? new Date(response.data.lastRequest)
                            : null,
                    },
                ]);
                setGeneratedApiKey(response.data.key || "");
                setShowApiKeyModal(true);
                setOpen(false);
                setInputValues({ name: "", prefix: "", expiresIn: 3600 });
                setPermissions(() => {
                    const resetPermissions: Record<string, string[]> = {};
                    sections.forEach((section) => {
                        resetPermissions[section.key] = [];
                    });
                    return resetPermissions;
                });
            } else {
                toast.error("Échec de la création de la clé API.");
            }
        } catch (error) {
            console.error("Erreur lors de la création de la clé API:", error);
            toast.error("Une erreur s'est produite lors de la création de la clé API.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyApiKey = () => {
        navigator.clipboard.writeText(generatedApiKey);
        toast.success("Clé API copiée !");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1000);
    };

    const handleDeleteApiKey = async (apiKeyId: string) => {
        setFetching(true);
        const response = await deleteApiKey(apiKeyId);
        if (response.success) {
            setApiKeys(apiKeys.filter((key) => key.id !== apiKeyId));
            toast.success("Clé API supprimée avec succès !");
        } else {
            toast.error("Échec de la suppression de la clé API.");
        }
        setFetching(false);
    };

    const formatRateLimitWindow = (ms: number): string => {
        const seconds = ms / 1000;
        const minutes = seconds / 60;
        const hours = minutes / 60;
        const days = hours / 24;
        const months = days / 30;
        const years = months / 12;
        if (years >= 1) return "tous les ans";
        if (months >= 1) return "tous les mois";
        if (days >= 1) return "tous les jours";
        if (hours >= 1) return "toutes les heures";
        if (minutes >= 1) return "toutes les minutes";
        return "/s";
    };

    const getPermLabel = (perm: string) => {
        switch (perm) {
            case "read":
                return "Lecture";
            case "create":
                return "Écriture";
            case "update":
                return "Modification";
            case "delete":
                return "Suppression";
            default:
                return perm;
        }
    };

    const getPermDescription = (perm: string, section: any) => {
        const isSchedules = section.key === "schedules";
        const titleLower = section.title.toLowerCase();
        switch (perm) {
            case "read":
                return section.key === "user"
                    ? "Peut consulter les détails du compte."
                    : `Peut voir ${isSchedules ? "l'" : "les "}${titleLower} mais ne peut pas apporter de modifications.`;
            case "create":
                return `Peut créer ${isSchedules ? "un " : "des "}${titleLower}.`;
            case "update":
                return `Peut modifier ${isSchedules ? "l'" : "les "}${titleLower} existant${isSchedules ? "." : "s."}`;
            case "delete":
                return `Peut supprimer définitivement ${isSchedules ? "l'" : "les "}${titleLower}.`;
            default:
                return "";
        }
    };

    return (
        <Card>
            <Card.Header>
                <Card.Title>Gérer vos clés API</Card.Title>
                <Card.Description>
                    Créez, consultez et supprimez vos clés API pour accéder à nos services.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div className="mb-4">
                    <Button onPress={() => setOpen(true)}>Ajouter une clé API</Button>
                </div>
                <Modal>
                    <ModalContent isOpen={open} onOpenChange={setOpen} size="5xl">
                        <ModalHeader>
                            <ModalTitle>Créer une clé API</ModalTitle>
                            <ModalDescription>
                                Entrez les détails pour créer une nouvelle clé API.
                            </ModalDescription>
                        </ModalHeader>
                        <ModalBody>
                            <Form className="flex flex-col gap-4">
                                <TextField
                                    label="Nom"
                                    aria-label="Nom"
                                    placeholder="Entrez le nom"
                                    value={inputValues.name}
                                    onChange={(value) => handleChange("name", value)}
                                    isInvalid={!!inputErrors.name}
                                    errorMessage={inputErrors.name}
                                />
                                <TextField
                                    label="Préfixe"
                                    aria-label="Préfixe"
                                    placeholder="Entrez le préfixe"
                                    value={inputValues.prefix}
                                    onChange={(value) => handleChange("prefix", value)}
                                    isInvalid={!!inputErrors.prefix}
                                    errorMessage={inputErrors.prefix}
                                />
                                <Select
                                    label="Expiration"
                                    aria-label="Expiration"
                                    placeholder="Sélectionnez l'expiration"
                                    onSelectionChange={(value) => {
                                        const selectedOption = expirationOptions.find(
                                            (option) => option.value?.toString() === value,
                                        );
                                        handleChange("expiresIn", selectedOption?.value ?? null);
                                    }}
                                    selectedKey={inputValues.expiresIn?.toString() || ""}
                                >
                                    <SelectTrigger />
                                    <SelectContent items={expirationOptions}>
                                        {(item) => (
                                            <SelectItem
                                                id={item.value?.toString() || ""}
                                                textValue={item.label}
                                            >
                                                {item.label}
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                {inputErrors.expiresIn && (
                                    <div className="text-red-500 text-sm">
                                        {inputErrors.expiresIn}
                                    </div>
                                )}

                                <Label>Permissions</Label>
                                <DisclosureGroup
                                    className="rounded-xl border **:data-[slot=disclosure]:last:border-b-0"
                                    defaultExpandedKeys={sections.map((_, i) => i)}
                                >
                                    {sections.map((section, index) => {
                                        const sectionPerms = permissions[section.key] || [];
                                        const permOptions = section.availablePerms.map(
                                            (perm: string) => ({
                                                value: perm,
                                                label: getPermLabel(perm),
                                                description: getPermDescription(perm, section),
                                            }),
                                        );

                                        return (
                                            <Disclosure key={index} id={index}>
                                                <DisclosureTrigger className="px-4">
                                                    <section.icon
                                                        data-slot="icon"
                                                        className="size-4"
                                                    />{" "}
                                                    {section.title}
                                                </DisclosureTrigger>
                                                <DisclosurePanel>
                                                    <CheckboxGroup
                                                        className="pb-4 px-4"
                                                        value={sectionPerms}
                                                        onChange={(vals) =>
                                                            handlePermissionChange(
                                                                section.key,
                                                                vals,
                                                            )
                                                        }
                                                    >
                                                        <Label>
                                                            Contrôle des accès pour {section.title}
                                                        </Label>
                                                        <Description>
                                                            Sélectionnez les permissions pour{" "}
                                                            {section.title.toLowerCase()}
                                                        </Description>
                                                        {permOptions.map((opt) => (
                                                            <Checkbox
                                                                key={opt.value}
                                                                value={opt.value}
                                                            >
                                                                <Label>{opt.label}</Label>
                                                                <Description>
                                                                    {opt.description}
                                                                </Description>
                                                            </Checkbox>
                                                        ))}
                                                    </CheckboxGroup>
                                                </DisclosurePanel>
                                            </Disclosure>
                                        );
                                    })}
                                </DisclosureGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button onClick={handleFormSubmit} isPending={isLoading}>
                                {({ isPending }) => (
                                    <>
                                        {isPending ? (
                                            <>
                                                <ProgressCircle
                                                    isIndeterminate
                                                    aria-label="Création en cours"
                                                />
                                                Création en cours
                                            </>
                                        ) : (
                                            "Créer"
                                        )}
                                    </>
                                )}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                <Modal>
                    <ModalContent isOpen={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
                        <ModalHeader>
                            <ModalTitle>Clé API générée avec succès</ModalTitle>
                            <ModalDescription>
                                Veuillez copier cette clé API, elle ne sera pas réaffichée. Veuillez
                                la stocker en lieu sûr.
                            </ModalDescription>
                        </ModalHeader>
                        <ModalBody className="flex items-center gap-4">
                            <TextField
                                label="Votre clé API"
                                value={generatedApiKey}
                                className="flex-1 w-full py-4"
                                suffix={
                                    <Button
                                        aria-label="Copier la clé API"
                                        size="sm"
                                        onPress={handleCopyApiKey}
                                        intent="primary"
                                    >
                                        {isCopied ? (
                                            <ClipboardCheck data-slot="icon" />
                                        ) : (
                                            <ClipboardCopy data-slot="icon" />
                                        )}
                                        Copier
                                    </Button>
                                }
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button onPress={() => setShowApiKeyModal(false)}>
                                J'ai copié la clé
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {isFetching ? (
                    <div className="flex justify-center items-center">
                        <ProgressCircle isIndeterminate aria-label="Chargement des clés API" />
                        Chargement des clés API...
                    </div>
                ) : (
                    <Table aria-label="Clés API">
                        <TableHeader>
                            <TableColumn isRowHeader>Nom</TableColumn>
                            <TableColumn>Clef secrète</TableColumn>
                            <TableColumn>Statut</TableColumn>

                            <TableColumn>Actions</TableColumn>
                        </TableHeader>
                        <TableBody items={apiKeys}>
                            {(key) => {
                                const isExpired = key.expiresAt && key.expiresAt < new Date();
                                const isQuotaExceeded =
                                    key.rateLimitEnabled &&
                                    key.requestCount &&
                                    key.requestCount >= (key.rateLimitMax || 0);
                                const status = isExpired
                                    ? "Expiré"
                                    : isQuotaExceeded
                                      ? "Désactivé temporairement"
                                      : "Actif";
                                const displayPrefix =
                                    key.prefix && key.prefix.length > 10
                                        ? `${key.prefix.substring(0, 10)}-`
                                        : `${key.prefix}`;

                                return (
                                    <TableRow key={key.id}>
                                        <TableCell>{key.name || "N/A"}</TableCell>
                                        <TableCell>
                                            <code>{displayPrefix}*****</code>
                                        </TableCell>
                                        <TableCell>{status}</TableCell>

                                        <TableCell>
                                            <Button
                                                intent="danger"
                                                size="sm"
                                                onPress={() => handleDeleteApiKey(key.id)}
                                            >
                                                Supprimer
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            }}
                        </TableBody>
                    </Table>
                )}
            </Card.Content>
        </Card>
    );
}
