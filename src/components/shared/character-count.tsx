import { cn } from "@/lib/utils";

interface CharacterCountProps {
  /** Current character count */
  count: number;
  /** Maximum allowed characters */
  maxLength: number;
  /** Custom class name */
  className?: string;
}

/**
 * Displays character count with color feedback based on proximity to limit.
 * - Normal: muted color
 * - Near limit (80%+): amber/warning
 * - At limit: destructive/red
 */
export function CharacterCount({ count, maxLength, className }: CharacterCountProps) {
  const isNearLimit = count >= maxLength * 0.8;
  const isAtLimit = count >= maxLength;

  return (
    <span
      className={cn(
        "text-xs",
        isAtLimit ? "text-destructive" : isNearLimit ? "text-amber-500" : "text-muted-foreground",
        className,
      )}
    >
      {count}/{maxLength}
    </span>
  );
}
