import "server-only";

import { auth } from "@clerk/nextjs/server";

/**
 * Obtiene el token de autenticación de Clerk para usar con Convex.
 *
 * Se usa en Server Components para pasar el token a preloadQuery/fetchQuery.
 *
 * @example
 * const token = await getAuthToken();
 * const preloaded = await preloadQuery(api.users.current, {}, { token });
 */
export async function getAuthToken() {
  const authResult = await auth();
  return (await authResult.getToken({ template: "convex" })) ?? undefined;
}
