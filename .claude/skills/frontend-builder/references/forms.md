# Forms Guide (React Hook Form + Zod)

**Read this BEFORE building any form.**

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
  buildingId: z.string().min(1, "Requerido"),
  apartmentId: z.string().min(1, "Requerido"),
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
      toast.success("Recurso creado");
      router.push(`/admin/resources/${result.data.resourceId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* fields */}
      <FormActions
        isSubmitting={isSubmitting}
        isValid={isValid}
        submitLabel="Crear recurso"
        submittingLabel="Creando..."
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
      toast.success("Recurso actualizado");
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
        {isSubmitting ? "Guardando..." : "Guardar cambios"}
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
