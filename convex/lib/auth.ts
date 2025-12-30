import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

// === Types ===

export interface AuthContext {
  user: Doc<"users">;
}

// === Auth Functions ===

/**
 * Get the authenticated user from the context.
 * Returns null if not authenticated or user not found.
 */
export async function getAuthContext(ctx: QueryCtx | MutationCtx): Promise<AuthContext | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const clerkUserId = identity.subject;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkUserId))
    .unique();

  if (!user) return null;

  return { user };
}

/**
 * Require the user to be authenticated.
 * Throws an error if not authenticated.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<AuthContext> {
  const auth = await getAuthContext(ctx);
  if (!auth) throw new Error("Not authenticated");
  return auth;
}
