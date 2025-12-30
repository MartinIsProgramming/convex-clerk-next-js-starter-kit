import type { Nullable } from "@/types";

import type { TenantInfo, User, UserDisplayInfo } from "./convex-types";

const DEFAULT_AVATAR = "/avatars/default.jpg";

/**
 * Extrae las iniciales de un nombre completo.
 * @example getInitials("Juan Pérez") → "JP"
 * @example getInitials("María") → "M"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Formatea el nombre completo de un usuario.
 */
function formatFullName(
  user: Nullable<Pick<User, "firstName" | "lastName">>,
  fallback: string,
): string {
  if (!user) return fallback;
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return fullName || fallback;
}

/**
 * Mapea un usuario de Convex a la información necesaria para UI.
 * Centraliza la lógica de formateo de nombre, avatar e iniciales.
 */
export function getUserDisplayInfo(
  user: Nullable<User>,
  fallbackName = "Usuario",
): UserDisplayInfo {
  const name = formatFullName(user, fallbackName);
  return {
    name,
    email: user?.email ?? "",
    avatar: user?.imageUrl ?? DEFAULT_AVATAR,
    initials: getInitials(name),
  };
}

/**
 * Obtiene el nombre de display de un tenant.
 * Retorna nombre completo o email si no hay nombre.
 */
export function getTenantDisplayName(tenant: TenantInfo): string {
  const fullName = `${tenant.firstName ?? ""} ${tenant.lastName ?? ""}`.trim();
  return fullName || tenant.email;
}

/** Minimal user shape for display name extraction */
type UserWithName = {
  firstName?: string;
  lastName?: string;
  email: string;
};

/** User shape that includes optional imageUrl */
type UserWithImage = {
  imageUrl?: string;
};

/**
 * Obtiene el nombre de display de un usuario genérico.
 * Retorna nombre completo, email si no hay nombre, o fallback si es null.
 */
export function getUserDisplayName(
  user: UserWithName | null,
  fallback = "Usuario desconocido",
): string {
  if (!user) return fallback;
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return fullName || user.email;
}

/**
 * Obtiene la URL de imagen de un usuario.
 * Retorna null si el usuario no tiene imagen.
 */
export function getUserImageUrl(user: UserWithImage | null): string | null {
  return user?.imageUrl ?? null;
}
