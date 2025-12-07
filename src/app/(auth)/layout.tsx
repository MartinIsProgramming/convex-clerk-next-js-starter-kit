import type { LayoutProps } from "@/types";

/**
 * Auth Layout
 *
 * Layout centrado para formularios de autenticación de Clerk:
 * - /sign-in
 * - /sign-up
 */
export default function AuthLayout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">{children}</div>
  );
}
