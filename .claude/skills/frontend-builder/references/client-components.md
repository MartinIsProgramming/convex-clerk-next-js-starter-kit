# Client Components Guide

## Decision: Do I need "use client"?

```
Does component use any of these?
├── useState, useEffect, useRef, useContext → YES, add "use client"
├── onClick, onChange, onSubmit, any event handler → YES, add "use client"
├── Browser APIs (localStorage, window, navigator) → YES, add "use client"
├── Convex hooks (useQuery, useMutation, useAction) → YES, add "use client"
├── Third-party hooks (useForm, useQuery) → YES, add "use client"
└── None of the above → NO, keep as Server Component
```

**When unsure: Keep as Server Component.** You'll get a clear error if it needs "use client".

## Anti-patterns (NEVER do this)

### ❌ Fetching data in Client Component
```tsx
"use client";
export function ProductList() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts); // WRONG
  }, []);
}
```

### ✅ Pass data from Server Component
```tsx
// Server Component (parent)
export async function ProductPage() {
  const products = await getProducts(); // fetch here
  return <ProductList products={products} />; // pass as props
}

// Client Component (child)
"use client";
export function ProductList({ products }: { products: Product[] }) {
  // use products, no fetching
}
```

### ❌ Making entire page a Client Component
```tsx
"use client"; // WRONG - don't add this to pages
export default function ProductsPage() { ... }
```

### ✅ Isolate client logic in small components
```tsx
// page.tsx (Server Component)
export default function ProductsPage() {
  return (
    <div>
      <ProductList /> {/* Server Component */}
      <AddToCartButton /> {/* Client Component - isolated */}
    </div>
  );
}
```

### ❌ Using "use client" just for async/await
```tsx
"use client"; // WRONG - async doesn't require this
export async function UserProfile() {
  const user = await getUser();
}
```

### ✅ Server Components can be async
```tsx
// No directive needed
export async function UserProfile() {
  const user = await getUser(); // works in Server Components
  return <div>{user.name}</div>;
}
```

## Composition Pattern

Keep Client Components as leaves, Server Components as containers:

```
Page (Server)
└── Layout (Server)
    ├── Header (Server)
    │   └── UserMenu (Client) ← only this needs interactivity
    ├── ProductGrid (Server)
    │   └── ProductCard (Server)
    │       └── AddToCart (Client) ← isolated interaction
    └── Footer (Server)
```

## Convex Data Fetching in Client Components

### Using useQuery (Real-time data)
```tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ProductList() {
  const products = useQuery(api.products.list);

  // Handle loading state
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

### Using useMutation (Write operations)
```tsx
"use client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function CreateProductButton() {
  const createProduct = useMutation(api.products.create);

  async function handleClick() {
    await createProduct({ name: "New Product", price: 100 });
    // UI updates automatically - Convex is reactive!
  }

  return <button onClick={handleClick}>Create</button>;
}
```

### Using usePreloadedQuery (SSR + Reactivity)
```tsx
"use client";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface Props {
  preloaded: Preloaded<typeof api.products.list>;
}

export function ProductList({ preloaded }: Props) {
  // Data available immediately from SSR, then reactive
  const products = usePreloadedQuery(preloaded);
  return <div>{/* render products */}</div>;
}
```

See **references/convex-data-fetching.md** for complete patterns.
