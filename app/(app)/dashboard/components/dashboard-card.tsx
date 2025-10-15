"use client";

import { GithubLogo } from "@/components/logos";
import { Link } from "@/components/ui/link";
import { BookMarked, Calendar } from "lucide-react";

const items = [
    {
        id: 1,
        icon: <Calendar className="h-16 w-16" />,
        name: "Emplois du temps",

        url: "/dashboard/schedules",
    },
    {
        id: 2,
        icon: <BookMarked className="h-16 w-16" />,
        name: "Documentation",

        url: "/docs",
    },

    {
        id: 3,
        icon: <GithubLogo className="h-16 w-16" />,
        name: "GitHub",
        url: "https://github.com/kaelianbaudelet/WSPS",
    },
];

export default function DashboardCard() {
    return (
        <div className="flex flex-wrap gap-4" aria-label="Ressources">
            {items.map((item) => (
                <Link
                    key={item.id}
                    href={item.url}
                    className="relative rounded-4xl aspect-square min-w-64 cursor-pointer truncate overflow-hidden md:rounded-4xl border"
                >
                    <button className="rounded-4xl w-full h-full flex flex-col items-center justify-center overflow-hidden cursor-pointer">
                        {item.icon}
                        <div className="mt-4 flex flex-col justify-center items-center truncate gap-2">
                            <h4 className="font-semibold text-base truncate max-w-46">
                                {item.name}
                            </h4>
                        </div>
                    </button>
                </Link>
            ))}
        </div>
    );
}
