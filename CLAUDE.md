# Starter Kit - Next.js + Convex

Full-stack starter con Next.js 15, Convex, Clerk auth, TanStack Query, y shadcn/ui.

## Comandos

```bash
pnpm dev          # Inicia frontend + backend en paralelo
pnpm build        # Build de producción
pnpm lint         # Verificar linting (Biome)
pnpm lint:fix     # Arreglar linting
pnpm format       # Formatear código
pnpm knip         # Detectar código no usado
```

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4
- **Backend**: Convex (real-time database)
- **Auth**: Clerk (integrado con Convex)
- **Data Fetching**: TanStack Query + @convex-dev/react-query
- **UI**: shadcn/ui + Radix UI
- **Forms**: React Hook Form + Zod
- **Linting**: Biome (no ESLint)

## Estructura

```
src/
├── app/                    # Next.js App Router (pages, layouts)
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── shared/             # Reusable components (DataTable, dialogs, etc.)
├── features/               # Feature modules con components/{server,client}/
├── hooks/                  # Custom React hooks (useAuthQuery, useMutationWithToast)
├── lib/                    # Utilities (cn, auth)
└── provider/               # React providers (Convex, Theme)

convex/
├── schema.ts               # Database schema
├── lib/                    # Helpers (auth, validators)
│   ├── auth.ts             # getAuthContext, requireAuth
│   └── validators.ts       # Entity validators (userValidator, etc.)
├── *.ts                    # Queries, mutations, actions
└── _generated/             # Auto-generated (no editar)
```

## Skills (IMPORTANTE)

Usar ANTES de implementar:

| Skill | Cuando Usar |
|-------|-------------|
| `backend-builder` | Convex schema, queries, mutations, auth helpers |
| `frontend-builder` | React components, pages, forms, data fetching, shadcn/ui |

## Data Fetching

### TanStack Query + Convex

El starter usa TanStack Query con `@convex-dev/react-query` para:
- Cache del lado del cliente
- Invalidacion automatica
- Skip queries cuando no esta autenticado

### useAuthQuery (para queries autenticadas)

```tsx
import { useAuthQuery } from "@/hooks/use-auth-query";
import { api } from "@convex/_generated/api";

function MyComponent() {
  const { data, isPending, error } = useAuthQuery(api.users.list, {});
  // Automaticamente hace skip si no esta autenticado
}
```

### useMutationWithToast (para mutations)

```tsx
import { useMutationWithToast } from "@/hooks/use-mutation-with-toast";
import { api } from "@convex/_generated/api";

function MyComponent() {
  const { mutate, isPending } = useMutationWithToast(api.users.create, {
    loadingMessage: "Creando usuario...",
    successMessage: "Usuario creado",
    onSuccess: () => {
      // Cerrar dialog, etc.
    },
  });
}
```

## Shared Components

### DataTable

```tsx
import { DataTable } from "@/components/shared/data-table/data-table";
import { columns } from "./columns";

<DataTable columns={columns} data={users ?? []} searchPlaceholder="Buscar..." />
```

### ConfirmActionDialog

```tsx
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";

<ConfirmActionDialog
  open={open}
  onOpenChange={setOpen}
  title="Eliminar usuario"
  description="Esta accion no se puede deshacer."
  confirmText="Eliminar"
  variant="destructive"
  isPending={isPending}
  onConfirm={() => mutate({ id: userId })}
/>
```

### DialogLoadingOverlay

```tsx
import { DialogLoadingOverlay } from "@/components/shared/dialog-loading-overlay";

<Dialog>
  <DialogContent>
    <DialogLoadingOverlay isLoading={isPending} />
    {/* Content */}
  </DialogContent>
</Dialog>
```

## Convex Helpers

### Auth Helpers (convex/lib/auth.ts)

```ts
import { getAuthContext, requireAuth } from "./lib/auth";

export const myQuery = query({
  handler: async (ctx) => {
    const auth = await getAuthContext(ctx); // Puede retornar null
    const user = await requireAuth(ctx);    // Lanza error si no autenticado
  },
});
```

### Validators (convex/lib/validators.ts)

```ts
import { userValidator, userPartialValidator } from "./lib/validators";

export const createUser = mutation({
  args: userValidator,
  handler: async (ctx, args) => { ... },
});
```

## Convenciones

### Imports
- Usar `@/*` para src/, `@convex/*` para convex/
- No usar imports relativos con `../`

### Componentes
- Server Components por defecto (sin "use client")
- Naming: `*Content`, `*Skeleton`, `*Form`, `*Dialog`
- Ubicar en `features/[feature]/components/{server,client}/`

### Styling
- Solo Tailwind CSS, no custom CSS
- Usar `cn()` de `@/lib/utils` para clases condicionales

### Convex Functions
- Siempre incluir `args` y `returns` validators
- Usar `withIndex()` en lugar de `filter()`
- Naming de indices: `by_field1_field2` (NO `by_field1_and_field2`)
- Usar `internal*` para funciones privadas

### Forms con Datos Externos (CRITICO)

Usar `values` prop de React Hook Form, NO useEffect:

```tsx
// CORRECTO
const formValues = data ? { name: data.name } : undefined;
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: "" },
  values: formValues,  // Sincroniza automaticamente
  resetOptions: { keepDirtyValues: true },
});

// INCORRECTO - NO hacer esto
useEffect(() => {
  if (data) form.reset(data);  // Anti-pattern!
}, [data]);
```

## Referencias

- Convex schema: `convex/schema.ts`
- UI components: `src/components/ui/`
- Shared components: `src/components/shared/`
- Hooks: `src/hooks/`
- Convex helpers: `convex/lib/`
- Skills: `.claude/skills/`
