# Clean Code Rules

## File Organization

### Size Limits
| Metric | Limit | Action |
|--------|-------|--------|
| File lines | > 300 | Split into modules |
| Function lines | > 30 | Extract subfunctions |
| Function parameters | > 3 | Use options object |
| Nesting depth | > 3 | Flatten with early returns |
| Class methods | > 10 | Split class or extract |

### Single Responsibility
Each file should have ONE reason to change:

```
❌ user-utils.ts (validation + formatting + API calls)
✅ user-validation.ts
✅ user-formatting.ts  
✅ user-api.ts
```

## Naming

### Functions
```
❌ process() → ✅ calculateOrderTotal()
❌ handle() → ✅ handleFormSubmission()
❌ doStuff() → ✅ sendEmailNotification()
```

Pattern: `verb + noun + (qualifier)`

### Booleans
```
❌ flag → ✅ isEnabled
❌ check → ✅ hasPermission
❌ status → ✅ isLoading
```

Pattern: `is/has/can/should + adjective/noun`

### Constants
```
❌ 86400 → ✅ SECONDS_PER_DAY
❌ "#ff0000" → ✅ COLOR_ERROR
❌ 3 → ✅ MAX_RETRY_ATTEMPTS
```

## Functions

### Do One Thing
```typescript
// ❌ Does multiple things
function processUser(user: User) {
  validateUser(user);
  const formatted = formatName(user.name);
  await saveToDatabase(user);
  await sendEmail(user.email);
  logActivity(user.id);
}

// ✅ Split by responsibility
function processUser(user: User) {
  validateUser(user);
  const prepared = prepareUserData(user);
  await persistUser(prepared);
  await notifyUser(prepared);
}
```

### Early Returns (avoid nesting)
```typescript
// ❌ Deep nesting
function getDiscount(user: User) {
  if (user) {
    if (user.isPremium) {
      if (user.yearsActive > 2) {
        return 0.2;
      } else {
        return 0.1;
      }
    } else {
      return 0;
    }
  }
  return 0;
}

// ✅ Early returns
function getDiscount(user: User) {
  if (!user) return 0;
  if (!user.isPremium) return 0;
  if (user.yearsActive > 2) return 0.2;
  return 0.1;
}
```

### Parameter Objects
```typescript
// ❌ Too many parameters
function createUser(name: string, email: string, age: number, role: string, dept: string) {}

// ✅ Options object
interface CreateUserOptions {
  name: string;
  email: string;
  age: number;
  role: string;
  department: string;
}
function createUser(options: CreateUserOptions) {}
```

## Code Smells

### Duplication
Flag when same logic appears 3+ lines in 2+ places:
```typescript
// ❌ Duplicated
function getAdminUsers() {
  return users.filter(u => u.active).filter(u => u.role === 'admin').sort((a,b) => a.name.localeCompare(b.name));
}
function getEditorUsers() {
  return users.filter(u => u.active).filter(u => u.role === 'editor').sort((a,b) => a.name.localeCompare(b.name));
}

// ✅ Extracted
function getActiveUsersByRole(role: string) {
  return users
    .filter(u => u.active && u.role === role)
    .sort((a, b) => a.name.localeCompare(b.name));
}
```

### Magic Values
```typescript
// ❌ Magic numbers
if (password.length < 8) {}
setTimeout(fn, 86400000);
if (status === 2) {}

// ✅ Named constants
const MIN_PASSWORD_LENGTH = 8;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const STATUS_APPROVED = 2;
```

### Dead Code
Remove immediately:
- Commented-out code blocks
- Unused imports
- Unreachable code after return/throw
- Unused variables/functions

### Comments That Explain "What"
```typescript
// ❌ Explaining what (code should be obvious)
// Loop through users and check if active
for (const user of users) {
  if (user.active) { ... }
}

// ✅ Explaining why (context that code can't express)
// Filter inactive users to avoid sending emails to closed accounts (GDPR requirement)
const activeUsers = users.filter(u => u.active);
```

## Error Handling

### Be Specific
```typescript
// ❌ Generic
try { ... } catch (e) { console.log(e); }

// ✅ Specific
try {
  await saveUser(user);
} catch (error) {
  if (error instanceof ValidationError) {
    return { success: false, errors: error.fields };
  }
  if (error instanceof DatabaseError) {
    logger.error('Database save failed', { userId: user.id, error });
    throw new ServiceUnavailableError('Unable to save user');
  }
  throw error;
}
```

### Don't Swallow Errors
```typescript
// ❌ Silent failure
try { riskyOperation(); } catch (e) { /* ignore */ }

// ✅ At minimum, log
try {
  riskyOperation();
} catch (error) {
  logger.warn('Operation failed, using fallback', { error });
  return fallbackValue;
}
```

## Types (TypeScript)

### Avoid `any`
```typescript
// ❌ 
function process(data: any) {}

// ✅
function process(data: UserInput) {}
function process(data: unknown) {} // if truly unknown, then validate
```

### Use Discriminated Unions
```typescript
// ❌ Optional fields for different states
interface Response {
  loading?: boolean;
  data?: Data;
  error?: Error;
}

// ✅ Discriminated union
type Response =
  | { status: 'loading' }
  | { status: 'success'; data: Data }
  | { status: 'error'; error: Error };
```
