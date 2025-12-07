# Convex Patterns

Best practices and patterns for Convex development.

## File Organization

```
convex/
├── _generated/          # Auto-generated (don't edit)
│   ├── api.d.ts
│   ├── api.js
│   ├── dataModel.d.ts
│   └── server.d.ts
├── schema.ts            # Database schema
├── auth.config.ts       # Auth configuration
├── http.ts              # HTTP endpoints (webhooks)
├── crons.ts             # Scheduled jobs
│
├── users.ts             # User functions
├── products.ts          # Product functions
├── orders.ts            # Order functions
│
└── lib/                 # Shared utilities
    ├── auth.ts          # Auth helpers
    └── validators.ts    # Reusable validators
```

## Naming Conventions

### Files
- Use lowercase with entity name: `users.ts`, `products.ts`, `orders.ts`
- Use `lib/` folder for shared utilities

### Functions
| Operation | Name | Example |
|-----------|------|---------|
| Get one | `get`, `getById`, `getByX` | `getById`, `getByEmail` |
| List many | `list`, `listByX` | `list`, `listByCategory` |
| Create | `create` | `create` |
| Update | `update`, `patch` | `update` |
| Delete | `remove`, `delete` | `remove` |
| Toggle | `toggleX` | `toggleActive` |
| Search | `search` | `search` |

### Indexes
Include all fields in name: `by_field1_and_field2`

```typescript
.index("by_user", ["userId"])
.index("by_user_and_status", ["userId", "status"])
.index("by_category_and_price", ["categoryId", "price"])
```

## Query Patterns

### Ordering
```typescript
// Default: ascending by _creationTime
const items = await ctx.db.query("items").collect();

// Explicit ordering
const newest = await ctx.db.query("items").order("desc").collect();
const oldest = await ctx.db.query("items").order("asc").collect();
```

### Limiting Results
```typescript
// Get first N
const topTen = await ctx.db.query("items").order("desc").take(10);

// Get first one
const latest = await ctx.db.query("items").order("desc").first();

// Get unique (throws if multiple)
const unique = await ctx.db
  .query("items")
  .withIndex("by_slug", (q) => q.eq("slug", slug))
  .unique();
```

### Async Iteration
```typescript
// For processing large datasets
for await (const item of ctx.db.query("items")) {
  // Process each item
  await processItem(item);
}
```

## Mutation Patterns

### Transactions
Mutations are automatically transactional:

```typescript
export const transfer = mutation({
  args: {
    fromId: v.id("accounts"),
    toId: v.id("accounts"),
    amount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const from = await ctx.db.get(args.fromId);
    const to = await ctx.db.get(args.toId);

    if (!from || !to) {
      throw new Error("Account not found");
    }

    if (from.balance < args.amount) {
      throw new Error("Insufficient funds");
    }

    // Both operations succeed or fail together
    await ctx.db.patch(args.fromId, { balance: from.balance - args.amount });
    await ctx.db.patch(args.toId, { balance: to.balance + args.amount });

    return null;
  },
});
```

### Batch Operations
```typescript
export const deleteMany = mutation({
  args: { ids: v.array(v.id("items")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await Promise.all(args.ids.map((id) => ctx.db.delete(id)));
    return null;
  },
});

export const createMany = mutation({
  args: {
    items: v.array(v.object({
      name: v.string(),
      value: v.number(),
    })),
  },
  returns: v.array(v.id("items")),
  handler: async (ctx, args) => {
    const ids = await Promise.all(
      args.items.map((item) => ctx.db.insert("items", item))
    );
    return ids;
  },
});
```

## Error Handling

### Let Errors Propagate
```typescript
// Good - errors propagate to client
export const getUser = query({
  args: { id: v.id("users") },
  returns: v.object({ /* ... */ }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },
});
```

### Validation Errors
```typescript
export const create = mutation({
  args: {
    email: v.string(),
    age: v.number(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Validate email format
    if (!args.email.includes("@")) {
      throw new Error("Invalid email format");
    }

    // Validate age range
    if (args.age < 0 || args.age > 150) {
      throw new Error("Invalid age");
    }

    // Check uniqueness
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      throw new Error("Email already exists");
    }

    return await ctx.db.insert("users", args);
  },
});
```

## Reusable Validators

```typescript
// convex/lib/validators.ts
import { v } from "convex/values";

export const paginationArgs = {
  cursor: v.optional(v.string()),
  limit: v.optional(v.number()),
};

export const timestampFields = {
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const addressValidator = v.object({
  street: v.string(),
  city: v.string(),
  state: v.string(),
  country: v.string(),
  postalCode: v.string(),
});

// Usage
import { paginationArgs, addressValidator } from "./lib/validators";

export const list = query({
  args: { ...paginationArgs },
  // ...
});

export const create = mutation({
  args: {
    name: v.string(),
    address: addressValidator,
  },
  // ...
});
```

## Type Annotations for Same-File Calls

When calling functions in the same file, add type annotations:

```typescript
export const getUser = query({
  args: { id: v.id("users") },
  returns: v.object({
    _id: v.id("users"),
    name: v.string(),
  }),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUserWithPosts = query({
  args: { id: v.id("users") },
  returns: v.object({
    user: v.object({ _id: v.id("users"), name: v.string() }),
    posts: v.array(v.object({ _id: v.id("posts"), title: v.string() })),
  }),
  handler: async (ctx, args) => {
    // Type annotation needed for same-file calls
    const user: { _id: Id<"users">; name: string } | null =
      await ctx.runQuery(api.users.getUser, { id: args.id });

    if (!user) {
      throw new Error("User not found");
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.id))
      .collect();

    return { user, posts };
  },
});
```

## Idempotent Operations

For webhooks and retry-safe operations:

```typescript
export const upsertUser = mutation({
  args: {
    externalId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", args);
  },
});
```

## Anti-patterns

### Don't call actions from actions unnecessarily
```typescript
// Bad - calling action from action without need
export const processAll = action({
  handler: async (ctx) => {
    await ctx.runAction(api.items.processOne, { id: "1" });
    await ctx.runAction(api.items.processOne, { id: "2" });
  },
});

// Good - extract shared logic to helper function
async function processItem(id: string) {
  // Shared processing logic
}

export const processAll = action({
  handler: async (ctx) => {
    await processItem("1");
    await processItem("2");
  },
});
```

### Don't make multiple round-trips from actions
```typescript
// Bad - multiple query calls
export const generateReport = action({
  handler: async (ctx) => {
    const users = await ctx.runQuery(api.users.list);
    const orders = await ctx.runQuery(api.orders.list);
    const products = await ctx.runQuery(api.products.list);
    // Process...
  },
});

// Good - single query that returns all data
export const getReportData = query({
  returns: v.object({
    users: v.array(/* ... */),
    orders: v.array(/* ... */),
    products: v.array(/* ... */),
  }),
  handler: async (ctx) => {
    const [users, orders, products] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("orders").collect(),
      ctx.db.query("products").collect(),
    ]);
    return { users, orders, products };
  },
});

export const generateReport = action({
  handler: async (ctx) => {
    const data = await ctx.runQuery(api.reports.getReportData);
    // Process...
  },
});
```
