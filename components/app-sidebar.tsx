"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FilePlus,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { title: "Přehled", href: "/dashboard", icon: LayoutDashboard },
  { title: "Nová smlouva", href: "/contracts/new", icon: FilePlus },
  { title: "Klienti", href: "/clients", icon: Users },
  { title: "Nastavení", href: "/settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 py-1.5 font-semibold"
        >
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <FileText className="size-4" />
          </span>
          <span className="group-data-[collapsible=icon]:hidden">
            Contract DMS
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive(pathname, item.href)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 group-data-[collapsible=icon]:hidden">
          <span className="truncate text-xs text-muted-foreground" title={userEmail}>
            {userEmail}
          </span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={signOut}
        >
          <LogOut className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">Odhlásit se</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
