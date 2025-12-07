# Convex Schema

Schema defines your database tables, fields, and indexes in `convex/schema.ts`.

## Basic Setup

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Define tables here
});
```

## System Fields

All documents automatically have:
- `_id`: Unique identifier (`v.id("tableName")`)
- `_creationTime`: Creation timestamp in milliseconds (`v.number()`)

## Validators Reference

| Convex Type | TypeScript | Validator | Example |
|-------------|------------|-----------|---------|
| Id | `Id<"table">` | `v.id("table")` | `v.id("users")` |
| Null | `null` | `v.null()` | `v.null()` |
| Int64 | `bigint` | `v.int64()` | `v.int64()` |
| Float64 | `number` | `v.number()` | `v.number()` |
| Boolean | `boolean` | `v.boolean()` | `v.boolean()` |
| String | `string` | `v.string()` | `v.string()` |
| Bytes | `ArrayBuffer` | `v.bytes()` | `v.bytes()` |
| Array | `Array<T>` | `v.array(T)` | `v.array(v.string())` |
| Object | `Object` | `v.object({...})` | `v.object({ name: v.string() })` |
| Record | `Record<K,V>` | `v.record(K, V)` | `v.record(v.string(), v.number())` |
| Union | `A \| B` | `v.union(A, B)` | `v.union(v.string(), v.null())` |
| Literal | `"value"` | `v.literal("value")` | `v.literal("active")` |
| Optional | `T \| undefined` | `v.optional(T)` | `v.optional(v.string())` |

## Table Examples

### Simple Table
```typescript
export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
  }),
});
```

### Table with References
```typescript
export default defineSchema({
  products: defineTable({
    name: v.string(),
    price: v.number(),
    categoryId: v.id("categories"), // Reference to categories table
  }),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
  }),
});
```

### Table with Complex Fields
```typescript
export default defineSchema({
  orders: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered")
    ),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      priceAtTime: v.number(),
    })),
    shippingAddress: v.object({
      street: v.string(),
      city: v.string(),
      country: v.string(),
      postalCode: v.string(),
    }),
    metadata: v.optional(v.record(v.string(), v.string())),
  }),
});
```

## Indexes

Indexes enable efficient queries. Always use `withIndex` instead of `filter`.

### Index Naming Convention
Include all fields in the index name: `by_field1_and_field2`

### Single Field Index
```typescript
export default defineSchema({
  users: defineTable({
    email: v.string(),
    clerkId: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_clerk_id", ["clerkId"]),
});
```

### Compound Index
```typescript
export default defineSchema({
  posts: defineTable({
    authorId: v.id("users"),
    status: v.string(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_author", ["authorId"])
    .index("by_author_and_status", ["authorId", "status"]),
});
```

### Using Indexes in Queries

```typescript
// Single field query
const user = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", email))
  .unique();

// Compound index - must query fields in order
const posts = await ctx.db
  .query("posts")
  .withIndex("by_author_and_status", (q) =>
    q.eq("authorId", authorId).eq("status", "published")
  )
  .collect();

// Range query
const recentPosts = await ctx.db
  .query("posts")
  .withIndex("by_author_and_status", (q) =>
    q.eq("authorId", authorId).gte("publishedAt", oneWeekAgo)
  )
  .collect();
```

## Search Indexes

For full-text search:

```typescript
export default defineSchema({
  articles: defineTable({
    title: v.string(),
    body: v.string(),
    category: v.string(),
  })
    .searchIndex("search_body", {
      searchField: "body",
      filterFields: ["category"],
    }),
});

// Usage
const results = await ctx.db
  .query("articles")
  .withSearchIndex("search_body", (q) =>
    q.search("body", "search terms").eq("category", "tech")
  )
  .take(10);
```

## Discriminated Unions

For polymorphic data:

```typescript
export default defineSchema({
  notifications: defineTable(
    v.union(
      v.object({
        type: v.literal("email"),
        email: v.string(),
        subject: v.string(),
      }),
      v.object({
        type: v.literal("sms"),
        phone: v.string(),
        message: v.string(),
      }),
      v.object({
        type: v.literal("push"),
        deviceToken: v.string(),
        title: v.string(),
        body: v.string(),
      })
    )
  ),
});
```

## TypeScript Types

Get types from schema:

```typescript
import { Id, Doc } from "./_generated/dataModel";

// Document ID type
type UserId = Id<"users">;

// Full document type (includes _id and _creationTime)
type User = Doc<"users">;

// In function signatures
export const getUser = query({
  args: { id: v.id("users") },
  returns: v.union(v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    email: v.string(),
    name: v.string(),
  }), v.null()),
  handler: async (ctx, args): Promise<Doc<"users"> | null> => {
    return await ctx.db.get(args.id);
  },
});
```

## Anti-patterns

### Never use filter() - use withIndex()
```typescript
// Bad - full table scan
const products = await ctx.db
  .query("products")
  .filter((q) => q.eq(q.field("categoryId"), categoryId))
  .collect();

// Good - uses index
const products = await ctx.db
  .query("products")
  .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
  .collect();
```

### Index fields must be queried in order
```typescript
// Index: ["authorId", "status"]

// Good - queries in order
.withIndex("by_author_and_status", (q) => q.eq("authorId", id).eq("status", "published"))

// Good - partial match (first field only)
.withIndex("by_author_and_status", (q) => q.eq("authorId", id))

// Bad - can't skip first field
.withIndex("by_author_and_status", (q) => q.eq("status", "published")) // WRONG
```

### Don't forget to create indexes for common queries
```typescript
// If you frequently query by userId, add an index
posts: defineTable({
  userId: v.id("users"),
  // ...
}).index("by_user", ["userId"]),
```
