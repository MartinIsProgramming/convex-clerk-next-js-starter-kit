# User Display Utilities

Shared utilities for formatting user data in UI components.

## Location

`src/lib/user-utils.ts`

## Functions

### `getUserDisplayInfo()`

Maps a database user to UI-ready format.

```typescript
import { getUserDisplayInfo } from "@/lib/user-utils";
import type { PublicUserDTO } from "@/types/user";

// In a Server Component or Layout
const dbUser: PublicUserDTO = await getUserByClerkId(clerkId);
const user = getUserDisplayInfo(dbUser);

// user = { name, email, avatar, initials }
```

**Parameters:**
- `user: Nullable<PublicUserDTO>` - User from database (can be null)
- `fallbackName?: string` - Default: "Usuario"

**Returns:** `{ name: string, email: string, avatar: string, initials: string }`

### `getInitials()`

Extracts initials from a full name.

```typescript
import { getInitials } from "@/lib/user-utils";

getInitials("Juan Pérez")  // "JP"
getInitials("María")       // "M"
getInitials("Ana María López") // "AM" (max 2 chars)
```

## Usage Pattern

### In Layouts

```typescript
// src/app/(resident)/layout.tsx
import { getUserDisplayInfo } from "@/lib/user-utils";
import { getUserByClerkId } from "@/server/repositories/user.repository";

export default async function ResidentLayout({ children }: LayoutProps) {
  const { userId } = await auth();
  const dbUser = await getUserByClerkId(userId!);

  // Format for UI
  const user = getUserDisplayInfo(dbUser);

  return <AppSidebar user={user} />;
}
```

### In Components with Avatar

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function UserAvatar({ user }: { user: UserDisplayInfo }) {
  return (
    <Avatar>
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback>{user.initials}</AvatarFallback>
    </Avatar>
  );
}
```

## Type Definition

```typescript
type UserDisplayInfo = {
  name: string;     // Full name or fallback
  email: string;    // Email or empty string
  avatar: string;   // Image URL or default avatar
  initials: string; // 2-letter initials
};
```
