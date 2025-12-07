"use client";

import { useClerk } from "@clerk/nextjs";
import type { Doc } from "@convex/_generated/dataModel";
import { BadgeCheck, ChevronsUpDown, LogOut } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { getDisplayName } from "@/utils/user-utils";
import { UserAvatar } from "../server/user-avatar";

type NavUserProps = {
  user: Doc<"users">;
  /** URL del perfil según el contexto (admin o residente) */
  profileUrl?: string;
};

export function NavUser({ user, profileUrl = "/profile" }: NavUserProps) {
  const { isMobile } = useSidebar();
  const displayName = getDisplayName(user.firstName, user.lastName);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar src={user.imageUrl} name={displayName} />
              <UserDetails name={displayName} email={user.email} />
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <UserDropdownContent
            displayName={displayName}
            email={user.email}
            imageUrl={user.imageUrl}
            isMobile={isMobile}
            profileUrl={profileUrl}
          />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function UserDetails({ name, email }: { name: string; email: string }) {
  return (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium">{name}</span>
      <span className="truncate text-xs">{email}</span>
    </div>
  );
}

function UserDropdownContent({
  displayName,
  email,
  imageUrl,
  isMobile,
  profileUrl,
}: {
  displayName: string;
  email: string;
  imageUrl?: string;
  isMobile: boolean;
  profileUrl: string;
}) {
  const { signOut } = useClerk();

  return (
    <DropdownMenuContent
      className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
      side={isMobile ? "bottom" : "right"}
      align="end"
      sideOffset={4}
    >
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <UserAvatar src={imageUrl} name={displayName} />
          <UserDetails name={displayName} email={email} />
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href={profileUrl}>
            <BadgeCheck />
            Mi Perfil
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/" })}>
        <LogOut />
        Cerrar sesión
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
