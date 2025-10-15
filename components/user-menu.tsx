"use client";

import { ChevronsUpDown, Laptop, LogOut, Moon, Sun } from "lucide-react";

import {
    Menu,
    MenuContent,
    MenuHeader,
    MenuItem,
    MenuSection,
    MenuSeparator,
    MenuSubmenu,
    MenuTrigger,
} from "@/components/ui/menu";
import { SidebarLabel } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/auth.client";
import { sidebarMenus } from "@/resources/data";
import { User } from "better-auth";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

export default function UserMenu({ user }: { user?: User }) {
    const router = useRouter();
    const { resolvedTheme, setTheme } = useTheme();
    return (
        <Menu>
            <MenuTrigger className="flex w-full items-center justify-between" aria-label="Profile">
                <>
                    <div className="in-data-[sidebar-collapsible=dock]:hidden text-sm">
                        <SidebarLabel>{user?.name}</SidebarLabel>
                        <p className="-mt-0.5 block text-muted-fg">{user?.email}</p>
                    </div>
                    <ChevronsUpDown
                        data-slot="chevron"
                        className="absolute right-3 size-4 transition-transform #group-pressed:rotate-180"
                    />
                </>
            </MenuTrigger>
            <MenuContent placement="bottom right" className="sm:min-w-(--trigger-width)">
                <MenuSection>
                    <MenuHeader separator>
                        <span className="block">{user?.name}</span>
                        <span className="font-normal text-muted-fg">{user?.email}</span>
                    </MenuHeader>
                </MenuSection>

                {sidebarMenus.account.map((item) => (
                    <MenuItem key={item.title} href={item.link}>
                        <item.icon data-slot="icon" />
                        {item.title}
                    </MenuItem>
                ))}
                <MenuItem
                    onAction={() => {
                        router.push("/auth/sign-in");
                        authClient.signOut();
                    }}
                >
                    <LogOut data-slot="icon" />
                    Déconnexion
                </MenuItem>

                <MenuSeparator />
                <MenuSubmenu>
                    <MenuItem>
                        {resolvedTheme === "light" ? (
                            <Sun data-slot="icon" />
                        ) : resolvedTheme === "dark" ? (
                            <Moon data-slot="icon" />
                        ) : (
                            <Laptop data-slot="icon" />
                        )}
                        Changer le Thème
                    </MenuItem>
                    <MenuContent>
                        <MenuItem onAction={() => setTheme("system")}>
                            <Laptop data-slot="icon" /> Systeme
                        </MenuItem>
                        <MenuItem onAction={() => setTheme("dark")}>
                            <Moon data-slot="icon" /> Sombre
                        </MenuItem>
                        <MenuItem onAction={() => setTheme("light")}>
                            <Sun data-slot="icon" /> Clair
                        </MenuItem>
                    </MenuContent>
                </MenuSubmenu>
            </MenuContent>
        </Menu>
    );
}
