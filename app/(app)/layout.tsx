import { requireUser } from "@/lib/supabase/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <SidebarProvider>
      <AppSidebar userEmail={user.email} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
