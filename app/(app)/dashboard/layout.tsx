import AppSidebar from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout(props: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar collapsible="dock" />
            <SidebarInset>{props.children}</SidebarInset>
        </SidebarProvider>
    );
}
