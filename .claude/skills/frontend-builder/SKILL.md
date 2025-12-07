---
name: frontend-builder
description: Build frontend with Next.js, React, Tailwind CSS, shadcn/ui, and Convex. Use when creating UI components, pages, or forms. ALWAYS check src/components/ui/ before installing new components. Pair with backend-builder for full-stack.
---

# Frontend Builder (Next.js + Convex)

## Workflow

1. **Check existing components** → `src/components/ui/` and `src/shared/components/`
2. **Determine component type:**
   - Needs hooks/events/browser APIs? → Client Component (see references/client-components.md)
   - Needs Convex hooks (useQuery/useMutation)? → Client Component
   - Everything else? → Server Component (default)
3. **Need Convex data?** → See references/convex-data-fetching.md
4. **Need shadcn components?** → Ask user first, then see references/shadcn.md
5. **Building a form?** → STOP. Read references/forms.md first (required)
6. **Create component** → Place in `src/features/[feature]/components/server/` or `client/`
7. **Create/update page** → `src/app/(auth)/` or `(guest)/`

## Critical Rules

```
NEVER:
├── Add "use client" without useState/useEffect/event handlers/browser APIs
├── Fetch data in Client Components (pass via props from Server Component)
├── Install shadcn components without asking user first
├── Use custom CSS files or inline styles (use Tailwind)
└── Create components that already exist in src/components/ui/

ALWAYS:
├── Server Components by default (no directive needed)
├── Wrap async components in <Suspense> with skeleton fallback
├── Use granular Suspense (only wrap dynamic parts, not entire pages)
├── Use cn() from @/shared/lib/utils for conditional classes
└── Place files in feature folders: src/features/[feature]/components/
```

## Component Naming Conventions

| Suffix | Type | Location | Purpose |
|--------|------|----------|---------|
| `*Content` | Server | `server/` | Data fetching component |
| `*Skeleton` | Server | `server/` | Loading state |
| `*Form` | Client | `client/` | Form with validation |
| `*Dialog` | Client | `client/` | Modal component |
| `*DataTable` | Client | `client/` | TanStack table |
| `*Card` | Server | `server/` | Presentation card |

Examples: `ApartmentsListContent`, `AdminStatsSkeleton`, `NewApartmentForm`, `ConfirmReservationDialog`

## Quick Patterns

### Server Component with preloadQuery (SSR + Reactivity)
```tsx
// src/app/(auth)/products/page.tsx
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import { ProductList } from "@/features/products/components/client/product-list";

export default async function ProductsPage() {
  const token = await getAuthToken();
  const preloaded = await preloadQuery(api.products.list, {}, { token });

  return (
    <div className="space-y-6">
      <PageHeader title="Products" />
      <ProductList preloaded={preloaded} />
    </div>
  );
}
```

### Client Component with usePreloadedQuery
```tsx
// src/features/products/components/client/product-list.tsx
"use client";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface Props {
  preloaded: Preloaded<typeof api.products.list>;
}

export function ProductList({ preloaded }: Props) {
  const products = usePreloadedQuery(preloaded);
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((p) => <ProductCard key={p._id} product={p} />)}
    </div>
  );
}
```

### Client Component with useQuery (Client-only)
```tsx
// src/features/products/components/client/product-list.tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ProductList() {
  const products = useQuery(api.products.list);

  if (products === undefined) {
    return <ProductListSkeleton />;
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((p) => <ProductCard key={p._id} product={p} />)}
    </div>
  );
}
```

### Client Component with useMutation
```tsx
// src/features/products/components/client/add-to-cart.tsx
"use client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function AddToCart({ productId }: { productId: Id<"products"> }) {
  const addToCart = useMutation(api.cart.add);

  async function handleClick() {
    await addToCart({ productId });
    // UI updates automatically!
  }

  return <button onClick={handleClick}>Add to Cart</button>;
}
```

## References

- **Convex Data Fetching** → references/convex-data-fetching.md (preloadQuery, useQuery, useMutation)
- **Forms** → references/forms.md (REQUIRED before building any form)
- **Client Components** → references/client-components.md (decision guide + Convex hooks)
- **Streaming & Suspense** → references/streaming-suspense.md (granular loading states)
- **shadcn/ui** → references/shadcn.md (MCP usage patterns)
- **User Display** → references/user-display.md (getUserDisplayInfo utility)
