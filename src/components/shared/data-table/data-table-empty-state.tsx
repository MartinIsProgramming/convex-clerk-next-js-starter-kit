import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type DataTableEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};

export function DataTableEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: DataTableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Icon className="mb-4 size-12 text-muted-foreground/50" />
      <p className="text-lg font-medium">{title}</p>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
