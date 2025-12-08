# Starter Kit - Next.js + Convex

Full-stack starter con Next.js 15, Convex, Clerk auth, y shadcn/ui.

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
- **UI**: shadcn/ui + Radix UI
- **Linting**: Biome (no ESLint)

## Estructura

```
src/
├── app/              # Next.js App Router (pages, layouts)
├── components/ui/    # shadcn/ui components
├── features/         # Feature modules con components/{server,client}/
├── lib/              # Utilities (cn, auth)
└── hooks/            # Custom React hooks

convex/
├── schema.ts         # Database schema
├── *.ts              # Queries, mutations, actions
└── _generated/       # Auto-generated (no editar)
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
- Naming de índices: `by_field1_and_field2`
- Usar `internal*` para funciones privadas

## Skills Disponibles

- `frontend-builder` - Crear UI con Next.js, React, shadcn/ui
- `backend-builder` - Crear operaciones Convex (queries, mutations)
- `code-reviewer` - Revisar código después de commits

## Referencias

- Convex schema: @convex/schema.ts
- UI components: @src/components/ui/
- Configuración: @package.json, @tsconfig.json
