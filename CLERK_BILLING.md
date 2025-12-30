# Clerk Billing - Guía de Integración

Esta guía explica cómo usar Clerk Billing en el starter kit para agregar pagos y suscripciones a tu aplicación.

## ¿Qué es Clerk Billing?

Clerk Billing es una solución integrada de pagos que te permite:

- ✅ Crear planes de suscripción sin código backend
- ✅ Procesar pagos con Stripe sin configuración compleja
- ✅ Controlar acceso a features basado en suscripciones
- ✅ UI de pagos incluida (PricingTable, formularios)
- ✅ Sin webhooks necesarios (aunque disponibles)

**Costo:** 0.7% por transacción + fees de Stripe (mismo costo que Stripe Billing)

## Setup Rápido

### 1. Habilitar en Clerk Dashboard

1. Ve a: https://dashboard.clerk.com/~/billing/settings
2. Migra a Session JWT v2 (sigue instrucciones)
3. Click "Enable Billing"
4. Para desarrollo: usa "Clerk development gateway"
5. Para producción: conecta tu Stripe account

### 2. Crear Planes y Features

**IMPORTANTE:** Debes crear primero las **Features** y luego asignarlas a los **Planes**.

#### Paso 1: Crear Features

Ve a: https://dashboard.clerk.com/~/billing/features

Crea las siguientes features (los **slugs** son críticos):

| Feature Name    | Slug (generado automáticamente) | Descripción                            |
| --------------- | ------------------------------- | -------------------------------------- |
| Basic Access    | `basic_access`                  | Acceso básico para todos los planes    |
| Pro content     | `pro_content`                   | Contenido para planes Pro y superiores |
| Premium content | `premium_content`               | Contenido exclusivo para plan Premium  |

**⚠️ CRÍTICO - Verificar Slugs:**

- Después de crear cada feature, **abre la feature** y verifica el slug exacto
- El slug se genera automáticamente del nombre (ej: "Pro content" → `pro_content`)
- Si los slugs no coinciden con tu código, las validaciones `<Protect>` fallarán silenciosamente
- Anota los slugs exactos para usarlos en el código

#### Paso 2: Crear Planes

Ve a: https://dashboard.clerk.com/~/billing/plans → Click "Add User Plan"

**Configuración recomendada:**

**Plan: Free**

- Precio: $0/mes
- Features asignadas:
  - ✅ `basic_access`

**Plan: Pro**

- Precio: $19/mes (ej: $15/mes anual)
- Features asignadas:
  - ✅ `basic_access`
  - ✅ `pro_content`

**Plan: Premium**

- Precio: $49/mes (ej: $39/mes anual)
- Features asignadas:
  - ✅ `basic_access`
  - ✅ `pro_content`
  - ✅ `premium_content`

**💡 Por qué esta estructura:**

- Premium incluye TODAS las features → puede ver TODO el contenido
- Pro incluye features básicas + pro → puede ver Free y Pro
- Free solo tiene acceso básico → solo ve contenido Free
- Esto crea una jerarquía natural de acceso

### 3. Ya está listo!

El starter kit incluye todo el código necesario. Solo necesitas configurar los planes y features en el dashboard.

## Ejemplos de Uso

### 1. Página de Pricing

**Ruta:** `/pricing`
**Archivo:** `src/app/(auth)/pricing/page.tsx`

```tsx
import { Suspense } from "react";
import { PricingCards } from "./pricing-cards";

// Server Component (página principal)
export default function PricingPage() {
  return (
    <div>
      <h1>Planes de Suscripción</h1>

      {/* Suspense para loading atomic */}
      <Suspense fallback={<PricingCardsSkeleton />}>
        <PricingCards />
      </Suspense>
    </div>
  );
}
```

**Archivo:** `src/app/(auth)/pricing/pricing-cards.tsx`

```tsx
"use client";

import { PricingTable } from "@clerk/nextjs";

// Client Component (solo la parte dinámica)
export function PricingCards() {
  return <PricingTable fallback={<PricingCardsSkeleton />} />;
}
```

**Patrón correcto:**

- ✅ Página = Server Component
- ✅ Solo el componente con `<PricingTable>` es Client Component
- ✅ Usa `fallback` prop de PricingTable para skeleton (no Suspense)
- ✅ Mantén páginas atómicas y simples

### 2. Página Demo de Billing

**Ruta:** `/billing-demo`
**Archivo:** `src/app/(auth)/billing-demo/page.tsx`

Ejemplo completo de cómo mostrar contenido basado en suscripción en UNA sola página:

```tsx
import { Protect } from "@clerk/nextjs";
import Link from "next/link";

// Server Component - No necesita "use client"
export default function BillingDemoPage() {
  return (
    <div>
      <h1>Billing Demo</h1>

      {/* Free - Todos los planes */}
      <Protect
        feature="basic_access"
        fallback={
          <div>
            <h2>🔒 Suscripción Requerida</h2>
            <Link href="/pricing">Ver Planes</Link>
          </div>
        }
      >
        <div>✅ Contenido Free - Disponible para todos</div>
      </Protect>

      {/* Pro - Solo Pro y Premium */}
      <Protect
        feature="pro_content"
        fallback={
          <div>
            <h2>🔒 Plan Pro Requerido</h2>
            <Link href="/pricing">Upgrade a Pro</Link>
          </div>
        }
      >
        <div>🚀 Contenido Pro - Solo para Pro y Premium</div>
      </Protect>

      {/* Premium - Solo Premium */}
      <Protect
        feature="premium_content"
        fallback={
          <div>
            <h2>🔒 Plan Premium Requerido</h2>
            <Link href="/pricing">Upgrade a Premium</Link>
          </div>
        }
      >
        <div>💎 Contenido Premium - Solo para Premium</div>
      </Protect>
    </div>
  );
}
```

**Patrón correcto:**

- ✅ `<Protect>` funciona en Server Components (NO necesita "use client")
- ✅ Una sola página muestra diferentes secciones según el plan
- ✅ Usa `feature` (no `plan`) para jerarquía de acceso
- ✅ Simple, directo, sin componentes separados innecesarios

### 3. Validar en API Routes

**Archivo:** `src/app/api/premium/data/route.ts`

```tsx
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId, has } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validar feature específica
  if (!has({ feature: "premium_content" })) {
    return NextResponse.json({ error: "Premium required" }, { status: 403 });
  }

  return NextResponse.json({ data: "Premium data here" });
}
```

## Métodos de Control de Acceso

### Por Feature (Recomendado ✅)

```tsx
// En Server Component
import { auth } from "@clerk/nextjs/server";

export default async function Page() {
  const { has } = await auth();
  const hasFeature = has({ feature: "pro_content" });
}

// En Client Component
import { useAuth } from "@clerk/nextjs";

export function Component() {
  const { has } = useAuth();
  const hasFeature = has?.({ feature: "pro_content" });
}

// En JSX (Server o Client)
<Protect feature="pro_content">
  <Content />
</Protect>;
```

**Ventajas:**

- ✅ Jerarquía natural (Premium incluye Pro y Free)
- ✅ Flexible (varios planes pueden compartir features)
- ✅ Fácil cambiar planes sin tocar código
- ✅ Mejor para upgrades/downgrades

### Por Plan (No Recomendado ⚠️)

```tsx
const hasProPlan = has({ plan: "pro" });

<Protect plan="pro">
  <Content />
</Protect>;
```

**Problema:**

- ❌ Usuario con Premium NO puede ver contenido de Pro
- ❌ Valida plan exacto, no jerarquía
- ❌ Menos flexible

**Cuándo usar:**

- Solo para validar el plan activo actual
- Nunca para control de acceso a contenido

## Arquitectura de Archivos

```
src/
├── app/
│   ├── (auth)/
│   │   ├── pricing/
│   │   │   ├── page.tsx              # Server Component
│   │   │   └── pricing-cards.tsx     # Client Component (PricingTable)
│   │   ├── billing-demo/
│   │   │   └── page.tsx              # Server Component (ejemplo)
│   │   └── dashboard/
│   │       └── page.tsx              # Links a pricing/demo
│   └── api/
│       └── premium/
│           └── data/
│               └── route.ts          # API protegida
```

## Patrón Server/Client Components

**❌ INCORRECTO:**

```tsx
"use client";

import { Protect } from "@clerk/nextjs";

// Toda la página es Client Component (innecesario)
export default function Page() {
  return (
    <div>
      <h1>Mi Página</h1>
      <Protect feature="pro_content">
        <Content />
      </Protect>
    </div>
  );
}
```

**✅ CORRECTO:**

```tsx
import { Protect } from "@clerk/nextjs";

// Server Component (página principal)
export default function Page() {
  return (
    <div>
      <h1>Mi Página</h1>
      {/* Protect funciona en Server Components */}
      <Protect feature="pro_content">
        <Content />
      </Protect>
    </div>
  );
}
```

**Regla de oro:**

- Páginas = Server Components
- Solo componentes con interactividad real = Client Components
- `<Protect>` NO necesita "use client"

## Flujo de Usuario

1. **Usuario ve pricing** → `/pricing`
2. **Elige plan** → Click en botón del plan
3. **Completa pago** → Modal de Clerk con Stripe
4. **Suscripción activa** → Inmediatamente
5. **Acceso a contenido** → Features desbloqueadas automáticamente
6. **Gestión** → Desde `<UserButton>` → Billing tab

## Testing en Desarrollo

Clerk provee una cuenta Stripe de prueba compartida:

1. No necesitas crear cuenta Stripe
2. Usa "Clerk development gateway" en el dashboard
3. Usa [tarjetas de prueba de Stripe](https://docs.stripe.com/testing):
   - **Exitosa:** `4242 4242 4242 4242`
   - **Falla:** `4000 0000 0000 0002`
   - **Requiere 3D Secure:** `4000 0025 0000 3155`
4. Fecha de expiración: Cualquier fecha futura
5. CVV: Cualquier 3 dígitos

## Troubleshooting

### Problema: Features no se desbloquean

**Causa:** Los slugs de las features no coinciden con el código.

**Solución:**

1. Ve al Dashboard → Billing → Features
2. Haz click en cada feature
3. Verifica el slug exacto (ej: `pro_content`)
4. Actualiza el código para usar ese slug exacto:

```tsx
// ❌ Mal
<Protect feature="pro_features">

// ✅ Correcto (según slug del dashboard)
<Protect feature="pro_content">
```

### Problema: Usuario Premium no ve contenido Pro

**Causa:** Usaste `plan` en vez de `feature`.

**Solución:**

1. Ve al Dashboard → Billing → Plans → Premium
2. Verifica que tenga asignadas: `basic_access`, `pro_content`, `premium_content`
3. Cambia código para usar `feature` en vez de `plan`:

```tsx
// ❌ Mal - Premium no puede ver contenido Pro
<Protect plan="pro">

// ✅ Correcto - Premium incluye pro_content
<Protect feature="pro_content">
```

### Problema: Página con hydration errors

**Causa:** Usando "use client" innecesariamente.

**Solución:**

- Remove "use client" de las páginas
- `<Protect>` funciona en Server Components
- Solo usa "use client" para componentes con interactividad real

## Limitaciones Actuales (Beta)

| Limitación         | Estado                          |
| ------------------ | ------------------------------- |
| Moneda             | Solo USD                        |
| Taxes/VAT          | No soportado                    |
| Custom pricing     | No soportado                    |
| Merchant of Record | No (necesitas MoR propio)       |
| APIs               | Experimentales (pueden cambiar) |

## FAQs

### ¿Puedo usar mi cuenta Stripe existente?

Sí, pero debe ser una cuenta que no esté conectada a otra plataforma.

### ¿Los datos de suscripción se ven en Stripe?

Sí, puedes ver pagos y clientes en Stripe, pero los planes se manejan desde Clerk.

### ¿Cómo upgrade/downgrade usuarios?

Los usuarios pueden cambiar de plan desde:

- `<UserButton />` → Billing tab
- `<PricingTable />` (muestra plan actual)

Los upgrades son inmediatos, los downgrades al final del ciclo.

### ¿Clerk es el Merchant of Record?

No. Tú eres responsable de compliance, taxes, etc.

### ¿Qué pasa si cambio el nombre de una feature?

El **slug** se mantiene igual, así que el código sigue funcionando. Solo cambia el nombre visible en el UI.

### ¿Puedo tener features sin plan?

Sí, pero no sirven para nada. Las features deben estar asignadas a planes.

## Recursos

- **Documentación oficial:** [Clerk Billing Docs](https://clerk.com/docs/guides/billing/overview)
- **Componente Protect:** [Protect Docs](https://clerk.com/docs/nextjs/reference/components/control/protect)
- **PricingTable:** [PricingTable Docs](https://clerk.com/docs/nextjs/reference/components/billing/pricing-table)
- **Testing Stripe:** [Stripe Test Cards](https://docs.stripe.com/testing)

## Soporte

- **Issues:** [GitHub Issues](https://github.com/clerk/javascript/issues)
- **Discord:** [Clerk Discord](https://clerk.com/discord)
- **Email:** support@clerk.com

## Checklist de Setup

- [ ] Habilitar Billing en Dashboard
- [ ] Crear Features con slugs correctos
- [ ] Verificar slugs de cada feature
- [ ] Crear Planes (Free, Pro, Premium)
- [ ] Asignar features a cada plan correctamente
- [ ] Probar con tarjeta de prueba
- [ ] Verificar que Premium ve todo el contenido
- [ ] Verificar que Pro ve Free + Pro
- [ ] Verificar que Free solo ve contenido básico
- [ ] Conectar Stripe para producción
