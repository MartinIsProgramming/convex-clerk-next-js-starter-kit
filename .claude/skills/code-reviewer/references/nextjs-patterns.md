# Next.js/React Patterns

## Server vs Client Components

### Wrong Boundary
```tsx
// ❌ Entire page as client component
"use client";
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  useEffect(() => { fetchProducts().then(setProducts); }, []);
  return <ProductList products={products} />;
}

// ✅ Server component with client islands
export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <>
      <ProductList products={products} />
      <AddToCartButton /> {/* only this needs "use client" */}
    </>
  );
}
```

### Unnecessary "use client"
Flag when file has `"use client"` but no:
- useState/useEffect/useRef/useContext
- Event handlers (onClick, onChange, etc.)
- Browser APIs

### Data Fetching in Client
```tsx
// ❌ Fetching in client component
"use client";
export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch(`/api/users/${userId}`).then(r => r.json()).then(setUser);
  }, [userId]);
}

// ✅ Fetch in server, pass as props
// parent (server component)
export async function UserProfileContainer({ userId }: { userId: string }) {
  const user = await getUser(userId);
  return <UserProfile user={user} />;
}

// child (can be server or client based on needs)
export function UserProfile({ user }: { user: User }) {
  return <div>{user.name}</div>;
}
```

## Component Organization

### File Too Large
Components > 150 lines should be split:
```
❌ ProductCard.tsx (200 lines with image, details, actions, reviews)

✅ ProductCard/
   ├── index.tsx (composition)
   ├── ProductImage.tsx
   ├── ProductDetails.tsx
   ├── ProductActions.tsx
   └── ProductReviews.tsx
```

### Mixed Concerns
```tsx
// ❌ UI + Logic + Styling mixed
export function ProductCard({ id }: { id: string }) {
  const [product, setProduct] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => { /* fetch logic */ }, [id]);
  
  const formatPrice = (price: number) => { /* formatting logic */ };
  
  return (
    <div 
      style={{ backgroundColor: isHovered ? '#f0f0f0' : 'white' }}
      onMouseEnter={() => setIsHovered(true)}
    >
      {/* 50 more lines */}
    </div>
  );
}

// ✅ Separated concerns
// hooks/useProduct.ts - data fetching
// utils/formatters.ts - formatting
// ProductCard.tsx - pure UI with Tailwind
```

## Hooks

### Custom Hook Extraction
Extract when:
- Same useState+useEffect pattern appears 2+ times
- Logic is reusable across components
- Component has 3+ useState calls

```tsx
// ❌ Repeated pattern
function ComponentA() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => { /* fetch */ }, []);
}

function ComponentB() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => { /* fetch */ }, []);
}

// ✅ Custom hook
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // ...
  return { data, loading, error };
}
```

### Missing Dependencies
```tsx
// ❌ Missing dependency
useEffect(() => {
  fetchUser(userId);
}, []); // userId missing

// ✅ Complete dependencies
useEffect(() => {
  fetchUser(userId);
}, [userId]);
```

### Unnecessary useEffect
```tsx
// ❌ Derived state in useEffect
const [items, setItems] = useState([]);
const [filteredItems, setFilteredItems] = useState([]);

useEffect(() => {
  setFilteredItems(items.filter(i => i.active));
}, [items]);

// ✅ Compute during render
const [items, setItems] = useState([]);
const filteredItems = useMemo(() => items.filter(i => i.active), [items]);
// or just: const filteredItems = items.filter(i => i.active);
```

## Props

### Prop Drilling (> 3 levels)
```tsx
// ❌ Passing through multiple levels
<GrandParent user={user}>
  <Parent user={user}>
    <Child user={user}>
      <GrandChild user={user} />

// ✅ Context for deep data
const UserContext = createContext<User | null>(null);

// or: colocate the data fetching closer to usage
```

### Missing Key in Lists
```tsx
// ❌ No key or index as key
{items.map((item, i) => <Item key={i} {...item} />)}

// ✅ Stable unique key
{items.map(item => <Item key={item.id} {...item} />)}
```

## API Routes / Server Actions

### Fat Route Handlers
```tsx
// ❌ Business logic in route
export async function POST(req: Request) {
  const data = await req.json();
  // 50 lines of validation, transformation, database calls
}

// ✅ Thin route, logic in services
export async function POST(req: Request) {
  const data = await req.json();
  const result = await userService.create(data);
  return Response.json(result);
}
```

### Missing Error Handling
```tsx
// ❌ No error handling
export async function GET() {
  const users = await db.user.findMany();
  return Response.json(users);
}

// ✅ Proper error handling
export async function GET() {
  try {
    const users = await db.user.findMany();
    return Response.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Convex Patterns

### Missing Returns Validator
```typescript
// ❌ No returns validator
export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ✅ Always include returns validator
export const getUser = query({
  args: { id: v.id("users") },
  returns: v.union(v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    name: v.string(),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

### Using filter() Instead of withIndex()
```typescript
// ❌ Full table scan - slow
const products = await ctx.db
  .query("products")
  .filter((q) => q.eq(q.field("categoryId"), categoryId))
  .collect();

// ✅ Uses index - fast
const products = await ctx.db
  .query("products")
  .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
  .collect();
```

### Calling ctx.db in Actions
```typescript
// ❌ Actions don't have DB access
export const myAction = action({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect(); // ERROR!
  },
});

// ✅ Use runQuery to access data from actions
export const myAction = action({
  handler: async (ctx) => {
    const users = await ctx.runQuery(api.users.list);
  },
});
```

### Public Functions for Internal Logic
```typescript
// ❌ Internal logic exposed publicly
export const syncUserData = mutation({
  // This should be internal!
  handler: async (ctx, args) => { /* ... */ },
});

// ✅ Use internal* for private functions
export const syncUserData = internalMutation({
  handler: async (ctx, args) => { /* ... */ },
});
```

### Missing Loading State for useQuery
```tsx
// ❌ No loading state - will crash
function UserList() {
  const users = useQuery(api.users.list);
  return users.map(u => <div>{u.name}</div>); // Error if undefined!
}

// ✅ Handle undefined (loading state)
function UserList() {
  const users = useQuery(api.users.list);
  if (users === undefined) return <Skeleton />;
  return users.map(u => <div key={u._id}>{u.name}</div>);
}
```

### Multiple preloadQuery Calls (Inconsistent Data)
```tsx
// ❌ Data may be inconsistent
export default async function Page() {
  const users = await preloadQuery(api.users.list);
  const posts = await preloadQuery(api.posts.list);
  // users and posts may be from different DB states!
}

// ✅ Single query for related data
export default async function Page() {
  const data = await preloadQuery(api.dashboard.getData);
  // Returns { users, posts } from same transaction
}
```

### Try/Catch Inside Convex Functions
```typescript
// ❌ Hiding errors
export const getUser = query({
  handler: async (ctx, args) => {
    try {
      return await ctx.db.get(args.id);
    } catch (error) {
      return null; // Swallowing errors!
    }
  },
});

// ✅ Let errors propagate
export const getUser = query({
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

## Component Naming Conventions

### Required Suffixes

| Suffix | Type | Location | Purpose |
|--------|------|----------|---------|
| `*Content` | Server | `server/` | Data fetching wrapper |
| `*Skeleton` | Server | `server/` | Loading state |
| `*Form` | Client | `client/` | Form with validation |
| `*Dialog` | Client | `client/` | Modal component |
| `*DataTable` | Client | `client/` | Interactive table |
| `*Card` | Server | `server/` | Presentation card |

**Examples:**
- `ApartmentsListContent` - fetches and displays apartments
- `AdminStatsSkeleton` - loading placeholder
- `NewApartmentForm` - form with validation
- `ConfirmReservationDialog` - modal dialog

**Flags:**
- Form component without `*Form` suffix
- Dialog component without `*Dialog` suffix
- Data-fetching component without `*Content` suffix

### File Location

```
src/features/[feature]/components/
├── server/           # Server components (default)
│   ├── *Content.tsx
│   ├── *Skeleton.tsx
│   └── *Card.tsx
└── client/           # Client components ("use client")
    ├── *Form.tsx
    ├── *Dialog.tsx
    └── *DataTable.tsx
```

---

## Data Fetching Patterns

### Method Selection

| Method | Location | Reactive | Use Case |
|--------|----------|----------|----------|
| `preloadQuery` | Server Component | Yes* | SSR with reactivity |
| `usePreloadedQuery` | Client Component | Yes | Consume preloaded data |
| `useQuery` | Client Component | Yes | Real-time client data |
| `fetchQuery` | Server Component | No | Static/cached data |
| `useMutation` | Client Component | - | Write operations |
| `useAction` | Client Component | - | External API calls |

*Reactivity via `usePreloadedQuery` in client child

### Correct Pattern: Server → Client

```tsx
// ✅ Page (Server Component)
export default async function ProductsPage() {
  const token = await getAuthToken();
  const preloaded = await preloadQuery(api.products.list, {}, { token });

  return (
    <div>
      <PageHeader title="Products" /> {/* Static */}
      <ProductList preloaded={preloaded} /> {/* Dynamic */}
    </div>
  );
}

// ✅ Client Component
"use client";
export function ProductList({ preloaded }: Props) {
  const products = usePreloadedQuery(preloaded);
  return products.map(p => <ProductCard key={p._id} product={p} />);
}
```

**Flags:**
- `useQuery` in client when `preloadQuery` could be used from server
- Missing `undefined` check with `useQuery` (loading state)
- `fetchQuery` when reactivity is needed

---

## Form Patterns (React Hook Form + Zod)

### Required Structure

```tsx
// 1. Zod schema
const schema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(2, "Min 2 characters"),
});

type FormData = z.infer<typeof schema>;

// 2. Form component
export function UserForm({ onSubmit }: Props) {
  const { control, handleSubmit, formState: { errors, isSubmitting, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", name: "" },
    mode: "onChange",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor="email">Email</Label>
            <Input {...field} id="email" aria-invalid={!!errors.email} />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>
        )}
      />
      <Button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? "Saving..." : "Submit"}
      </Button>
    </form>
  );
}
```

### Creation vs Edit Forms

| Aspect | Creation Form | Edit Form |
|--------|--------------|-----------|
| Default values | Empty | Pre-filled with existing data |
| Submit enabled | `isValid` | `isDirty && isValid` |
| After submit | Redirect to new resource | `reset(data)` to clear dirty |

**Flags:**
- Form without Zod schema
- Missing `zodResolver`
- Not using `Controller` for controlled inputs
- Missing `isSubmitting` disabled state
- Edit form without `isDirty` check

---

## Suspense Patterns

### Granular Suspense (Required)

```tsx
// ❌ Wrong - entire page waits
export default function DashboardPage() {
  return (
    <Suspense fallback={<FullPageSkeleton />}>
      <PageHeader />
      <Stats />
      <RecentActivity />
    </Suspense>
  );
}

// ✅ Correct - static renders immediately
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" /> {/* Immediate */}

      <Suspense fallback={<StatsSkeleton />}>
        <Stats /> {/* Async */}
      </Suspense>

      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity /> {/* Async */}
      </Suspense>
    </div>
  );
}
```

**Flags:**
- Suspense wrapping entire page
- Suspense wrapping static content
- Missing Suspense for async components
- No skeleton fallback

---

## Performance

### Missing Suspense
```tsx
// ❌ No loading state for async component
export default function Page() {
  return <SlowComponent />;
}

// ✅ Suspense boundary
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <SlowComponent />
    </Suspense>
  );
}
```

### Unnecessary Re-renders
```tsx
// ❌ New object/function on every render
<Child style={{ color: 'red' }} onClick={() => handleClick(id)} />

// ✅ Memoized or stable references
const style = useMemo(() => ({ color: 'red' }), []);
const handleItemClick = useCallback(() => handleClick(id), [id]);
<Child style={style} onClick={handleItemClick} />

// or: if Child is not expensive, this optimization may be premature
```
