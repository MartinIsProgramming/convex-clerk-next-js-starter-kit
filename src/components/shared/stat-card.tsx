"use client";

import { CircleHelp, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type StatCardVariant = "default" | "success" | "warning" | "destructive";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  variant?: StatCardVariant;
  /** Optional tooltip text shown next to the title */
  tooltip?: string;
}

// Using same color patterns as badge.tsx variants
const variantStyles: Record<StatCardVariant, string> = {
  default: "",
  success: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
  warning: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
  destructive: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
};

const iconStyles: Record<StatCardVariant, string> = {
  default: "text-muted-foreground",
  success: "text-emerald-700 dark:text-emerald-300",
  warning: "text-orange-700 dark:text-orange-300",
  destructive: "text-red-700 dark:text-red-300",
};

const valueStyles: Record<StatCardVariant, string> = {
  default: "",
  success: "text-emerald-700 dark:text-emerald-300",
  warning: "text-orange-700 dark:text-orange-300",
  destructive: "text-red-700 dark:text-red-300",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  tooltip,
}: StatCardProps) {
  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <CircleHelp className="text-muted-foreground size-3.5 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <Icon className={cn("size-4", iconStyles[variant])} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueStyles[variant])}>{value}</div>
        <p className="text-muted-foreground text-xs">{description}</p>
      </CardContent>
    </Card>
  );
}
