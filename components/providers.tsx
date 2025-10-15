"use client";

import { useStyle } from "@/lib/utils/hooks/use-style";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/navigation";
import { RouterProvider } from "react-aria-components";
import { Toaster } from "sonner";

declare module "react-aria-components" {
    interface RouterConfig {
        routerOptions: NonNullable<Parameters<ReturnType<typeof useRouter>["push"]>[1]>;
    }
}

export function Providers({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const queryClient = new QueryClient();
    const { style } = useStyle();

    return (
        <RouterProvider navigate={router.push}>
            <Toaster position="top-right" />
            <NextThemesProvider
                defaultTheme="light"
                disableTransitionOnChange
                enableSystem={false}
                attribute="class"
            >
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            </NextThemesProvider>
        </RouterProvider>
    );
}
