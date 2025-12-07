/**
 * Construye el nombre completo a partir de firstName y lastName.
 * @example getDisplayName("Juan", "Pérez") → "Juan Pérez"
 * @example getDisplayName("María", undefined) → "María"
 * @example getDisplayName(undefined, undefined) → "Usuario"
 */
export function getDisplayName(firstName?: string, lastName?: string): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Usuario";
}

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
