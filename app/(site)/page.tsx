"use client";

import { GithubLogo, WSPSLogo } from "@/components/logos";
import { buttonStyles } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { BookMarked, LogIn } from "lucide-react";

export default function Page() {
    return (
        <div className="flex flex-col justify-center items-center h-screen p-4 gap-8">
            <WSPSLogo className="w-full max-w-md" />
            <div className="flex gap-4">
                <Link className={buttonStyles({ intent: "outline" })} href="/auth/sign-in">
                    <LogIn data-slot="icon" />
                    Connexion
                </Link>
                <Link className={buttonStyles({ intent: "outline" })} href="/docs">
                    <BookMarked data-slot="icon" />
                    Documentation
                </Link>
                <Link
                    className={buttonStyles({ intent: "outline" })}
                    target="_blank"
                    href="https://github.com/kaelianbaudelet/WSPS"
                >
                    <GithubLogo width={18} data-slot="icon" />
                    Github
                </Link>
            </div>
        </div>
    );
}
