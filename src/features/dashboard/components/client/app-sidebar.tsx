"use client";

import type { Doc } from "@convex/_generated/dataModel";
import type { ComponentProps } from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { sidebarConfig } from "../../config/sidebar-config";
import { SidebarBranding } from "../server/sidebar-header";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

type AppSidebarProps = ComponentProps<typeof Sidebar> & {
  user: Doc<"users">;
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { branding, navMain } = sidebarConfig;

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarBranding name={branding.name} plan={branding.plan} logo={branding.logo} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
