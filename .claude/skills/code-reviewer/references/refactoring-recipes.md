# Refactoring Recipes

Step-by-step instructions for common refactors.

## Extract Function

**When**: Function > 30 lines or does multiple things

```typescript
// Before
function processOrder(order: Order) {
  // validate (10 lines)
  if (!order.items.length) throw new Error('Empty order');
  if (!order.customer) throw new Error('No customer');
  for (const item of order.items) {
    if (item.quantity < 1) throw new Error('Invalid quantity');
  }
  
  // calculate total (8 lines)
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
  }
  if (order.discount) {
    total *= (1 - order.discount);
  }
  
  // save (5 lines)
  order.total = total;
  order.status = 'processed';
  await db.orders.save(order);
}

// After
function processOrder(order: Order) {
  validateOrder(order);
  order.total = calculateTotal(order);
  await saveOrder(order);
}

function validateOrder(order: Order) {
  if (!order.items.length) throw new Error('Empty order');
  if (!order.customer) throw new Error('No customer');
  for (const item of order.items) {
    if (item.quantity < 1) throw new Error('Invalid quantity');
  }
}

function calculateTotal(order: Order): number {
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return order.discount ? subtotal * (1 - order.discount) : subtotal;
}

async function saveOrder(order: Order) {
  order.status = 'processed';
  await db.orders.save(order);
}
```

## Extract Component

**When**: JSX block > 50 lines or is reusable

```tsx
// Before
function ProductPage({ product }: { product: Product }) {
  return (
    <div>
      {/* Header section - 30 lines */}
      <header className="...">
        <nav>...</nav>
        <div className="...">
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          {/* more header stuff */}
        </div>
      </header>
      
      {/* Product details - 40 lines */}
      <section className="...">
        <img src={product.image} />
        <div>
          <span>{product.price}</span>
          <button>Add to cart</button>
          {/* more product stuff */}
        </div>
      </section>
    </div>
  );
}

// After
function ProductPage({ product }: { product: Product }) {
  return (
    <div>
      <ProductHeader product={product} />
      <ProductDetails product={product} />
    </div>
  );
}

function ProductHeader({ product }: { product: Product }) {
  return (
    <header className="...">
      {/* header content */}
    </header>
  );
}

function ProductDetails({ product }: { product: Product }) {
  return (
    <section className="...">
      {/* details content */}
    </section>
  );
}
```

## Extract Custom Hook

**When**: useState + useEffect pattern repeated, or component has complex state logic

```tsx
// Before (repeated in multiple components)
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <div>{user?.name}</div>;
}

// After
// hooks/useUser.ts
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
}

// Component becomes simple
function UserProfile({ userId }: { userId: string }) {
  const { user, loading, error } = useUser(userId);

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <div>{user?.name}</div>;
}
```

## Replace Conditionals with Early Returns

**When**: Nested if/else > 3 levels

```typescript
// Before
function getShippingCost(order: Order): number {
  if (order) {
    if (order.items.length > 0) {
      if (order.destination) {
        if (order.destination.country === 'US') {
          if (order.total > 100) {
            return 0; // free shipping
          } else {
            return 10;
          }
        } else {
          return 25; // international
        }
      } else {
        throw new Error('No destination');
      }
    } else {
      throw new Error('Empty order');
    }
  } else {
    throw new Error('No order');
  }
}

// After
function getShippingCost(order: Order): number {
  if (!order) throw new Error('No order');
  if (!order.items.length) throw new Error('Empty order');
  if (!order.destination) throw new Error('No destination');
  
  if (order.destination.country !== 'US') return 25;
  if (order.total > 100) return 0;
  return 10;
}
```

## Extract Constants

**When**: Magic numbers or repeated string literals

```typescript
// Before
function validatePassword(password: string): string[] {
  const errors = [];
  if (password.length < 8) errors.push('Too short');
  if (password.length > 128) errors.push('Too long');
  if (!/[A-Z]/.test(password)) errors.push('Need uppercase');
  if (!/[0-9]/.test(password)) errors.push('Need number');
  return errors;
}

setTimeout(retry, 86400000);

if (user.role === 'admin' || user.role === 'super-admin') { }

// After
const PASSWORD = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  PATTERNS: {
    UPPERCASE: /[A-Z]/,
    NUMBER: /[0-9]/,
  },
} as const;

const TIMING = {
  ONE_DAY_MS: 24 * 60 * 60 * 1000,
} as const;

const ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super-admin',
} as const;

const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN] as const;

function validatePassword(password: string): string[] {
  const errors = [];
  if (password.length < PASSWORD.MIN_LENGTH) errors.push('Too short');
  if (password.length > PASSWORD.MAX_LENGTH) errors.push('Too long');
  if (!PASSWORD.PATTERNS.UPPERCASE.test(password)) errors.push('Need uppercase');
  if (!PASSWORD.PATTERNS.NUMBER.test(password)) errors.push('Need number');
  return errors;
}

setTimeout(retry, TIMING.ONE_DAY_MS);

if (ADMIN_ROLES.includes(user.role)) { }
```

## Split File by Responsibility

**When**: File > 300 lines or has multiple unrelated exports

```
# Before
utils.ts (400 lines)
├── formatDate()
├── formatCurrency()
├── formatPhoneNumber()
├── validateEmail()
├── validatePhone()
├── validatePassword()
├── fetchUser()
├── fetchProducts()
└── fetchOrders()

# After
utils/
├── index.ts (re-exports)
├── formatters.ts
│   ├── formatDate()
│   ├── formatCurrency()
│   └── formatPhoneNumber()
├── validators.ts
│   ├── validateEmail()
│   ├── validatePhone()
│   └── validatePassword()
└── api.ts
    ├── fetchUser()
    ├── fetchProducts()
    └── fetchOrders()
```

## Convert to Discriminated Union

**When**: Type has optional fields that represent different states

```typescript
// Before
interface ApiResponse {
  loading?: boolean;
  data?: User;
  error?: Error;
}

function handleResponse(response: ApiResponse) {
  if (response.loading) {
    // but what if data is also set?
  }
  if (response.error) {
    // is loading false here?
  }
  if (response.data) {
    // can error also be set?
  }
}

// After
type ApiResponse =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };

function handleResponse(response: ApiResponse) {
  switch (response.status) {
    case 'idle':
      return null;
    case 'loading':
      return <Spinner />;
    case 'success':
      return <UserCard user={response.data} />; // data guaranteed
    case 'error':
      return <Error message={response.error.message} />; // error guaranteed
  }
}
```

## Move Client Logic to Server

**When**: Client component fetches data that could come from server

```tsx
// Before
"use client";
function ProductList({ categoryId }: { categoryId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    fetch(`/api/products?category=${categoryId}`)
      .then(r => r.json())
      .then(setProducts);
  }, [categoryId]);
  
  return (
    <div>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

// After
// Server Component (no "use client")
async function ProductList({ categoryId }: { categoryId: string }) {
  const products = await getProductsByCategory(categoryId);
  
  return (
    <div>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

// Only add "use client" to interactive parts
"use client";
function AddToCartButton({ productId }: { productId: string }) {
  return <button onClick={() => addToCart(productId)}>Add</button>;
}
```
