# shadcn/ui via MCP

## Before Installing

1. **Check if component exists**: Look in `src/components/ui/`
2. **Ask user**: "I need Button and Card from shadcn. Should I install them?"
3. **Only then proceed** with installation

## MCP Commands

### 1. Search for component
```
mcp__shadcn__search_items_in_registries
  registries: ["@shadcn"]
  query: "button"
```

### 2. Get usage examples
```
mcp__shadcn__get_item_examples_from_registries
  registries: ["@shadcn"]
  query: "button-demo"
```

### 3. Get install command
```
mcp__shadcn__get_add_command_for_items
  registries: ["@shadcn"]
  items: ["button", "card"]
```

### 4. Run install
```bash
npx shadcn@latest add button card
```

## Component Location

After install, components appear in `src/components/ui/`:
```
src/components/ui/
├── button.tsx
├── card.tsx
├── input.tsx
└── ...
```

## Usage Pattern

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{product.description}</p>
        <Button>Add to Cart</Button>
      </CardContent>
    </Card>
  );
}
```

## Common Components

| Need | Component | Install |
|------|-----------|---------|
| Buttons | button | `npx shadcn@latest add button` |
| Forms | input, label, form | `npx shadcn@latest add input label form` |
| Cards | card | `npx shadcn@latest add card` |
| Dialogs | dialog | `npx shadcn@latest add dialog` |
| Tables | table | `npx shadcn@latest add table` |
| Dropdowns | dropdown-menu | `npx shadcn@latest add dropdown-menu` |
| Tabs | tabs | `npx shadcn@latest add tabs` |
| Toasts | sonner | `npx shadcn@latest add sonner` |
