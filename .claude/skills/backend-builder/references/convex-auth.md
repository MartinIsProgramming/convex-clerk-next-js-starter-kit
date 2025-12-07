# Convex Auth (Clerk Integration)

Authentication with Convex and Clerk.

## Setup

### 1. Auth Config
```typescript
// convex/auth.config.ts
import type { AuthConfig } from "convex/server";

if (!process.env.CLERK_JWT_ISSUER_DOMAIN) {
  throw new Error("CLERK_JWT_ISSUER_DOMAIN is not set");
}

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
```

### 2. Environment Variables
```bash
# .env.local
CLERK_JWT_ISSUER_DOMAIN=your-clerk-domain.clerk.accounts.dev
```

## Getting User Identity in Functions

### In Queries/Mutations
```typescript
export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      email: v.string(),
      name: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // identity.subject is the Clerk user ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user;
  },
});
```

### Protected Mutations
```typescript
export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.insert("posts", {
      title: args.title,
      content: args.content,
      authorId: user._id,
    });
  },
});
```

## User Identity Object

The `identity` object from `ctx.auth.getUserIdentity()` contains:

```typescript
interface UserIdentity {
  subject: string;        // Clerk user ID
  issuer: string;         // JWT issuer
  tokenIdentifier: string; // Unique token ID
  email?: string;
  emailVerified?: boolean;
  name?: string;
  pictureUrl?: string;
  // ... other OpenID claims
}
```

## Auth Helper Pattern

Create a reusable auth helper:

```typescript
// convex/lib/auth.ts
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

export async function requireAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await getAuthenticatedUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

// Usage in functions
export const myProtectedMutation = mutation({
  args: { /* ... */ },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);
    // user is guaranteed to exist here
    // ...
    return null;
  },
});
```

## Server-Side Authentication (Next.js)

### Get Auth Token Helper
```typescript
// lib/auth.ts
import { auth } from "@clerk/nextjs/server";

export async function getAuthToken() {
  const authResult = await auth();
  return (await authResult.getToken({ template: "convex" })) ?? undefined;
}
```

### With preloadQuery
```typescript
// app/dashboard/page.tsx
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import { DashboardClient } from "./client";

export default async function DashboardPage() {
  const token = await getAuthToken();

  const preloadedData = await preloadQuery(
    api.dashboard.getData,
    {},
    { token }
  );

  return <DashboardClient preloaded={preloadedData} />;
}
```

### With fetchQuery
```typescript
// app/api/data/route.ts
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";

export async function GET() {
  const token = await getAuthToken();

  const data = await fetchQuery(
    api.data.list,
    {},
    { token }
  );

  return Response.json(data);
}
```

## User Sync (Clerk Webhooks)

Sync Clerk users to Convex:

```typescript
// convex/users.ts
export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
    });
  },
});

export const deleteByClerkId = internalMutation({
  args: { clerkId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
    }
    return null;
  },
});
```

### Webhook Handler (HTTP Action)
```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify webhook signature here
    const payload = await request.json();

    switch (payload.type) {
      case "user.created":
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          clerkId: payload.data.id,
          email: payload.data.email_addresses[0]?.email_address ?? "",
          name: `${payload.data.first_name ?? ""} ${payload.data.last_name ?? ""}`.trim() || undefined,
          imageUrl: payload.data.image_url,
        });
        break;

      case "user.deleted":
        await ctx.runMutation(internal.users.deleteByClerkId, {
          clerkId: payload.data.id,
        });
        break;
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

## Anti-patterns

### Never trust client-provided user IDs
```typescript
// Bad - client can fake userId
export const createPost = mutation({
  args: {
    userId: v.id("users"), // WRONG: client provides userId
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("posts", { authorId: args.userId, content: args.content });
  },
});

// Good - get userId from auth
export const createPost = mutation({
  args: { content: v.string() },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);
    return await ctx.db.insert("posts", { authorId: user._id, content: args.content });
  },
});
```

### Always check auth before sensitive operations
```typescript
// Good - check auth first
export const deletePost = mutation({
  args: { id: v.id("posts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.authorId !== user._id) {
      throw new Error("Not authorized to delete this post");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});
```
