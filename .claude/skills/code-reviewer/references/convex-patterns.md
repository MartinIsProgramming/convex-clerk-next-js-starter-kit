# Convex Code Review Patterns

Quick reference for reviewing Convex backend code.

---

## Function Syntax (REQUIRED)

**Always use new syntax with args/returns validators:**

```typescript
// ✅ Correct - new syntax with validators
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

// ❌ Wrong - old syntax without validators
export const getById = query(async (ctx, args) => {
  return await ctx.db.get(args.id);
});
```

---

## Validators Checklist

| Flag | Issue | Fix |
|------|-------|-----|
| Missing `args` | No input validation | Add `args: { ... }` with validators |
| Missing `returns` | No output type safety | Add `returns: v.*`, use `v.null()` if no return |
| Using `any` | Type unsafe | Use specific validators |
| `v.string()` for IDs | Wrong type | Use `v.id("tableName")` |
| No `v.optional()` | Required when field is optional | Wrap optional fields |

---

## Index Naming Convention

**Rule:** Include all indexed fields in the name: `by_field1_and_field2`

```typescript
// ✅ Correct naming
.index("by_email", ["email"])
.index("by_clerk_id", ["clerkId"])
.index("by_author_and_status", ["authorId", "status"])
.index("by_category_and_created", ["categoryId", "_creationTime"])

// ❌ Wrong naming
.index("email", ["email"])           // Missing "by_" prefix
.index("authorStatus", ["authorId", "status"])  // Not descriptive
.index("idx1", ["email"])            // Meaningless name
```

---

## Query Performance

| Flag | Issue | Fix |
|------|-------|-----|
| `.filter()` usage | Full table scan | Use `.withIndex()` |
| `.collect()` without limit | Memory issues on large tables | Add `.take(n)` or paginate |
| Missing index for common query | Slow queries | Add index to schema |

```typescript
// ❌ Wrong - full table scan
const posts = await ctx.db
  .query("posts")
  .filter((q) => q.eq(q.field("authorId"), authorId))
  .collect();

// ✅ Correct - uses index
const posts = await ctx.db
  .query("posts")
  .withIndex("by_author", (q) => q.eq("authorId", authorId))
  .collect();
```

---

## Function Types Reference

| Type | DB Access | External APIs | Visibility |
|------|-----------|---------------|------------|
| `query` | Yes | No | Public |
| `mutation` | Yes | No | Public |
| `action` | No* | Yes | Public |
| `internalQuery` | Yes | No | Private |
| `internalMutation` | Yes | No | Private |
| `internalAction` | No* | Yes | Private |

*Actions use `ctx.runQuery()` / `ctx.runMutation()` for DB access

**Flags:**
- `ctx.db` in action → Error: use `ctx.runQuery/runMutation`
- Public function that should be private → Change to `internal*`
- Calling external API in query/mutation → Move to action

---

## Naming Conventions

| Operation | Pattern | Examples |
|-----------|---------|----------|
| Get one | `get`, `getById`, `getByX` | `getById`, `getByEmail`, `getBySlug` |
| List many | `list`, `listByX` | `list`, `listByCategory`, `listByAuthor` |
| Create | `create` | `create` |
| Update | `update` | `update` |
| Delete | `remove` | `remove` |
| Toggle | `toggleX` | `toggleActive`, `togglePublished` |
| Search | `search` | `search` |

**Flags:**
- `fetchUser` → Rename to `getById` or `getByX`
- `getAllProducts` → Rename to `list`
- `deleteProduct` → Rename to `remove`

---

## Auth Patterns

### Required Checks

```typescript
// ✅ Correct - auth helper pattern
import { getAuthenticatedUser, requireAuthenticatedUser } from "./lib/auth";

export const createPost = mutation({
  args: { title: v.string(), content: v.string() },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx); // Throws if not auth

    return await ctx.db.insert("posts", {
      ...args,
      authorId: user._id, // Use auth user, not client-provided
    });
  },
});

// ❌ Wrong - trusting client-provided userId
export const createPost = mutation({
  args: { title: v.string(), userId: v.id("users") }, // Security issue!
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", {
      title: args.title,
      authorId: args.userId, // Never trust client!
    });
  },
});
```

### Flags

| Flag | Issue | Fix |
|------|-------|-----|
| `ctx.auth.getUserIdentity()` repeated | Code duplication | Extract to auth helper |
| Client-provided `userId` in args | Security vulnerability | Get from `ctx.auth` |
| Missing auth check in mutation | Unauthorized access | Add `requireAuthenticatedUser()` |
| No null check after `getUserIdentity()` | Runtime error | Handle unauthenticated case |

---

## Error Handling

```typescript
// ❌ Wrong - silencing errors
export const riskyOperation = mutation({
  handler: async (ctx, args) => {
    try {
      await doSomething();
    } catch (error) {
      console.log(error); // Error silenced!
      return null;
    }
  },
});

// ✅ Correct - let errors propagate
export const riskyOperation = mutation({
  handler: async (ctx, args) => {
    // Errors propagate to client automatically
    await doSomething();
  },
});

// ✅ Correct - specific error with context
export const transfer = mutation({
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error(`Account not found: ${args.accountId}`);
    }
    if (account.balance < args.amount) {
      throw new Error("Insufficient balance");
    }
    // ...
  },
});
```

**Flags:**
- Empty catch block → Remove try/catch or re-throw
- `catch (e) { return null }` → Let error propagate
- Generic "Something went wrong" → Use specific message

---

## Imports

```typescript
// ✅ Correct imports
import { query, mutation, action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

// ❌ Wrong - importing from wrong location
import { query } from "convex/server"; // Wrong!
```

---

## Quick Mental Checklist

When reviewing a Convex function, ask:

```
□ Has args validator?
□ Has returns validator?
□ Uses withIndex() instead of filter()?
□ Index naming follows by_field convention?
□ Auth check if mutation/action?
□ No try/catch silencing errors?
□ Uses internal* if private?
□ Correct function type (query/mutation/action)?
```
