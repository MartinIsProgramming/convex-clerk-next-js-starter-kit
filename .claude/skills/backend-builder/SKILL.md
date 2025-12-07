---
name: backend-builder
description: Build backend with Convex. Use when creating database operations, queries, mutations, or actions. Pair with frontend-builder for full-stack.
---

# Convex Backend Builder

## Architecture

```
Client Component → useQuery/useMutation → Convex Function → Database
Server Component → preloadQuery/fetchQuery → Convex Function → Database
```

## Workflow

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
└── Skip argument validators (always define args with v.*)

ALWAYS:
├── Use new function syntax with args/returns validators
├── Include all index fields in index name (by_field1_and_field2)
├── Use v.id("tableName") for document references
├── Use internalQuery/Mutation/Action for private functions
├── Import api/internal from "./_generated/api"
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
  })
    .index("by_category", ["categoryId"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
  })
    .index("by_slug", ["slug"]),

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  })
    .index("by_clerk_id", ["clerkId"]),
});
```

## References

- **Functions** → references/convex-functions.md (queries, mutations, actions, internal)
- **Schema** → references/convex-schema.md (tables, validators, indexes)
- **Auth** → references/convex-auth.md (Clerk integration, ctx.auth)
- **Patterns** → references/convex-patterns.md (file organization, best practices)
- **Advanced** → references/convex-advanced.md (crons, file storage, pagination, HTTP)
