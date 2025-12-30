"use client";

import { Authenticated } from "convex/react";

interface AuthenticatedWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper que asegura que los hijos solo se rendericen cuando
 * la autenticación de Convex esté completamente sincronizada.
 *
 * Esto previene errores "Not authenticated" que ocurren cuando
 * componentes cliente hacen queries de Convex antes de que el
 * token de auth haya sido enviado al backend.
 *
 * Usar para envolver componentes cliente que hacen queries autenticadas
 * y son renderizados desde server components.
 */
export function AuthenticatedWrapper({ children }: AuthenticatedWrapperProps) {
  return <Authenticated>{children}</Authenticated>;
}
