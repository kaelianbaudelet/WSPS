import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import { displayFont } from "@/lib/utils/fonts";
import { siteConfig } from "@/resources/site";
import "@/styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        template: `%s — ${siteConfig.name}`,
        default: `${siteConfig.name}`,
    },
    applicationName: siteConfig.name,
    keywords: ["WSPS"],
    description: siteConfig.description,
    icons: {
        icon: [
            {
                media: "(prefers-color-scheme: light)",
                url: "/favicon-light.icon",
                href: "/favicon-light.icon",
            },
            {
                media: "(prefers-color-scheme: dark)",
                url: "/favicon-dark.icon",
                href: "/favicon-dark.icon",
            },
        ],
    },
    openGraph: {
        type: "website",
        title: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.domains.current,
        siteName: siteConfig.name,
        locale: "fr_EU",
        images: [
            {
                url: `${siteConfig.domains.current}/og.png`,
                width: 720,
                height: 384,
            },
        ],
    },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={cn("bg-background font-display antialiased", displayFont.variable)}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
