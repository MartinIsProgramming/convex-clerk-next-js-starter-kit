# Convex Advanced Features

Advanced Convex features: crons, file storage, pagination, HTTP endpoints, and scheduling.

## Scheduled Functions

### One-time Scheduling
```typescript
export const sendReminder = mutation({
  args: { userId: v.id("users"), message: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Schedule for 24 hours from now
    await ctx.scheduler.runAfter(
      24 * 60 * 60 * 1000, // milliseconds
      internal.notifications.send,
      { userId: args.userId, message: args.message }
    );
    return null;
  },
});

// Schedule at specific time
export const scheduleAt = mutation({
  args: { timestamp: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.scheduler.runAt(
      args.timestamp,
      internal.tasks.execute,
      {}
    );
    return null;
  },
});
```

## Cron Jobs

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every hour
crons.interval(
  "cleanup old sessions",
  { hours: 1 },
  internal.sessions.cleanup,
  {}
);

// Run every day at midnight UTC
crons.cron(
  "daily report",
  "0 0 * * *",
  internal.reports.generateDaily,
  {}
);

// Run every 5 minutes
crons.interval(
  "sync external data",
  { minutes: 5 },
  internal.sync.external,
  {}
);

export default crons;
```

### Cron Syntax
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6, Sunday = 0)
│ │ │ │ │
* * * * *
```

Examples:
- `0 0 * * *` - Daily at midnight
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1` - Every Monday at 9 AM
- `*/15 * * * *` - Every 15 minutes

## File Storage

### Upload Files
```typescript
// Generate upload URL
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Save file reference
export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  returns: v.id("files"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("files", {
      storageId: args.storageId,
      fileName: args.fileName,
    });
  },
});
```

### Get File URL
```typescript
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
```

### Get File Metadata
```typescript
export const getFileMetadata = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(
    v.object({
      _id: v.id("_storage"),
      _creationTime: v.number(),
      contentType: v.optional(v.string()),
      sha256: v.string(),
      size: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.system.get(args.storageId);
  },
});
```

### Delete File
```typescript
export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
    return null;
  },
});
```

## Pagination

### Backend
```typescript
import { paginationOptsValidator } from "convex/server";

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("categories")),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("products"),
      _creationTime: v.number(),
      name: v.string(),
      price: v.number(),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    let query = ctx.db.query("products");

    if (args.categoryId) {
      query = query.withIndex("by_category", (q) =>
        q.eq("categoryId", args.categoryId)
      );
    }

    return await query.order("desc").paginate(args.paginationOpts);
  },
});
```

### Frontend Usage
```typescript
"use client";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ProductList() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.products.listPaginated,
    { categoryId: undefined },
    { initialNumItems: 10 }
  );

  return (
    <div>
      {results.map((product) => (
        <div key={product._id}>{product.name}</div>
      ))}

      {status === "CanLoadMore" && (
        <button onClick={() => loadMore(10)}>Load More</button>
      )}

      {status === "LoadingMore" && <div>Loading...</div>}
    </div>
  );
}
```

## HTTP Endpoints

### Basic Setup
```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// GET endpoint
http.route({
  path: "/api/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// POST endpoint
http.route({
  path: "/api/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();

    await ctx.runMutation(internal.webhooks.process, {
      payload: body,
    });

    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

### With Path Parameters
```typescript
http.route({
  path: "/api/users/{userId}",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const userId = url.pathname.split("/").pop();

    const user = await ctx.runQuery(api.users.getById, { id: userId });

    if (!user) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(JSON.stringify(user), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});
```

### Webhook with Signature Verification
```typescript
import { Webhook } from "svix";

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET");
    }

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing headers", { status: 400 });
    }

    const body = await request.text();

    const wh = new Webhook(webhookSecret);
    let payload;

    try {
      payload = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err) {
      return new Response("Invalid signature", { status: 400 });
    }

    // Process webhook...
    await ctx.runMutation(internal.users.syncFromClerk, payload);

    return new Response("OK", { status: 200 });
  }),
});
```

## Full-Text Search

### Schema with Search Index
```typescript
export default defineSchema({
  articles: defineTable({
    title: v.string(),
    body: v.string(),
    category: v.string(),
    authorId: v.id("users"),
  })
    .index("by_author", ["authorId"])
    .searchIndex("search_content", {
      searchField: "body",
      filterFields: ["category", "authorId"],
    }),
});
```

### Search Query
```typescript
export const search = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("articles"),
    title: v.string(),
    body: v.string(),
    category: v.string(),
  })),
  handler: async (ctx, args) => {
    let searchQuery = ctx.db
      .query("articles")
      .withSearchIndex("search_content", (q) => {
        let search = q.search("body", args.query);
        if (args.category) {
          search = search.eq("category", args.category);
        }
        return search;
      });

    return await searchQuery.take(args.limit ?? 10);
  },
});
```

## Environment Variables

Access in actions:
```typescript
"use node";
import { action } from "./_generated/server";

export const callExternalApi = action({
  args: {},
  returns: v.null(),
  handler: async () => {
    const apiKey = process.env.EXTERNAL_API_KEY;
    if (!apiKey) {
      throw new Error("EXTERNAL_API_KEY not set");
    }

    await fetch("https://api.example.com", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    return null;
  },
});
```

Set via Convex dashboard or CLI:
```bash
npx convex env set EXTERNAL_API_KEY "your-api-key"
```
