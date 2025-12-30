---
name: frontend-builder
description: Build frontend with Next.js, React, Tailwind CSS, shadcn/ui, and Convex. INVOKE THIS SKILL when modifying layouts, sidebars, pages, components, forms, or any UI code. Use TanStack Query for data fetching with client-side cache. ALWAYS check src/components/ui/ before installing new components. Pair with backend-builder for full-stack.
---

# Frontend Builder (Next.js + Convex)

> **CRITICAL:** This skill REQUIRES using the `mcp__sequential-thinking__sequentialthinking` tool BEFORE writing any code. Do NOT skip this step.

## 0. Sequential Thinking Planning (MANDATORY)

Before writing ANY frontend code, you MUST use the sequential thinking MCP to plan your implementation. This ensures well-designed components rather than rushed code.

### How to Use Sequential Thinking

After understanding what needs to be built, invoke sequential thinking with this structure:

**Thought 1: Understanding the Requirement**
- What exactly needs to be built?
- What is the user interaction flow?
- What data does this component need?

**Thought 2: Existing Code Analysis (MANDATORY for dialogs/forms)**
- What existing components/patterns can be reused?
- Are there similar components in `src/features/` or `src/components/`?
- What shadcn/ui components are already installed?
- **IF building a dialog/form**: Search `src/features/*/components/client/*-dialog.tsx` and READ at least one similar dialog to copy its pattern.

**Thought 3: Component Architecture**
- Server or Client Component? Why?
- What's the component hierarchy?
- What props does each component need?
- How will state be managed?

**Thought 4: Data Flow Design**
- What Convex queries/mutations are needed?
- TanStack Query vs direct useMutation?
- How to handle loading/error states?

**Thought 5: UI/UX Considerations**
- What's the optimal layout?
- Loading states and skeletons?
- Error handling and user feedback?
- Accessibility concerns?

**Thought 6: Implementation Plan**
- List files to create/modify in order
- Dependencies between files
- What to implement first

Set `totalThoughts: 6` minimum, but use `needsMoreThoughts: true` for complex UIs.

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
  "thought": "I need to build a data table for reservations with filters. Let me understand the full requirements: it needs to show reservation date, user, resource, status, and allow filtering by date range and status...",
  "thoughtNumber": 1,
  "totalThoughts": 6,
  "nextThoughtNeeded": true
}
```

---

## Workflow (After Sequential Thinking)

1. **Check existing components** → `src/components/ui/` and `src/components/shared/`
2. **Determine component type:**
   - Needs hooks/events/browser APIs? → Client Component (see references/client-components.md)
   - Needs Convex hooks (useQuery/useMutation)? → Client Component
   - Everything else? → Server Component (default)
3. **Need Convex data?** → See references/convex-data-fetching.md
4. **Need shadcn components?** → Ask user first, then see references/shadcn.md
5. **Building a form?** → STOP. Read references/forms.md first (required)
6. **Create component** → Place in `src/features/[feature]/components/client/`
7. **Create/update page** → `src/app/`

## Critical Rules

```
NEVER:
├── Add "use client" without useState/useEffect/event handlers/browser APIs
├── Install shadcn components without asking user first
├── Use custom CSS files or inline styles (use Tailwind)
└── Create components that already exist in src/components/ui/

ALWAYS:
├── Server Components by default (no directive needed)
├── Use TanStack Query for data fetching (useQuery + convexQuery)
├── Handle isPending state with skeleton fallback
├── Use cn() from @/lib/utils for conditional classes
└── Place files in feature folders: src/features/[feature]/components/
```

## Dialog & Form Anti-Patterns (CRITICAL)

**BEFORE creating ANY dialog or form, you MUST:**
1. Read `references/forms.md` completely
2. Search for existing dialogs: `src/features/*/components/client/*-dialog.tsx`
3. Copy the pattern from an existing similar dialog

**NEVER do this in dialogs/forms:**

```tsx
// ❌ FORBIDDEN: useEffect to sync form with props/query data
useEffect(() => {
  if (data) {
    form.reset({ ...data });
  }
}, [data, form]);

// ❌ FORBIDDEN: Multiple useState for form values
const [amount, setAmount] = useState(0);
const [date, setDate] = useState("");
```

**ALWAYS do this instead:**

```tsx
// ✅ CORRECT: Use the `values` prop for external data
const formValues = data ? { name: data.name, amount: data.amount } : undefined;

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: "", amount: 0 },
  values: formValues,  // Syncs automatically when data changes
  resetOptions: { keepDirtyValues: true },
  mode: "onChange",
});

// ✅ CORRECT: Use DialogLoadingOverlay while loading
return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {isPending ? (
      <DialogLoadingOverlay text="Loading..." />
    ) : (
      <DialogContent>...</DialogContent>
    )}
  </Dialog>
);
```

## Component Naming Conventions

| Suffix | Type | Location | Purpose |
|--------|------|----------|---------|
| `*DataTable` | Client | `client/` | TanStack table with data fetching |
| `*Form` | Client | `client/` | Form with validation |
| `*Dialog` | Client | `client/` | Modal component |
| `*Card` | Server | `server/` | Presentation card |
| `*Skeleton` | Server | `server/` | Loading state |

Examples: `ProductsDataTable`, `NewProductDialog`, `NewProductForm`

## Quick Patterns

### Page with Data Table

```tsx
// src/app/(dashboard)/products/page.tsx
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

### Client Component with TanStack Query

```tsx
// src/features/products/components/client/products-data-table.tsx
"use client";

import { api } from "@convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { DataTable } from "@/components/shared/data-table/data-table";
import { TableSkeleton } from "@/components/ui/skeletons";

export function ProductsDataTable() {
  const { data: productsData, isPending } = useQuery(
    convexQuery(api.products.list, {}),
  );

  const rows = useMemo(
    () => productsData?.map((p) => ({ id: p._id, name: p.name })) ?? [],
    [productsData],
  );

  if (isPending) {
    return <TableSkeleton />;
  }

  return <DataTable data={rows} columns={columns} columnLabels={columnLabels} />;
}
```

### Client Component with useAuthQuery (Authenticated)

```tsx
// src/features/products/components/client/my-products-list.tsx
"use client";

import { api } from "@convex/_generated/api";
import { useAuthQuery } from "@/hooks/use-auth-query";
import { TableSkeleton } from "@/components/ui/skeletons";

export function MyProductsList() {
  const { data: products, isPending } = useAuthQuery(api.products.listMine, {});

  if (isPending) {
    return <TableSkeleton />;
  }

  return (
    <ul>
      {products?.map((p) => <li key={p._id}>{p.name}</li>)}
    </ul>
  );
}
```

### Client Component with useMutation

```tsx
// src/features/products/components/client/delete-product-button.tsx
"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export function DeleteProductButton({ productId }: { productId: Id<"products"> }) {
  const deleteProduct = useMutation(api.products.remove);

  async function handleClick() {
    await deleteProduct({ id: productId });
    // UI updates automatically!
  }

  return <button onClick={handleClick}>Delete</button>;
}
```

### Form Dialog Pattern

```tsx
// src/features/products/components/client/edit-product-dialog.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuthQuery } from "@/hooks/use-auth-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogLoadingOverlay } from "@/components/shared/dialog-loading-overlay";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
});

type FormData = z.infer<typeof schema>;

type Props = {
  productId: Id<"products"> | null;
  onClose: () => void;
};

export function EditProductDialog({ productId, onClose }: Props) {
  const { data: product, isPending } = useAuthQuery(
    api.products.getById,
    productId ? { id: productId } : "skip",
  );

  const updateProduct = useMutation(api.products.update);

  // Use values prop for external data sync
  const formValues = product
    ? { name: product.name, price: product.price }
    : undefined;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", price: 0 },
    values: formValues,
    resetOptions: { keepDirtyValues: true },
    mode: "onChange",
  });

  const onSubmit = async (data: FormData) => {
    if (!productId) return;
    await updateProduct({ id: productId, ...data });
    toast.success("Product updated");
    reset(data);
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={!!productId} onOpenChange={(open) => !open && handleClose()}>
      {isPending ? (
        <DialogLoadingOverlay text="Loading product..." />
      ) : (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    {...field}
                    id="name"
                    aria-invalid={!!errors.name}
                    data-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    {...field}
                    id="price"
                    type="number"
                    aria-invalid={!!errors.price}
                    data-invalid={!!errors.price}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                </div>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || !isValid || isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
```

## Quick Utils

- **User display**: Use `getUserDisplayInfo()` from `@/lib/user-utils` for name, email, avatar, initials

## References

- **Convex Data Fetching** → references/convex-data-fetching.md (TanStack Query, useMutation)
- **Forms** → references/forms.md (REQUIRED before building any form)
- **Client Components** → references/client-components.md (decision guide, Convex hooks, Suspense)
- **shadcn/ui** → references/shadcn.md (MCP usage patterns)
