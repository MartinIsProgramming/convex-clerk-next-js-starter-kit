# Convex Data Fetching

How to fetch data from Convex in Next.js applications.

## Overview

| Method | Location | Reactive | Use Case |
|--------|----------|----------|----------|
| `useQuery` | Client Component | Yes | Real-time data |
| `useMutation` | Client Component | - | Write operations |
| `useAction` | Client Component | - | External API calls |
| `preloadQuery` | Server Component | Yes* | SSR with reactivity |
| `fetchQuery` | Server Component | No | Static data |
| `fetchMutation` | Server Action | No | Server-side writes |

*Reactive after hydration

## Client-Side Data Fetching

### useQuery (Reactive Reads)
```tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ProductList() {
  const products = useQuery(api.products.list);

  // Loading state
  if (products === undefined) {
    return <ProductListSkeleton />;
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
```

### useQuery with Arguments
```tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface Props {
  categoryId: Id<"categories">;
}

export function ProductsByCategory({ categoryId }: Props) {
  const products = useQuery(api.products.listByCategory, { categoryId });

  if (products === undefined) {
    return <Skeleton />;
  }

  return <ProductGrid products={products} />;
}
```

### useMutation (Write Operations)
```tsx
"use client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export function CreateProductForm() {
  const createProduct = useMutation(api.products.create);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      await createProduct({
        name: formData.get("name") as string,
        price: Number(formData.get("price")),
      });
      // Success - UI updates automatically
    } catch (error) {
      console.error("Failed to create product:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form action={handleSubmit}>
      <input name="name" required />
      <input name="price" type="number" required />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

### useAction (External APIs)
```tsx
"use client";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export function AIGenerator() {
  const generateText = useAction(api.ai.generate);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerate() {
    setIsLoading(true);
    try {
      const text = await generateText({ prompt: "Hello, world!" });
      setResult(text);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleGenerate} disabled={isLoading}>
        Generate
      </button>
      {result && <p>{result}</p>}
    </div>
  );
}
```

## Server-Side Data Fetching

### preloadQuery (SSR + Reactivity)

Best for: Initial data that should update in real-time after page load.

```tsx
// app/products/page.tsx (Server Component)
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { ProductList } from "./ProductList";

export default async function ProductsPage() {
  const preloaded = await preloadQuery(api.products.list);
  return <ProductList preloaded={preloaded} />;
}
```

```tsx
// app/products/ProductList.tsx (Client Component)
"use client";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface Props {
  preloaded: Preloaded<typeof api.products.list>;
}

export function ProductList({ preloaded }: Props) {
  // Data is available immediately, then updates reactively
  const products = usePreloadedQuery(preloaded);

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
```

### preloadQuery with Auth
```tsx
// lib/auth.ts
import { auth } from "@clerk/nextjs/server";

export async function getAuthToken() {
  const authResult = await auth();
  return (await authResult.getToken({ template: "convex" })) ?? undefined;
}
```

```tsx
// app/dashboard/page.tsx
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import { Dashboard } from "./Dashboard";

export default async function DashboardPage() {
  const token = await getAuthToken();

  const preloaded = await preloadQuery(
    api.dashboard.getData,
    {}, // args
    { token } // options
  );

  return <Dashboard preloaded={preloaded} />;
}
```

### fetchQuery (Static Data)

Best for: Data that doesn't need real-time updates.

```tsx
// app/about/page.tsx (Server Component)
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function AboutPage() {
  const stats = await fetchQuery(api.stats.getPublic);

  return (
    <div>
      <h1>About Us</h1>
      <p>Total users: {stats.totalUsers}</p>
      <p>Total products: {stats.totalProducts}</p>
    </div>
  );
}
```

### fetchMutation (Server Actions)
```tsx
// app/products/actions.ts
"use server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  const token = await getAuthToken();

  await fetchMutation(
    api.products.create,
    {
      name: formData.get("name") as string,
      price: Number(formData.get("price")),
    },
    { token }
  );

  revalidatePath("/products");
}
```

```tsx
// app/products/CreateForm.tsx
import { createProduct } from "./actions";

export function CreateProductForm() {
  return (
    <form action={createProduct}>
      <input name="name" required />
      <input name="price" type="number" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

## Pagination

### usePaginatedQuery
```tsx
"use client";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ProductList() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.products.listPaginated,
    {},
    { initialNumItems: 10 }
  );

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {results.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {status === "CanLoadMore" && (
        <button onClick={() => loadMore(10)}>Load More</button>
      )}

      {status === "LoadingMore" && <p>Loading...</p>}

      {status === "Exhausted" && <p>No more products</p>}
    </div>
  );
}
```

## Optimistic Updates

```tsx
"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function TodoItem({ todo }) {
  const updateTodo = useMutation(api.todos.update);

  async function handleToggle() {
    // Optimistic update happens automatically
    // Convex updates the UI before the mutation completes
    await updateTodo({
      id: todo._id,
      completed: !todo.completed,
    });
  }

  return (
    <label>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
      />
      {todo.text}
    </label>
  );
}
```

## Conditional Queries

```tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface Props {
  userId?: Id<"users">;
}

export function UserProfile({ userId }: Props) {
  // Query only runs if userId is defined
  const user = useQuery(
    api.users.getById,
    userId ? { id: userId } : "skip"
  );

  if (!userId) {
    return <p>Select a user</p>;
  }

  if (user === undefined) {
    return <Skeleton />;
  }

  return <div>{user.name}</div>;
}
```

## Anti-patterns

### Don't fetch in Server Components then pass to Client for reactivity
```tsx
// Bad - loses reactivity
// Server Component
export default async function Page() {
  const products = await fetchQuery(api.products.list); // Static!
  return <ProductList products={products} />; // No updates
}

// Good - use preloadQuery for reactivity
export default async function Page() {
  const preloaded = await preloadQuery(api.products.list);
  return <ProductList preloaded={preloaded} />; // Reactive!
}
```

### Don't make multiple preloadQuery calls on same page
```tsx
// Bad - inconsistent data (no guaranteed consistency)
export default async function Page() {
  const users = await preloadQuery(api.users.list);
  const posts = await preloadQuery(api.posts.list);
  // users and posts may be from different points in time!
}

// Good - single query that returns all needed data
export default async function Page() {
  const preloaded = await preloadQuery(api.dashboard.getData);
  // Returns { users, posts } from same transaction
}
```

### Handle loading states properly
```tsx
// Bad - no loading state
function ProductList() {
  const products = useQuery(api.products.list);
  return products.map(p => <div>{p.name}</div>); // Error if undefined!
}

// Good - handle undefined
function ProductList() {
  const products = useQuery(api.products.list);

  if (products === undefined) {
    return <ProductListSkeleton />;
  }

  return products.map(p => <div key={p._id}>{p.name}</div>);
}
```
