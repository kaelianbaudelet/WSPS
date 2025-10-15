import {
    Calendar,
    Home,
    KeyRound,
    Settings
} from "lucide-react";

export const sidebarMenus = {
    base: [
        {
            icon: Home,
            title: "Accueil",
            link: "/dashboard",
        },
        {
            icon: Calendar,
            title: "Emploi du temps",
            link: "/dashboard/schedules",
        },

    ],
    account: [
        {
            icon: Settings,
            title: "Réglages",
            link: "/dashboard/account/settings",
        },
        {
            icon: KeyRound,
            title: "Clefs API",
            link: "/dashboard/account/settings/api-keys",
        },
    ],
};
