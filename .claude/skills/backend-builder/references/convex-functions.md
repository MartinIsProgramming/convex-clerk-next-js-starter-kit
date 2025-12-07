# Convex Functions

Functions are the core of Convex. They define how to read and write data.

## Function Types

| Type | Use Case | DB Access | External APIs |
|------|----------|-----------|---------------|
| `query` | Read data (public) | Yes | No |
| `mutation` | Write data (public) | Yes | No |
| `action` | External APIs (public) | No | Yes |
| `internalQuery` | Read data (private) | Yes | No |
| `internalMutation` | Write data (private) | Yes | No |
| `internalAction` | External APIs (private) | No | Yes |

## Required Imports

```typescript
// Public functions
import { query, mutation, action } from "./_generated/server";

// Internal functions
import { internalQuery, internalMutation, internalAction } from "./_generated/server";

// Validators
import { v } from "convex/values";

// Function references
import { api, internal } from "./_generated/api";
```

## New Function Syntax (Required)

Always use the new syntax with `args` and `returns` validators:

```typescript
export const myFunction = query({
  args: {
    // Define argument validators
    id: v.id("users"),
    name: v.string(),
  },
  returns: v.object({
    // Define return type validator
    id: v.id("users"),
    name: v.string(),
  }),
  handler: async (ctx, args) => {
    // Implementation
    return { id: args.id, name: args.name };
  },
});
```

## Query Examples

### Get Single Document
```typescript
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
```

### List with Index
```typescript
export const listByCategory = query({
  args: { categoryId: v.id("categories") },
  returns: v.array(v.object({
    _id: v.id("products"),
    _creationTime: v.number(),
    name: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .order("desc")
      .collect();
  },
});
```

### Get Unique by Field
```typescript
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});
```

## Mutation Examples

### Create
```typescript
export const create = mutation({
  args: {
    name: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
  },
  returns: v.id("products"),
  handler: async (ctx, args) => {
    // Validate category exists
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    return await ctx.db.insert("products", {
      name: args.name,
      price: args.price,
      categoryId: args.categoryId,
    });
  },
});
```

### Update (Patch)
```typescript
export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    price: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Product not found");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
});
```

### Delete
```typescript
export const remove = mutation({
  args: { id: v.id("products") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Product not found");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});
```

### Replace (Full Update)
```typescript
export const replace = mutation({
  args: {
    id: v.id("products"),
    name: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.replace(id, data);
    return null;
  },
});
```

## Action Examples

### External API Call
```typescript
"use node";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: args.to,
        subject: args.subject,
        content: args.body,
      }),
    });

    return { success: response.ok };
  },
});
```

### Action Calling Query and Mutation
```typescript
export const processOrder = action({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Read data via query
    const order = await ctx.runQuery(internal.orders.getById, {
      id: args.orderId,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Call external payment API
    const paymentResult = await processPayment(order);

    // Write result via mutation
    await ctx.runMutation(internal.orders.updateStatus, {
      id: args.orderId,
      status: paymentResult.success ? "paid" : "failed",
    });

    return null;
  },
});
```

## Internal Functions

Use for functions that should not be exposed to clients:

```typescript
export const getOrderInternal = internalQuery({
  args: { id: v.id("orders") },
  returns: v.union(v.object({ /* ... */ }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateOrderStatus = internalMutation({
  args: {
    id: v.id("orders"),
    status: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
});
```

## Calling Functions from Functions

```typescript
// In a query - call another query
const user = await ctx.runQuery(api.users.getById, { id: userId });

// In a mutation - call query or mutation
const user = await ctx.runQuery(api.users.getById, { id: userId });
await ctx.runMutation(api.logs.create, { action: "updated" });

// In an action - call query, mutation, or action
const data = await ctx.runQuery(api.data.list, {});
await ctx.runMutation(api.data.update, { id, value });
await ctx.runAction(api.external.sync, {});

// Internal functions use `internal` instead of `api`
await ctx.runMutation(internal.orders.updateStatus, { id, status });
```

## Anti-patterns

### Never use try/catch inside functions
```typescript
// Bad
export const getUser = query({
  args: { id: v.id("users") },
  returns: v.union(v.object({ /* ... */ }), v.null()),
  handler: async (ctx, args) => {
    try {
      return await ctx.db.get(args.id);
    } catch (error) {
      return null; // WRONG: hiding errors
    }
  },
});

// Good - let errors propagate
export const getUser = query({
  args: { id: v.id("users") },
  returns: v.union(v.object({ /* ... */ }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

### Never skip validators
```typescript
// Bad
export const create = mutation({
  args: {},
  handler: async (ctx, args: any) => { /* ... */ }, // WRONG: no type safety
});

// Good
export const create = mutation({
  args: {
    name: v.string(),
    price: v.number(),
  },
  returns: v.id("products"),
  handler: async (ctx, args) => { /* ... */ },
});
```

### Never forget returns validator
```typescript
// Bad
export const deleteUser = mutation({
  args: { id: v.id("users") },
  // Missing returns validator
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Good
export const deleteUser = mutation({
  args: { id: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
```
