---
name: backend-builder
description: Build backend with Convex. INVOKE THIS SKILL when creating or modifying database schema, queries, mutations, actions, auth helpers, or any convex/ code. Check convex/lib/ for existing helpers before creating new. Pair with frontend-builder for full-stack.
---

# Convex Backend Builder

> **CRITICAL:** This skill REQUIRES using the `mcp__sequential-thinking__sequentialthinking` tool BEFORE writing any code. Do NOT skip this step.

## 0. Sequential Thinking Planning (MANDATORY)

Before writing ANY backend code, you MUST use the sequential thinking MCP to plan your implementation. This ensures proper schema design, efficient queries, and secure code.

### How to Use Sequential Thinking

After understanding what needs to be built, invoke sequential thinking with this structure:

**Thought 1: Understanding the Requirement**
- What data needs to be stored/retrieved/modified?
- What business rules apply?
- What's the expected data volume and access patterns?

**Thought 2: Existing Code Analysis**
- What tables and indexes already exist in `convex/schema.ts`?
- What helpers exist in `convex/lib/`?
- Are there similar functions that can be referenced?

**Thought 3: Schema Design**
- What tables are needed? Do they already exist?
- What fields and types? Required vs optional?
- What indexes are needed for queries?
- Any relationships to other tables?

**Thought 4: Function Design**
- Query, mutation, or action? Why?
- Public or internal function?
- What arguments and validators?
- What return type?

**Thought 5: Security & Performance**
- Auth check required? Which helper to use?
- Organization isolation needed?
- N+1 query risks?
- Index usage (NEVER use filter())?

**Thought 6: Implementation Plan**
- List changes in order: schema first, then functions
- Dependencies between changes
- What to test after implementation

Set `totalThoughts: 6` minimum, but use `needsMoreThoughts: true` for complex features.

### Sequential Thinking Parameters

```
thoughtNumber: 1-N (progress through planning)
totalThoughts: 6+ (adjust based on complexity)
isRevision: true (if reconsidering earlier decisions)
needsMoreThoughts: true (if complexity warrants)
nextThoughtNeeded: false (only when planning complete)
```

### Example Sequential Thinking Invocation

```json
{
  "thought": "I need to create a query to list reservations with filters. Let me understand the requirements: filter by date range, status, and resource. The query needs to be efficient with proper index usage...",
  "thoughtNumber": 1,
  "totalThoughts": 6,
  "nextThoughtNeeded": true
}
```

---

## Architecture

```
Client Component → useQuery/useMutation → Convex Function → Database
Server Component → preloadQuery/fetchQuery → Convex Function → Database
```

## Workflow (After Sequential Thinking)

1. **Need new DB entity?** → Add table to `convex/schema.ts`
2. **Create functions** → `convex/[entity].ts` (queries, mutations, actions)
3. **Need internal function?** → Use `internalQuery`, `internalMutation`, `internalAction`
4. **Need external API calls?** → Use `action` (not query/mutation)

## Critical Rules

```
NEVER:
├── Use filter() in queries (use withIndex instead)
├── Call ctx.db in actions (only queries/mutations have DB access)
├── Forget returns validator (always include, use v.null() if no return)
├── Use try/catch inside Convex functions (let errors propagate)
├── Expose internal functions as public (use internal* prefix)
├── Skip argument validators (always define args with v.*)
├── Create redundant indexes (by_userId is redundant if by_userId_status exists)
└── Use "and" in index names (use by_field1_field2, not by_field1_and_field2)

ALWAYS:
├── Use new function syntax with args/returns validators
├── Name indexes by_fieldName_otherField (camelCase, no "and")
├── Use compound indexes instead of multiple simple indexes when possible
├── Use v.id("tableName") for document references
├── Use internalQuery/Mutation/Action for private functions
├── Import api/internal from "./_generated/api"
├── Use Infer<typeof validator> to extract types from validators
└── Return v.null() when function has no return value
```

## Quick Patterns

### Query (Read Data)
```typescript
// convex/products.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getById = query({
  args: { id: v.id("products") },
  returns: v.union(
    v.object({
      _id: v.id("products"),
      _creationTime: v.number(),
      name: v.string(),
      price: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("products"),
    _creationTime: v.number(),
    name: v.string(),
    price: v.number(),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("products").order("desc").collect();
  },
});
```

### Mutation (Write Data)
```typescript
// convex/products.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    price: v.number(),
  },
  returns: v.id("products"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", {
      name: args.name,
      price: args.price,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    price: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
```

### Action (External APIs)
```typescript
// convex/ai.ts
"use node";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import OpenAI from "openai";

const openai = new OpenAI();

export const generateResponse = action({
  args: { prompt: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Call external API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: args.prompt }],
    });

    const content = response.choices[0].message.content ?? "";

    // Save result via mutation
    await ctx.runMutation(internal.messages.save, { content });

    return content;
  },
});
```

### Schema
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
    isActive: v.boolean(),
  })
    .index("by_category", ["categoryId"])
    .index("by_category_active", ["categoryId", "isActive"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
  })
    .index("by_slug", ["slug"]),

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  })
    .index("by_clerkId", ["clerkId"]),
});
```

### Auth Helpers Pattern
```typescript
// convex/lib/auth.ts
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export interface AuthContext {
  user: Doc<"users">;
}

export async function getAuthContext(ctx: QueryCtx | MutationCtx): Promise<AuthContext | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) return null;
  return { user };
}

export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<AuthContext> {
  const auth = await getAuthContext(ctx);
  if (!auth) throw new Error("Not authenticated");
  return auth;
}
```

### Using Auth in Functions
```typescript
// convex/products.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib/auth";

export const listMyProducts = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("products"),
    name: v.string(),
  })),
  handler: async (ctx) => {
    const { user } = await requireAuth(ctx);
    return await ctx.db
      .query("products")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});
```

## References

- **Functions** → references/convex-functions.md (queries, mutations, actions, internal)
- **Schema** → references/convex-schema.md (tables, validators, indexes)
- **Auth** → references/convex-auth.md (Clerk integration, ctx.auth)
- **Patterns** → references/convex-patterns.md (file organization, best practices)
- **Advanced** → references/convex-advanced.md (crons, file storage, pagination, HTTP)
