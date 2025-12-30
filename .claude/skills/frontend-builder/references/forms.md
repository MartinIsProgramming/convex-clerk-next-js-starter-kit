# Forms Guide (React Hook Form + Zod)

**Read this BEFORE building any form.**

---

## CRITICAL: Dialog Anti-Patterns (READ FIRST)

**These are the #1 source of bugs. NEVER do these:**

### ❌ FORBIDDEN: useEffect to sync form with data

```tsx
// ❌ WRONG - This causes bugs, race conditions, and extra renders
useEffect(() => {
  if (data) {
    form.reset({
      name: data.name,
      amount: data.amount,
    });
  }
}, [data, form]);
```

### ❌ FORBIDDEN: Multiple useState for form values

```tsx
// ❌ WRONG - Use react-hook-form, not manual state
const [name, setName] = useState("");
const [amount, setAmount] = useState(0);
const [date, setDate] = useState<Date | null>(null);
```

### ✅ CORRECT: Use `values` prop for external data

```tsx
// ✅ RIGHT - React Hook Form handles sync automatically
const formValues = data
  ? {
      name: data.name,
      amount: data.amount,
    }
  : undefined;

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: "", amount: 0 },
  values: formValues,  // ← This syncs automatically!
  resetOptions: { keepDirtyValues: true },
  mode: "onChange",
});
```

### ✅ CORRECT: Use DialogLoadingOverlay while loading

```tsx
return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {isPending ? (
      <DialogLoadingOverlay text="Loading..." />
    ) : (
      <DialogContent>
        {/* Form content */}
      </DialogContent>
    )}
  </Dialog>
);
```

---

## Required Setup

```tsx
"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
```

## Complete Pattern

```tsx
// 1. Define schema
const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
});

type FormData = z.infer<typeof schema>;

// 2. Create form component
export function LoginForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const { control, handleSubmit, formState: { errors, isSubmitting, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onChange", // Validates on change to update isValid
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor="email">Email</label>
            <input
              {...field}
              id="email"
              type="email"
              aria-invalid={!!errors.email}
              data-invalid={!!errors.email}
              className="w-full border rounded px-3 py-2 data-[invalid=true]:border-red-500"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor="password">Password</label>
            <input
              {...field}
              id="password"
              type="password"
              aria-invalid={!!errors.password}
              data-invalid={!!errors.password}
              className="w-full border rounded px-3 py-2 data-[invalid=true]:border-red-500"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>
        )}
      />

      <button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? "Loading..." : "Submit"}
      </button>
    </form>
  );
}
```

## Anti-patterns

### ❌ Uncontrolled inputs without RHF
```tsx
export function BadForm() {
  const [email, setEmail] = useState("");
  return <input value={email} onChange={e => setEmail(e.target.value)} />;
}
```

### ❌ Manual validation
```tsx
const handleSubmit = () => {
  if (!email.includes("@")) setError("Invalid"); // WRONG
};
```

### ❌ Missing accessibility attributes
```tsx
<input className={errors.email ? "border-red-500" : ""} /> // Missing aria-invalid
```

### ❌ Submit button enabled with invalid form
```tsx
// WRONG: Only checks isSubmitting, allows clicking with invalid data
<button type="submit" disabled={isSubmitting}>Submit</button>

// CORRECT: Disable when form is invalid OR submitting
<button type="submit" disabled={!isValid || isSubmitting}>Submit</button>
```

**Note:** To use `isValid`, you must set `mode: "onChange"` or `mode: "onBlur"` in `useForm()`. Default mode only validates on submit.

## Multi-Step Forms

Use `watch()` to derive the current step from form state instead of `useState`:

```tsx
const schema = z.object({
  buildingId: z.string().min(1, "Required"),
  apartmentId: z.string().min(1, "Required"),
});

export function OnboardingForm({ buildings }) {
  // Only useState needed: server data that can't be part of form
  const [apartments, setApartments] = useState<Apartment[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { buildingId: "", apartmentId: "" },
  });

  // ✅ Derive step from form state
  const buildingId = watch("buildingId");
  const currentStep = buildingId ? 2 : 1;

  const handleNextStep = async () => {
    const isValid = await trigger("buildingId"); // Validate current step
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {currentStep === 1 && <Step1 />}
      {currentStep === 2 && <Step2 />}
    </form>
  );
}
```

### ❌ Multi-Step Anti-patterns

```tsx
// ❌ Manual step state
const [currentStep, setCurrentStep] = useState(1);

// ❌ useTransition for form submission (use formState.isSubmitting)
const [isPending, startTransition] = useTransition();

// ❌ Multiple useState for form fields
const [selectedId, setSelectedId] = useState("");
const [date, setDate] = useState<Date | null>(null);
```

## Creation vs Edit Forms

Forms have different patterns depending on whether they CREATE new data or EDIT existing data.

### Creation Forms (new-*)

Use `FormActions` component with Submit + Cancel buttons.

```tsx
// src/features/resources/components/client/new-resource-form.tsx
export function NewResourceForm() {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" }, // Empty defaults
    mode: "onChange",
  });

  const onSubmit = async (data: FormData) => {
    const result = await createResourceAction(data);
    if (result.success) {
      toast.success("Resource created");
      router.push(`/resources/${result.data.resourceId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* fields */}
      <FormActions
        isSubmitting={isSubmitting}
        isValid={isValid}
        submitLabel="Create resource"
        submittingLabel="Creating..."
      />
    </form>
  );
}
```

**Why**: User navigated to a dedicated page to create something. They need a Cancel button to go back without creating.

### Edit Forms (edit-*)

Use a single Button that enables when there are changes (`isDirty`).

```tsx
// src/features/resources/components/client/edit-resource-form.tsx
export function EditResourceForm({ resource }: { resource: Resource }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: resource.name,           // Pre-filled with existing data
      description: resource.description ?? "",
      isActive: resource.isActive,
    },
    mode: "onChange",
  });

  const onSubmit = async (data: FormData) => {
    const result = await updateResourceAction(resource.id, data);
    if (result.success) {
      toast.success("Resource updated");
      reset(data); // Reset with saved values so isDirty becomes false
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* fields - always editable, no disabled state */}
      <Button
        type="submit"
        disabled={!isDirty || !isValid || isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
```

**Why**: User is already viewing the resource. The form is inline (part of the page). No Cancel needed - they can navigate away or simply not save.

### Key Differences

| Aspect | Creation Form | Edit Form |
|--------|--------------|-----------|
| Default values | Empty | Pre-filled with existing data |
| Submit enabled | `isValid` | `isDirty && isValid` |
| Cancel button | Yes (`FormActions`) | No (single Button) |
| After submit | Redirect to new resource | `reset(data)` to clear dirty state |
| Component | `FormActions` | `Button` |

### ❌ Edit Form Anti-patterns

```tsx
// ❌ Using isEditing state to toggle view/edit mode
const [isEditing, setIsEditing] = useState(false);
<Input disabled={!isEditing} />

// ❌ Forgetting to reset after save (button stays enabled)
if (result.success) {
  toast.success("Saved");
  // Missing: reset(data)
}

// ❌ Using FormActions for edit forms (adds unnecessary Cancel button)
<FormActions ... />
```

### Edit Dialogs with External Data (props or queries)

When editing in a **dialog** where data comes from props or a query (not hardcoded), use the `values` prop instead of `useEffect + form.reset()`.

#### ❌ Anti-pattern: useEffect + form.reset()

```tsx
// ❌ WRONG - causes extra render, potential race conditions
export function EditProductDialog({ product }: { product: Product | null }) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", price: 0 },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        price: product.price,
      });
    }
  }, [product, form]);
  // ...
}
```

#### ✅ Correct: Use `values` prop

```tsx
// ✅ CORRECT - React Hook Form's official pattern for external data
export function EditProductDialog({ product }: { product: Product | null }) {
  // Transform entity to form values (undefined when no data)
  const formValues = product
    ? {
        name: product.name,
        price: product.price,
      }
    : undefined;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", price: 0 },  // Used when values is undefined
    values: formValues,                      // Syncs automatically when data changes
    resetOptions: {
      keepDirtyValues: true,                 // Don't overwrite user edits
    },
    mode: "onChange",
  });

  const handleClose = () => {
    form.reset();  // Still needed to clear dirty state on close
    onClose();
  };
  // ...
}
```

#### How `defaultValues` and `values` work together

```
values: undefined?
    │
    ├── YES → form uses defaultValues
    │
    └── NO → form uses values (overrides defaultValues)
```

- **`defaultValues`**: Initial values when no external data. Also used by `form.reset()`
- **`values`**: Syncs external data. Updates form automatically when it changes
- **`keepDirtyValues`**: If user edited a field, don't overwrite it even if `values` changes

#### When to use each pattern

| Scenario | Pattern |
|----------|---------|
| Edit Form (page, data as props) | `defaultValues` pre-filled |
| Edit Dialog (data from props) | `values` prop |
| Edit Dialog (data from useQuery) | `values` prop |

## Checklist

Before submitting form PR:

### All Forms
- [ ] Schema defined with Zod
- [ ] useForm with zodResolver
- [ ] All fields wrapped in Controller
- [ ] aria-invalid on all inputs
- [ ] data-invalid for styling
- [ ] Error messages displayed
- [ ] useForm has `mode: "onChange"` or `mode: "onBlur"`
- [ ] Loading state shown during submission

### Creation Forms
- [ ] Submit button has `disabled={!isValid || isSubmitting}`
- [ ] Using `FormActions` component
- [ ] Redirect after successful creation

### Edit Forms
- [ ] Submit button has `disabled={!isDirty || !isValid || isSubmitting}`
- [ ] Using single `Button` (not FormActions)
- [ ] `reset(data)` called after successful save
- [ ] No `isEditing` state or disabled fields

### Multi-Step Forms
- [ ] Use `watch()` to derive step, NOT useState
- [ ] Use `trigger()` for partial validation

### Edit Dialogs (data from props/queries)
- [ ] Use `values` prop, NOT `useEffect + form.reset()`
- [ ] Add `resetOptions: { keepDirtyValues: true }`
- [ ] Transform data to form values before `useForm()`
- [ ] Keep `form.reset()` in `handleClose()`

### Action Dialogs
- [ ] Extract form content to child component with `key={entity.id}`
- [ ] NO useEffect for form reset or state sync
- [ ] Reset all state in `handleClose()`

### Data Loading Dialogs
- [ ] Use `useAuthQuery` (NOT `useQuery` directly)
- [ ] Use `{ enabled: !!entity }` or `{ enabled: open }` option
- [ ] Use `DialogLoadingOverlay` while `isPending`
- [ ] Return `null` if no entity (when applicable)

---

## Dialog Patterns

Dialogs fall into different categories. Each has a specific pattern to follow.

### Pattern 1: Action Dialogs (entity as context)

**Use when:** Dialog performs an action ON an entity (register payment, cancel reservation, delete item) but doesn't EDIT the entity's fields.

The entity prop provides context (what to act on), not data to edit.

#### ❌ Anti-pattern: useEffect for entity changes

```tsx
// WRONG - useEffect to reset when entity changes
export function DeleteProductDialog({ product, onClose }) {
  const [confirmText, setConfirmText] = useState("");
  const form = useForm({ defaultValues: { reason: "" } });

  // ❌ BAD: useEffect to sync state
  useEffect(() => {
    if (product) {
      form.reset({ reason: "" });
      setConfirmText("");
    }
  }, [product]);
}
```

#### ✅ Correct: Key prop forces remount

```tsx
// Parent component handles null check and key
export function DeleteProductDialog({ product, onClose }: Props) {
  if (!product) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {/* key={product.id} forces remount when entity changes */}
        <DeleteProductForm key={product._id} product={product} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

// Child component has guaranteed entity, fresh state on each mount
function DeleteProductForm({ product, onClose }: FormProps) {
  const [confirmText, setConfirmText] = useState("");
  const deleteProduct = useMutation(api.products.remove);

  const handleSubmit = async () => {
    await deleteProduct({ id: product._id });
    toast.success("Product deleted");
    onClose();
  };

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Delete {product.name}?</DialogTitle>
      </DialogHeader>
      <Input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="Type 'delete' to confirm"
      />
      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>Cancel</Button>
        <Button
          variant="destructive"
          onClick={handleSubmit}
          disabled={confirmText !== "delete"}
        >
          Delete
        </Button>
      </DialogFooter>
    </>
  );
}
```

**Why this works:**
- `key={product._id}` forces React to unmount/remount when entity changes
- All `useState` and `useForm` reinitialize with fresh values
- No useEffect needed - component always starts fresh
- State changes happen in event handlers, not effects

**When to use:** Delete dialogs, cancel dialogs, confirm action dialogs, any "action on entity" dialog.

### Pattern 2: Edit Dialogs (entity data to edit)

**Use when:** Dialog edits the entity's fields directly.

See "Edit Dialogs with External Data" section above - use the `values` prop pattern.

### Pattern 3: Data Loading Dialogs

**Use when:** Dialog needs to fetch additional data before showing content (e.g., text document content, settings).

**ALWAYS use `useAuthQuery`** - never use `useQuery` directly, as it won't handle authentication.

#### Dialog controlled by `open` prop (no entity)

```tsx
export function SettingsDialog({ open, onOpenChange }: Props) {
  // Load data only when dialog is open
  const { data: settings, isPending } = useAuthQuery(
    api.settings.get,
    {},
    { enabled: open },  // Only fetch when open
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {isPending ? (
        <DialogLoadingOverlay text="Loading settings..." />
      ) : (
        <DialogContent>
          {/* Content that uses settings */}
        </DialogContent>
      )}
    </Dialog>
  );
}
```

#### Dialog controlled by entity prop

```tsx
export function ViewProductDialog({ product, onClose }: Props) {
  // Load additional data only when entity exists
  const { data: productDetail, isPending } = useAuthQuery(
    api.products.getById,
    { id: product?._id! },         // Args (type assertion safe due to enabled)
    { enabled: !!product },        // Only fetch when product exists
  );

  if (!product) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      {isPending ? (
        <DialogLoadingOverlay text="Loading product..." />
      ) : (
        <DialogContent>
          {/* Content that uses productDetail */}
        </DialogContent>
      )}
    </Dialog>
  );
}
```

**Key points:**
- **ALWAYS use `useAuthQuery`** - handles authentication automatically
- Use `{ enabled: !!entity }` or `{ enabled: open }` to control when query runs
- Use `DialogLoadingOverlay` for loading state
- Content renders only after data is loaded

### Pattern 4: Data Loading + Edit Dialog

**Use when:** Dialog needs to fetch data AND allow editing (e.g., edit document content).

```tsx
export function EditProductDialog({ productId, onClose }: Props) {
  // Load data using useAuthQuery
  const { data: product, isPending } = useAuthQuery(
    api.products.getById,
    { id: productId! },
    { enabled: !!productId },
  );

  const updateProduct = useMutation(api.products.update);

  // Compute form values from loaded data
  const formValues = product
    ? {
        name: product.name,
        price: product.price,
      }
    : undefined;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", price: 0 },
    values: formValues,  // Syncs when data loads
    resetOptions: { keepDirtyValues: true },
    mode: "onChange",
  });

  const onSubmit = async (data: FormData) => {
    if (!productId) return;
    await updateProduct({ id: productId, ...data });
    toast.success("Product updated");
    form.reset(data);
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={!!productId} onOpenChange={(open) => !open && handleClose()}>
      {isPending ? (
        <DialogLoadingOverlay text="Loading product..." />
      ) : (
        <DialogContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Form content */}
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
```

### Quick Reference: Which Pattern?

| Dialog Type | Example | Pattern |
|-------------|---------|---------|
| Delete something | DeleteProductDialog | Action (key prop) |
| Cancel something | CancelOrderDialog | Action (key prop) |
| Confirm action | ConfirmPublishDialog | Action (key prop) |
| Edit entity fields | EditProductDialog | Edit (values prop) |
| View with extra data | ViewProductDialog | Data Loading |
| Edit with extra data | EditDocumentDialog | Data Loading + Edit |
| Settings/config | SettingsDialog | Data Loading (enabled: open) |

### Global Anti-pattern: useEffect in Dialogs

**NEVER use useEffect in dialogs for:**
- Resetting form when entity prop changes
- Syncing derived state
- Loading data (use `useAuthQuery` instead)

**useEffect is almost never needed in dialogs.** If you think you need it, you're probably using the wrong pattern.
