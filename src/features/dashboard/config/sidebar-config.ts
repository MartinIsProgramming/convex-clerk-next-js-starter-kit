import { Calendar, Home } from "lucide-react";
import type { SidebarConfig } from "../types/sidebar.types";

export const sidebarConfig: SidebarConfig = {
  branding: {
    name: "Bookea",
    plan: "Reservas",
    logo: Calendar,
  },
  navMain: [
    {
      title: "Inicio",
      url: "/dashboard",
      icon: Home,
      isActive: true,
      items: [],
    },
  ],
};
