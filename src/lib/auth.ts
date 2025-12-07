import { auth } from "@clerk/nextjs/server";

/**
 * Gets the Clerk JWT token for authenticating requests to Convex.
 *
 * This token is used with `fetchQuery` or `preloadQuery` in Server Components
 * to make authenticated requests to Convex.
 *
 * @example
 * ```ts
 * const token = await getAuthToken();
 * const user = await fetchQuery(api.users.current, {}, { token });
 * ```
 *
 * @returns The JWT token or `undefined` if there's no active session
 *
 * @remarks
 * The try-catch handles a race condition during sign-out:
 * 1. User clicks "Sign out"
 * 2. Clerk invalidates the session
 * 3. Next.js attempts to render the layout during the redirect
 * 4. `getToken()` fails with 404 because the session no longer exists
 *
 * Instead of propagating the error, we return `undefined` so that
 * the layout can redirect the user to `/sign-in` normally.
 */
export async function getAuthToken() {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return undefined;
    }

    return (await getToken({ template: "convex" })) ?? undefined;
  } catch {
    // Session may be invalidated during sign-out
    return undefined;
  }
}
