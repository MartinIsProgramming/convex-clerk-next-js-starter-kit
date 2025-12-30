import { Badge } from "@/components/ui/badge";

type ActiveBadgeProps = {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
};

/**
 * Generic badge for displaying active/inactive status.
 * Used across resources, user apartments, and other entities.
 */
export function ActiveBadge({
  isActive,
  activeLabel = "Activo",
  inactiveLabel = "Inactivo",
  className,
}: ActiveBadgeProps) {
  return (
    <Badge variant={isActive ? "success-light" : "secondary"} className={className}>
      {isActive ? activeLabel : inactiveLabel}
    </Badge>
  );
}
