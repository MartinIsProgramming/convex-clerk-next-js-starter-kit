# Streaming & Suspense Guide

## Principle: Only Loading States for Dynamic Parts

Static UI should render immediately. Only wrap the parts that fetch data in `<Suspense>`.

```
❌ WRONG: Entire page waits for data
┌─────────────────────────────┐
│ ░░░░░░░░░░░ (skeleton)      │
│ ░░░░░░░░░░░░░░░░░           │
│ ░░░░░░░░░░░░░░░░░░░░░░      │
└─────────────────────────────┘

✅ CORRECT: Static renders immediately, only data waits
┌─────────────────────────────────────────┐
│ Title (immediate)           [+ Button]  │
│ Description text...                     │
├─────────────────────────────────────────┤
│ [░░░░] [░░░░] [░░░░]  ← Only this       │
│ [░░░░] [░░░░] [░░░░]    has skeleton    │
└─────────────────────────────────────────┘
```

## Pattern: Granular Suspense in Pages

### ❌ Anti-pattern: Wrapping everything

```tsx
// page.tsx - WRONG
export default function ApartmentsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ApartmentsContent /> {/* Includes header + list */}
    </Suspense>
  );
}
```

### ✅ Correct: Static header, dynamic list

```tsx
// page.tsx - CORRECT
export default function ApartmentsPage() {
  return (
    <div className="space-y-6">
      {/* Static - renders immediately */}
      <PageHeader
        title="Apartamentos"
        description="Gestiona los apartamentos"
        action={{ label: "Nuevo", href: "/new" }}
      />

      {/* Dynamic - has Suspense */}
      <Suspense fallback={<ApartmentsGridSkeleton />}>
        <ApartmentsList />
      </Suspense>
    </div>
  );
}
```

## Pattern: Server Component as Children of Client Component

When you have a Client Component (form, modal) that needs data from the server for a specific part (select options, list), pass the Server Component as `children`.

### Use Case: Form with async Select options

```tsx
// page.tsx (Server Component)
export default function InvitePage() {
  return (
    <InviteTenantForm>
      <Suspense fallback={<SelectOptionsSkeleton />}>
        <ApartmentOptions />  {/* Server Component - fetches data */}
      </Suspense>
    </InviteTenantForm>
  );
}

// invite-tenant-form.tsx (Client Component)
"use client";

export function InviteTenantForm({ children }: { children: ReactNode }) {
  const { control } = useForm();

  return (
    <Card> {/* Renders immediately */}
      <form>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona..." />
          </SelectTrigger>
          <SelectContent>
            {children}  {/* Server Component streams here */}
          </SelectContent>
        </Select>
        <Input /> {/* Renders immediately */}
        <Button>Submit</Button> {/* Renders immediately */}
      </form>
    </Card>
  );
}

// apartment-options.tsx (Server Component)
export async function ApartmentOptions() {
  const apartments = await getApartments();

  return apartments.map((apt) => (
    <SelectItem key={apt.id} value={apt.id}>
      {apt.name}
    </SelectItem>
  ));
}
```

## Pattern: Convex preloadQuery for SSR + Reactivity

Use `preloadQuery` in Server Components to get data for initial render, then pass to Client Component for reactive updates.

```tsx
// page.tsx (Server Component)
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import { ProductList } from "./ProductList";

export default async function ProductsPage() {
  const token = await getAuthToken();
  const preloaded = await preloadQuery(api.products.list, {}, { token });

  return (
    <div className="space-y-6">
      {/* Static header - renders immediately */}
      <PageHeader
        title="Products"
        description="Manage your products"
      />

      {/* Preloaded data - no loading state needed! */}
      <ProductList preloaded={preloaded} />
    </div>
  );
}

// ProductList.tsx (Client Component)
"use client";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface Props {
  preloaded: Preloaded<typeof api.products.list>;
}

export function ProductList({ preloaded }: Props) {
  // Data available immediately, then updates reactively
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

### When to Use preloadQuery vs Suspense

| Scenario | Use |
|----------|-----|
| Convex data + reactivity needed | `preloadQuery` → `usePreloadedQuery` |
| Non-Convex async data | `Suspense` + async Server Component |
| Static Convex data (no updates) | `fetchQuery` in Server Component |
| Client-only reactive data | `useQuery` in Client Component |

### Result

```
Form loads:
┌─────────────────────────────────────┐
│ Invitar Inquilino (immediate)       │
├─────────────────────────────────────┤
│ Apartamento *                       │
│ [▼ ░░░░░░░░ ]  ← Only this loading  │
├─────────────────────────────────────┤
│ Email * (immediate)                 │
│ [                    ]              │
├─────────────────────────────────────┤
│ [Enviar] [Cancelar] (immediate)     │
└─────────────────────────────────────┘
```

## Avoiding Layout Shift

When a value is pre-selected but options haven't loaded yet, the placeholder will show until options load. Use a dynamic placeholder to reduce visual shift:

```tsx
<SelectValue
  placeholder={
    preselectedId
      ? "Cargando..."      // Similar length to final value
      : "Selecciona uno"   // Normal placeholder
  }
/>
```

## When to Use Each Pattern

| Scenario | Pattern |
|----------|---------|
| Page with header + data list | Granular Suspense (PageHeader outside) |
| Detail page `/resource/[id]` | DetailPageHeader in Content, all in Suspense |
| Form with async select options | Server Component as children |
| Modal with dynamic content | Server Component as children |
| Dashboard with multiple data sources | Multiple Suspense boundaries |

## Pattern: Detail Pages (`/resource/[id]`)

For detail pages, use `DetailPageHeader` with a simple title. Keep headers clean - move metadata (badges, status, etc.) to a context line below the header.

### Structure

```
┌─────────────────────────────────────┐
│ ← Apartamento 201                   │  ← DetailPageHeader (simple title)
│                                     │
│ [Vacío] · Piso 2                    │  ← Context line (badges, metadata)
│                                     │
│ ┌─────────────┐  ┌─────────────┐    │
│ │  Card 1     │  │  Card 2     │    │  ← Content cards
│ └─────────────┘  └─────────────┘    │
└─────────────────────────────────────┘
```

### Implementation

```tsx
// page.tsx (sync - minimal, just Suspense wrapper)
import { Suspense } from "react";
import { DetailPageSkeleton } from "@/components/ui/skeletons";

export default function ApartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<DetailPageSkeleton />}>
      <ApartmentDetailContent params={params} />
    </Suspense>
  );
}
```

```tsx
// apartment-detail-content.tsx (async - fetches data, renders header)
import { DetailPageHeader } from "@/components/shared/detail-page-header";

export async function ApartmentDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apartment = await getApartmentById(id);

  if (!apartment) notFound();

  return (
    <div className="space-y-6">
      {/* Header: simple, just the name */}
      <DetailPageHeader backHref="/admin/apartments">
        <h1 className="text-2xl font-bold tracking-tight">
          Apartamento {apartment.unitNumber}
        </h1>
      </DetailPageHeader>

      {/* Delegate to presentation component */}
      <ApartmentDetail apartment={apartment} />
    </div>
  );
}
```

```tsx
// apartment-detail.tsx (presentation - context line + cards)
export function ApartmentDetail({ apartment }: { apartment: Apartment }) {
  return (
    <div className="space-y-6">
      {/* Context line: badges, metadata */}
      <div className="flex items-center gap-2">
        <ApartmentStatusBadge status={apartment.status} />
        {apartment.floor && (
          <span className="text-sm text-muted-foreground">
            · Piso {apartment.floor}
          </span>
        )}
      </div>

      {/* Content cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <OwnerCard />
        <TenantCard />
      </div>
    </div>
  );
}
```

### Key Differences from List Pages

| Aspect | List Page | Detail Page |
|--------|-----------|-------------|
| Header | `PageHeader` with title + description + action | `DetailPageHeader` with simple title only |
| Title | Static ("Recursos") | Dynamic (resource name) |
| Metadata | In header description | In context line below header |
| Component | `@/components/shared/page-header` | `@/components/shared/detail-page-header` |
| Skeleton | `TableSkeleton` or `GridSkeleton` | `DetailPageSkeleton` |

### Header Guidelines

```
❌ WRONG: Overloaded header
┌─────────────────────────────────────┐
│ ← Apartamento 201 [Vacío]           │
│   Piso 2                            │
└─────────────────────────────────────┘

✅ CORRECT: Clean header, context below
┌─────────────────────────────────────┐
│ ← Apartamento 201                   │
│                                     │
│ [Vacío] · Piso 2                    │
└─────────────────────────────────────┘
```

## loading.tsx Considerations

If you use granular Suspense in `page.tsx`, the route's `loading.tsx` becomes redundant. Options:

1. **Return null** - Prevents parent loading.tsx from showing
2. **Delete it** - If no loading.tsx exists, parent's will show
3. **Keep specific skeleton** - For full-page loading scenarios

```tsx
// loading.tsx - when using granular Suspense in page
export default function Loading() {
  // Suspense in page.tsx handles loading states
  return null;
}
```
