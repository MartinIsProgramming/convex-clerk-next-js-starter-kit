import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import { internalMutation, query } from "./_generated/server";

// === Internal Mutations (called from webhook) ===

export const createUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email ?? "",
      firstName: args.firstName ?? undefined,
      lastName: args.lastName ?? undefined,
      imageUrl: args.imageUrl ?? undefined,
    });
    return null;
  },
});

export const updateUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      console.warn(`[webhook] User not found for update: ${args.clerkId}`);
      return null;
    }

    await ctx.db.patch(user._id, {
      email: args.email ?? user.email,
      firstName: args.firstName ?? user.firstName,
      lastName: args.lastName ?? user.lastName,
      imageUrl: args.imageUrl ?? user.imageUrl,
    });
    return null;
  },
});

export const deleteUser = internalMutation({
  args: { clerkId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      console.warn(`[webhook] User not found for deletion: ${args.clerkId}`);
      return null;
    }

    await ctx.db.delete(user._id);
    return null;
  },
});

// === Public Queries ===

export const current = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// === Helpers (exported for use in other functions) ===

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("User not authenticated");
  return user;
}
