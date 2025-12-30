# Convex Data Fetching

## Overview

| Method | Location | Reactive | Use Case |
|--------|----------|----------|----------|
| `useAuthQuery` | Client Component | Yes | **Authenticated queries** (preferred) |
| `useQuery` (TanStack) | Client Component | Yes | Public queries, complex options |
| `useMutation` | Client Component | - | Write operations |
| `useAction` | Client Component | - | External API calls |
| `usePaginatedQuery` | Client Component | Yes | Paginated lists |

## TanStack Query Integration

This project uses `@convex-dev/react-query` for client-side caching. When users navigate away and return, data is served from cache instantly while Convex syncs in the background.

### Setup (already configured in src/providers/index.tsx)

```tsx
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const convexQueryClient = new ConvexQueryClient(convex);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});
convexQueryClient.connect(queryClient);
```

## Data Fetching Pattern

### Page Structure

```
Page (Server Component) → ClientComponent (useQuery + convexQuery)
```

```tsx
// src/app/(admin)/admin/products/page.tsx
import { PageHeader, PageLayout, PageTitle } from "@/components/layout/page-layout";
import { ProductsDataTable } from "@/features/products/components/client/products-data-table";

export default function ProductsPage() {
  return (
    <PageLayout>
      <PageHeader>
        <PageTitle>Products</PageTitle>
      </PageHeader>
      <ProductsDataTable />
    </PageLayout>
  );
}
```

### Client Component with useQuery (TanStack)

```tsx
// src/features/products/components/client/products-data-table.tsx
"use client";

import { api } from "@convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { DataTable } from "@/components/shared/data-table";
import { TableSkeleton } from "@/components/ui/skeletons";

export function ProductsDataTable() {
  const { data: productsData, isPending } = useQuery(
    convexQuery(api.products.list, {}),
  );

  const rows = useMemo(
    () => productsData?.map((product) => ({
      id: product._id,
      name: product.name,
      price: product.price,
    })) ?? [],
    [productsData],
  );

  if (isPending) {
    return <TableSkeleton />;
  }

  return (
    <DataTable
      data={rows}
      columns={columns}
      filterColumn="name"
    />
  );
}
```

### useQuery with Arguments

```tsx
"use client";

import { api } from "@convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import type { Id } from "@convex/_generated/dataModel";

interface Props {
  categoryId: Id<"categories">;
}

export function ProductsByCategory({ categoryId }: Props) {
  const { data: products, isPending } = useQuery(
    convexQuery(api.products.listByCategory, { categoryId }),
  );

  if (isPending) {
    return <Skeleton />;
  }

  return <ProductGrid products={products ?? []} />;
}
```

## Write Operations

### useMutation

```tsx
"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
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
      // UI updates automatically via Convex reactivity
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

### useMutationWithToast (Project Helper)

```tsx
"use client";

import { api } from "@convex/_generated/api";
import { useMutationWithToast } from "@/hooks/use-mutation-with-toast";

export function DeleteButton({ productId }: { productId: Id<"products"> }) {
  const deleteProduct = useMutationWithToast(api.products.remove, {
    successMessage: "Product deleted",
    errorMessage: "Error deleting product",
  });

  return (
    <button onClick={() => deleteProduct({ id: productId })}>
      Delete
    </button>
  );
}
```

### useAction (External APIs)

```tsx
"use client";

import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
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

## Pagination

### usePaginatedQuery

```tsx
"use client";

import { usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";

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

## Conditional Queries

```tsx
"use client";

import { api } from "@convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import type { Id } from "@convex/_generated/dataModel";

interface Props {
  userId?: Id<"users">;
}

export function UserProfile({ userId }: Props) {
  const { data: user, isPending } = useQuery({
    ...convexQuery(api.users.getById, userId ? { id: userId } : "skip"),
    enabled: !!userId,
  });

  if (!userId) {
    return <p>Select a user</p>;
  }

  if (isPending) {
    return <Skeleton />;
  }

  return <div>{user?.name}</div>;
}
```

## Queries That Require Authentication

**IMPORTANT:** For queries that require authentication (queries using `requireAuth`, `requireOrg`, or `requireAdmin` in the backend), use the `useAuthQuery` hook.

### useAuthQuery Hook (Preferred)

The project provides a custom `useAuthQuery` hook (`src/hooks/use-auth-query.ts`) that automatically handles the authentication skip pattern:

```tsx
"use client";

import { api } from "@convex/_generated/api";

import { useAuthQuery } from "@/hooks/use-auth-query";

export function ResourcesDropdown() {
  const { data: resources } = useAuthQuery(api.resources.list, {});

  return (
    <select>
      {resources?.map((r) => (
        <option key={r._id} value={r._id}>{r.name}</option>
      ))}
    </select>
  );
}
```

### useAuthQuery with Arguments

```tsx
const { data: products } = useAuthQuery(api.products.listByCategory, {
  categoryId: "abc123",
});
```

### useAuthQuery with TanStack Query Options

For advanced options like `keepPreviousData` for smooth filter transitions:

```tsx
import { keepPreviousData } from "@tanstack/react-query";

import { useAuthQuery } from "@/hooks/use-auth-query";

const {
  data: products,
  isPending,
  isFetching,
  isPlaceholderData,
} = useAuthQuery(
  api.products.list,
  { search: filters.q || undefined },
  { placeholderData: keepPreviousData },
);
```

### When to Use useAuthQuery

- **ALWAYS** for queries that require authentication
- When adding queries in authenticated pages
- When the backend query uses `requireAuth`, `requireOrg`, or `requireAdmin`

### Manual Pattern (for reference)

If you need more control, you can use the manual pattern that `useAuthQuery` abstracts:

```tsx
"use client";

import { api } from "@convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useConvexAuth } from "convex/react";

export function ResourcesDropdown() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Skip query until auth is fully loaded AND authenticated
  const { data: resources } = useQuery(
    convexQuery(api.resources.list, !isLoading && isAuthenticated ? {} : "skip"),
  );

  return (
    <select>
      {resources?.map((r) => (
        <option key={r._id} value={r._id}>{r.name}</option>
      ))}
    </select>
  );
}
```

### Why This Matters

TanStack Query fires queries immediately on component mount, but Clerk's auth token might not be propagated to Convex yet. Without proper handling, you'll see "Not authenticated" errors in console during initial page load.

The `useAuthQuery` hook handles this automatically by:
1. Checking both `isLoading` and `isAuthenticated` from `useConvexAuth()`
2. Passing `"skip"` to `convexQuery` until auth is ready
3. Executing the query only when the user is fully authenticated

## Empty States

```tsx
"use client";

import { api } from "@convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Plus } from "lucide-react";

import { SimpleEmptyState } from "@/components/shared/simple-empty-state";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeletons";

export function ProductsDataTable() {
  const { data, isPending } = useQuery(
    convexQuery(api.products.list, {}),
  );

  if (isPending) {
    return <TableSkeleton />;
  }

  if (data?.length === 0) {
    return (
      <SimpleEmptyState
        icon={LayoutGrid}
        title="No products"
        description="Add your first product"
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create product
          </Button>
        }
      />
    );
  }

  return <DataTable data={data} columns={columns} />;
}
```

## Anti-patterns

### Handle loading states properly

```tsx
// Bad - no loading state
function ProductList() {
  const { data } = useQuery(convexQuery(api.products.list, {}));
  return data.map(p => <div>{p.name}</div>); // Error if undefined!
}

// Good - handle isPending
function ProductList() {
  const { data, isPending } = useQuery(convexQuery(api.products.list, {}));

  if (isPending) {
    return <ProductListSkeleton />;
  }

  return data?.map(p => <div key={p._id}>{p.name}</div>);
}
```

### Use correct imports

```tsx
// Bad - mixing imports
import { useQuery } from "convex/react";  // Wrong for TanStack pattern

// Good - TanStack Query imports
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
```

### Use useAuthQuery for authenticated queries

```tsx
// Bad - will cause auth errors on initial load
const { data } = useQuery(convexQuery(api.myPrivateQuery, {}));

// Good - handles auth automatically
const { data } = useAuthQuery(api.myPrivateQuery, {});
```
