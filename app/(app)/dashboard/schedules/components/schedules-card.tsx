"use client";
import {
    createSchedule,
    deleteScheduleById,
    getAllSchedules,
    updateScheduleById,
} from "@/app/actions/schedule.actions";
import { getSchools } from "@/app/actions/schools.actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { ListBox } from "@/components/ui/list-box";
import { Loader } from "@/components/ui/loader";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import {
    Modal,
    ModalBody,
    ModalClose,
    ModalContent,
    ModalDescription,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from "@/components/ui/modal";
import { SearchField } from "@/components/ui/search-field";
import {
    Select,
    SelectItem,
    SelectLabel,
    SelectSection,
    SelectTrigger,
} from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { TextField } from "@/components/ui/text-field";
import { useSearch } from "@/lib/utils/hooks/use-search";
import { IconDotsVertical } from "@intentui/icons";
import { SyncInterval } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarCheck2Icon, CalendarXIcon } from "lucide-react";
import { useState } from "react";
import { Autocomplete, Popover, useFilter } from "react-aria-components";

interface School {
    id: number;
    logo: string;
    name: string;
    loginServer: string;
    scheduleServer: string;
    groupId: number;
    group: SchoolGroup;
}

interface SchoolGroup {
    id: number;
    name: string;
}

interface GroupedSchool {
    id: number;
    name: string;
    schools: School[];
}

interface Event {
    id: string;
    hash: string;
    title: string;
    instructor: string | null;
    program: string | null;
    startTime: Date;
    endTime: Date;
    duration: number | null;
    weekDay: string | null;
    classroom: string | null;
    campus: string | null;
    deliveryMode: string;
    color: string | null;
    classGroup: string | null;
}

interface ScheduleVersion {
    id: string;
    versionNumber: number;
    scheduleId: string;
    createdAt: Date;
    notes: string | null;
    eventVersions: { event: Event }[];
}

interface Schedule {
    id: string;
    name: string;
    syncInterval: SyncInterval;
    createdAt: Date;
    updatedAt: Date;
    schoolId: number;
    userId: string;
    payload: string;
    versions: ScheduleVersion[];
    events: Event[];
}

export function SchedulesCard() {
    const [step, setStep] = useState(1);
    const [agree, setAgree] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"create" | "edit" | "delete" | "view">("create");
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
    const [scheduleName, setScheduleName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [schoolId, setSchoolId] = useState<number | null>(null);
    const [syncInterval, setSyncInterval] = useState<SyncInterval | null>(null);

    const { data: schoolsResult, isLoading: schoolsLoading } = useSearch({
        queryFn: async () => getSchools(),
        queryKey: "schools",
        enabled: true,
    });

    const {
        data: schedulesResult,
        isLoading: schedulesLoading,
        refetch: refetchSchedules,
    } = useSearch({
        queryFn: async () => getAllSchedules(),
        queryKey: "schedules",
        enabled: true,
    });

    const schools: School[] =
        schoolsResult?.success && schoolsResult.data ? schoolsResult.data : [];
    const schedulesList: Schedule[] =
        schedulesResult?.success && schedulesResult.data ? schedulesResult.data : [];
    const { contains } = useFilter({ sensitivity: "base" });

    if (schoolsLoading || schedulesLoading) {
        return (
            <div className="mx-auto flex gap-4 text-sm font-semibold justify-center items-center">
                <Loader className="mx-auto my-8 size-6" />
                <span>
                    Un instant, vos emplois du temps sont en cours de récupération dans la base de
                    données…
                </span>
            </div>
        );
    }

    if (!schools || schools.length === 0) {
        return <div>Une erreur s'est produite.</div>;
    }

    const uniqueSchools = Array.from(
        new Map(schools.map((school) => [school.id, school])).values(),
    );

    const groupedSchools: GroupedSchool[] = uniqueSchools.reduce((acc: GroupedSchool[], school) => {
        const group = acc.find((g) => g.id === school.group.id);
        if (group) {
            group.schools.push(school);
        } else {
            acc.push({
                id: school.group.id,
                name: school.group.name,
                schools: [school],
            });
        }
        return acc;
    }, []);

    const openModal = (type: "create" | "edit" | "delete" | "view", sch?: Schedule) => {
        setModalType(type);
        setSelectedSchedule(sch || null);
        if (type === "create") {
            setStep(1);
            setAgree(false);
            setSchedule(null);
            setErrorMessage(null);
            setScheduleName("");
            setUsername("");
            setPassword("");
            setSchoolId(null);
            setSyncInterval(null);
        } else if (type === "edit" && sch) {
            setStep(2);
            setScheduleName(sch.name);
            setSyncInterval(sch.syncInterval);
        }
        setIsModalOpen(true);
    };

    const handleCreateClick = async () => {
        setIsLoading(true);
        setStep(3);
        const result = await createSchedule({
            name: scheduleName,
            schoolId: schoolId!,
            username,
            password,
            syncInterval: syncInterval!,
        });
        setIsLoading(false);
        if (result.success && result.data) {
            setSchedule({
                ...result.data,
                createdAt: new Date(result.data.createdAt),
                updatedAt: new Date(result.data.updatedAt),
                versions: [], // Initialize versions as empty array
                events: [], // Initialize events as empty array
            });
            setErrorMessage(null);
            refetchSchedules();
        } else {
            setSchedule(null);
            setErrorMessage(
                result.message ||
                    "Une erreur est survenue lors de la récupération de votre emploi du temps.",
            );
        }
    };

    const handleEdit = async () => {
        if (selectedSchedule) {
            const result = await updateScheduleById(selectedSchedule.id, {
                name: scheduleName,
                syncInterval: syncInterval!,
            });
            if (result.success) {
                refetchSchedules();
                setIsModalOpen(false);
            }
        }
    };

    const handleDelete = async () => {
        if (selectedSchedule) {
            const result = await deleteScheduleById(selectedSchedule.id);
            if (result.success) {
                refetchSchedules();
                setIsModalOpen(false);
            }
        }
    };

    const syncIntervalTranslations: Record<SyncInterval, string> = {
        min15: "Toutes les 15 minutes",
        min30: "Toutes les 30 minutes",
        hour1: "Toutes les heures",
        hour3: "Toutes les 3 heures",
        hour6: "Toutes les 6 heures",
        hour12: "Deux fois par jour (toutes les 12h)",
        daily: "Une fois par jour",
        weekly: "Toutes les semaines",
        biweekly: "Toutes les 2 semaines",
        monthly: "Tous les mois",
    };

    return (
        <div className="rounded-lg border p-4">
            <Button onClick={() => openModal("create")}>Créer un nouvel emploi du temps</Button>
            <Table aria-label="Schedules">
                <Table.Header>
                    <Table.Column isRowHeader>Nom</Table.Column>
                    <Table.Column>Interval de récupération</Table.Column>
                    <Table.Column>Date de création</Table.Column>
                    <Table.Column>Dernière récupération réussite</Table.Column>
                    <Table.Column>Ecole</Table.Column>
                    <Table.Column />
                </Table.Header>
                <Table.Body items={schedulesList}>
                    {(item) => {
                        const school = uniqueSchools.find((school) => school.id === item.schoolId);
                        return (
                            <Table.Row id={item.id}>
                                <Table.Cell>{item.name}</Table.Cell>
                                <Table.Cell>
                                    {syncIntervalTranslations[item.syncInterval]}
                                </Table.Cell>
                                <Table.Cell>
                                    {format(new Date(item.createdAt), "PPPPp", { locale: fr })}
                                </Table.Cell>
                                <Table.Cell>
                                    {item.versions[0]?.createdAt
                                        ? format(new Date(item.versions[0].createdAt), "PPPPp", {
                                              locale: fr,
                                          })
                                        : "N/A"}
                                </Table.Cell>
                                <Table.Cell>
                                    {school && (
                                        <div className="flex items-center">
                                            <Avatar
                                                src={school.logo}
                                                isSquare={true}
                                                size="xs"
                                                className="mr-2 bg-sky-500 border-0 dark:bg-bg rounded [&>*]:aspect-square [&>*]:object-contain [&>*]:rounded"
                                            />
                                            <span>{school.name}</span>
                                        </div>
                                    )}
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex justify-end">
                                        <Menu>
                                            <MenuTrigger className="size-6">
                                                <IconDotsVertical />
                                            </MenuTrigger>
                                            <MenuContent aria-label="Actions" placement="left top">
                                                <MenuItem onClick={() => openModal("view", item)}>
                                                    Consulter
                                                </MenuItem>
                                                <MenuItem onClick={() => openModal("edit", item)}>
                                                    Modifier
                                                </MenuItem>
                                                <MenuSeparator />
                                                <MenuItem
                                                    isDanger
                                                    onClick={() => openModal("delete", item)}
                                                >
                                                    Supprimer
                                                </MenuItem>
                                            </MenuContent>
                                        </Menu>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        );
                    }}
                </Table.Body>
            </Table>
            <Modal>
                <ModalContent
                    size="xl"
                    isOpen={isModalOpen}
                    onOpenChange={() => {
                        setIsModalOpen(false);
                    }}
                    role={modalType === "delete" ? "alertdialog" : "dialog"}
                >
                    {({ close }) => (
                        <>
                            {modalType === "delete" && selectedSchedule ? (
                                <>
                                    <ModalHeader>
                                        <ModalTitle>Supprimer l'emploi du temps ?</ModalTitle>
                                        <ModalDescription>
                                            Cette action est irréversible.
                                        </ModalDescription>
                                    </ModalHeader>
                                    <ModalFooter>
                                        <ModalClose>Annuler</ModalClose>
                                        <Button onPress={handleDelete} intent="danger">
                                            Supprimer
                                        </Button>
                                    </ModalFooter>
                                </>
                            ) : modalType === "view" && selectedSchedule ? (
                                <>
                                    <ModalHeader>
                                        <ModalTitle>Consulter l'emploi du temps</ModalTitle>
                                    </ModalHeader>
                                    <ModalBody>
                                        <pre>
                                            <code>{JSON.stringify(selectedSchedule, null, 2)}</code>
                                        </pre>
                                    </ModalBody>
                                    <ModalFooter>
                                        <ModalClose>Fermer</ModalClose>
                                    </ModalFooter>
                                </>
                            ) : modalType === "edit" && selectedSchedule ? (
                                <>
                                    <ModalHeader>
                                        <ModalTitle>Modifier un Emploi du temps</ModalTitle>
                                        <ModalDescription>
                                            Modifier l'emploi du temps synchronisé.
                                        </ModalDescription>
                                    </ModalHeader>
                                    <ModalBody className="space-y-6">
                                        <TextField
                                            autoFocus
                                            aria-label="Nom de l'emploi du temps"
                                            label="Nom de l'emploi du temps"
                                            type="text"
                                            placeholder="Nom de l'emploi du temps"
                                            value={scheduleName}
                                            onChange={setScheduleName}
                                        />

                                        <Select
                                            label="Intervalle de collecte"
                                            aria-label="Intervalle de collecte"
                                            placeholder="Choisir l'intervalle de collecte"
                                            selectedKey={syncInterval}
                                            onSelectionChange={(key) =>
                                                setSyncInterval(key as SyncInterval)
                                            }
                                        >
                                            <SelectTrigger />
                                            <Popover className="entering:fade-in exiting:fade-out flex max-h-80 w-(--trigger-width) entering:animate-in exiting:animate-out flex-col overflow-hidden rounded-lg border bg-overlay">
                                                <ListBox>
                                                    {/*
                                                    <SelectItem id="min15">
                                                        Toutes les 15 minutes
                                                    </SelectItem>
                                                    <SelectItem id="min30">
                                                        Toutes les 30 minutes
                                                    </SelectItem>
                                                    <SelectItem id="hour1">
                                                        Toutes les heures
                                                    </SelectItem>
                                                    */}
                                                    <SelectItem id="hour3">
                                                        Toutes les 3 heures
                                                    </SelectItem>
                                                    <SelectItem id="hour6">
                                                        Toutes les 6 heures
                                                    </SelectItem>
                                                    <SelectItem id="hour12">
                                                        Deux fois par jour (toutes les 12h)
                                                    </SelectItem>
                                                    <SelectItem id="daily">
                                                        Une fois par jour
                                                    </SelectItem>
                                                    <SelectItem id="weekly">
                                                        Toutes les semaines
                                                    </SelectItem>
                                                    <SelectItem id="biweekly">
                                                        Toutes les 2 semaines
                                                    </SelectItem>
                                                    <SelectItem id="monthly">
                                                        Tous les mois
                                                    </SelectItem>
                                                </ListBox>
                                            </Popover>
                                        </Select>
                                    </ModalBody>
                                    <ModalFooter>
                                        <ModalClose>Annuler</ModalClose>
                                        <Button onPress={handleEdit} intent="primary">
                                            Modifier
                                        </Button>
                                    </ModalFooter>
                                </>
                            ) : (
                                <>
                                    {step === 1 && (
                                        <>
                                            <ModalHeader>
                                                <ModalTitle>Avertissement</ModalTitle>
                                            </ModalHeader>
                                            <ModalBody className="space-y-6">
                                                <div className="rounded-2xl bg-bg border p-4 text-sm text-muted-fg space-y-4">
                                                    <p>
                                                        En utilisant Wigor Schedule Provisioning
                                                        Server (WSPS), vous reconnaissez
                                                        expressément que l’utilisation de ce service
                                                        se fait sous votre seule et entière
                                                        responsabilité. WSPS est fourni « tel quel »
                                                        et n’est pas une méthode officielle de
                                                        collecte d’emploi du temps validée par les
                                                        établissements. L’utilisation de WSPS peut,
                                                        selon la politique de l’établissement
                                                        concerné, être contraire aux conditions
                                                        d’accès du site tiers et entraîner des
                                                        conséquences pour l’utilisateur.
                                                    </p>
                                                    <p>
                                                        L’utilisation de ce service nécessite vos
                                                        identifiants personnels de votre
                                                        établissement de formation. Ces identifiants
                                                        ne sont utilisés qu’à des fins de
                                                        synchronisation de votre emploi du temps.
                                                    </p>
                                                    <p>
                                                        En utilisant ce service, vous reconnaissez :
                                                    </p>
                                                    <ul className="list-disc list-inside space-y-2">
                                                        <li>
                                                            être autorisé à accéder au service de
                                                            votre établissement,
                                                        </li>
                                                        <li>
                                                            utiliser l’outil dans le respect des
                                                            conditions d’utilisation de votre école,
                                                        </li>
                                                        <li>
                                                            que WSPS ainsi que son créateur ne
                                                            peuvent être tenus responsables d’un
                                                            usage contraire à ces conditions.
                                                        </li>
                                                    </ul>
                                                </div>
                                                <Checkbox
                                                    isSelected={agree}
                                                    onChange={setAgree}
                                                    label="J'accepte les conditions ci-dessus"
                                                />
                                            </ModalBody>
                                            <ModalFooter>
                                                <ModalClose>Annuler</ModalClose>
                                                <Button
                                                    onPress={() => setStep(2)}
                                                    isDisabled={!agree}
                                                    intent="primary"
                                                >
                                                    Suivant
                                                </Button>
                                            </ModalFooter>
                                        </>
                                    )}
                                    {step === 2 && (
                                        <>
                                            <ModalHeader>
                                                <ModalTitle>Créer un Emploi du temps</ModalTitle>
                                                <ModalDescription>
                                                    Générer un emploi du temps synchronisé
                                                    automatiquement avec celui de l’école.
                                                </ModalDescription>
                                            </ModalHeader>
                                            <ModalBody className="space-y-6">
                                                <TextField
                                                    autoFocus
                                                    aria-label="Nom de l'emploi du temps"
                                                    label="Nom de l'emploi du temps"
                                                    type="text"
                                                    placeholder="Nom de l'emploi du temps"
                                                    value={scheduleName}
                                                    onChange={setScheduleName}
                                                />
                                                <TextField
                                                    aria-label="Nom d'utilisateur"
                                                    label="Nom d'utilisateur"
                                                    type="text"
                                                    placeholder="Nom d'utilisateur"
                                                    value={username}
                                                    onChange={setUsername}
                                                />
                                                <TextField
                                                    label="Mot de passe"
                                                    aria-label="Mot de passe"
                                                    type="password"
                                                    placeholder="Mot de passe"
                                                    value={password}
                                                    onChange={setPassword}
                                                />
                                                <Select
                                                    label="Sélectionner votre école"
                                                    aria-label="Ecoles"
                                                    placeholder="Sélectionner votre école"
                                                    selectedKey={schoolId ? String(schoolId) : null}
                                                    onSelectionChange={(key) =>
                                                        setSchoolId(key ? Number(key) : null)
                                                    }
                                                >
                                                    <SelectTrigger />
                                                    <Popover className="entering:fade-in exiting:fade-out flex max-h-80 w-(--trigger-width) entering:animate-in exiting:animate-out flex-col overflow-hidden rounded-lg border bg-overlay">
                                                        <Dialog aria-label="School Selector">
                                                            <Autocomplete filter={contains}>
                                                                <div className="border-b bg-muted p-2">
                                                                    <SearchField
                                                                        placeholder="Rechercher une école"
                                                                        className="rounded-lg bg-bg"
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                                <ListBox
                                                                    className="max-h-[inherit] min-w-[inherit] rounded-t-none border-0 bg-transparent shadow-none"
                                                                    items={groupedSchools}
                                                                >
                                                                    {(group) => (
                                                                        <SelectSection
                                                                            key={group.id}
                                                                            title={group.name}
                                                                            items={group.schools}
                                                                        >
                                                                            {(school) => (
                                                                                <SelectItem
                                                                                    id={String(
                                                                                        school.id,
                                                                                    )}
                                                                                    textValue={
                                                                                        school.name
                                                                                    }
                                                                                >
                                                                                    <Avatar
                                                                                        src={
                                                                                            school.logo
                                                                                        }
                                                                                        isSquare={
                                                                                            true
                                                                                        }
                                                                                    />
                                                                                    <SelectLabel>
                                                                                        {
                                                                                            school.name
                                                                                        }
                                                                                    </SelectLabel>
                                                                                </SelectItem>
                                                                            )}
                                                                        </SelectSection>
                                                                    )}
                                                                </ListBox>
                                                            </Autocomplete>
                                                        </Dialog>
                                                    </Popover>
                                                </Select>
                                                <Select
                                                    label="Intervalle de collecte"
                                                    aria-label="Intervalle de collecte"
                                                    placeholder="Choisir l'intervalle de collecte"
                                                    selectedKey={syncInterval}
                                                    onSelectionChange={(key) =>
                                                        setSyncInterval(key as SyncInterval)
                                                    }
                                                >
                                                    <SelectTrigger />
                                                    <Popover className="entering:fade-in exiting:fade-out flex max-h-80 w-(--trigger-width) entering:animate-in exiting:animate-out flex-col overflow-hidden rounded-lg border bg-overlay">
                                                        <ListBox>
                                                            {/*
                                                            <SelectItem id="min15">
                                                                Toutes les 15 minutes
                                                            </SelectItem>
                                                            <SelectItem id="min30">
                                                                Toutes les 30 minutes
                                                            </SelectItem>
                                                            <SelectItem id="hour1">
                                                                Toutes les heures
                                                            </SelectItem>
                                                            */}
                                                            <SelectItem id="hour3">
                                                                Toutes les 3 heures
                                                            </SelectItem>
                                                            <SelectItem id="hour6">
                                                                Toutes les 6 heures
                                                            </SelectItem>
                                                            <SelectItem id="hour12">
                                                                Deux fois par jour (toutes les 12h)
                                                            </SelectItem>
                                                            <SelectItem id="daily">
                                                                Une fois par jour
                                                            </SelectItem>
                                                            <SelectItem id="weekly">
                                                                Toutes les semaines
                                                            </SelectItem>
                                                            <SelectItem id="biweekly">
                                                                Toutes les 2 semaines
                                                            </SelectItem>
                                                            <SelectItem id="monthly">
                                                                Tous les mois
                                                            </SelectItem>
                                                        </ListBox>
                                                    </Popover>
                                                </Select>
                                            </ModalBody>
                                            <ModalFooter>
                                                <ModalClose>Annuler</ModalClose>
                                                <Button
                                                    onPress={handleCreateClick}
                                                    intent="primary"
                                                    isDisabled={
                                                        !scheduleName ||
                                                        !username ||
                                                        !password ||
                                                        !schoolId ||
                                                        !syncInterval
                                                    }
                                                >
                                                    Créer
                                                </Button>
                                            </ModalFooter>
                                        </>
                                    )}
                                    {step === 3 && (
                                        <>
                                            <ModalHeader>
                                                <ModalTitle>
                                                    Récupération de l'emploi du temps
                                                </ModalTitle>
                                            </ModalHeader>
                                            <ModalBody className="space-y-6 mb-8">
                                                {isLoading ? (
                                                    <div className="flex gap-2 justify-center items-start font-medium text-sm text-muted-fg">
                                                        <Loader className="size-4 mt-0.5" />
                                                        Votre emploi du temps est en cours de
                                                        récupération. Cette opération peut prendre
                                                        une à deux minutes — merci de patienter le
                                                        temps que toutes les données soient
                                                        synchronisées.
                                                    </div>
                                                ) : schedule ? (
                                                    <div className="flex flex-col gap-8 justify-center items-center my-8 mx-12">
                                                        <CalendarCheck2Icon size="102" />
                                                        <p className="font-semibold text-xl text-center">
                                                            Première synchronisation de votre emploi
                                                            du temps réussie.
                                                        </p>
                                                        <p className="font-medium text-sm text-muted-fg text-start">
                                                            Votre emploi du temps a été importé avec
                                                            succès pour la première fois. Les
                                                            futures mises à jour et versions seront
                                                            accessibles depuis votre tableau de
                                                            bord.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-8 justify-center items-center my-8 mx-12">
                                                        <CalendarXIcon size="102" />
                                                        <p className="font-semibold text-xl text-center">
                                                            Echec de la première synchronisation de
                                                            votre emploi du temps.
                                                        </p>
                                                        <p className="font-medium text-sm text-muted-fg text-start">
                                                            {errorMessage}
                                                        </p>
                                                        <Button
                                                            intent="outline"
                                                            onPress={() => setStep(2)}
                                                        >
                                                            Essayer à nouveau
                                                        </Button>
                                                    </div>
                                                )}
                                            </ModalBody>
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
