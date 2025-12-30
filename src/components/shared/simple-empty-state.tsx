import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type SimpleEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};

export function SimpleEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: SimpleEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted mb-4 rounded-full p-3">
        <Icon className="text-muted-foreground size-6" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mb-4 text-sm">{description}</p>
      {action}
    </div>
  );
}
