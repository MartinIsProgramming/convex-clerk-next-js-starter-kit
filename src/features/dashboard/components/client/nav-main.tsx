"use client";

import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar";
import type { NavItem as NavItemType } from "../../types/sidebar.types";
import { NavItem } from "./nav-item";

type NavMainProps = {
  items: NavItemType[];
  label?: string;
};

export function NavMain({ items, label = "Platform" }: NavMainProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <NavItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
