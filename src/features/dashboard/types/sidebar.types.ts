import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: NavSubItem[];
};

export type NavSubItem = {
  title: string;
  url: string;
};

export type SidebarConfig = {
  branding: {
    name: string;
    plan: string;
    logo: LucideIcon;
  };
  navMain: NavItem[];
};
