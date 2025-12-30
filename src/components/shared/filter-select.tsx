"use client";

import type { LucideIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterOption<T extends string> = {
  value: T;
  label: string;
  icon: LucideIcon;
};

type FilterSelectProps<T extends string> = {
  value: T | null;
  onChange: (value: T | null) => void;
  options: FilterOption<T>[];
  placeholder: string;
  className?: string;
};

export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  className = "w-[180px]",
}: FilterSelectProps<T>) {
  const handleChange = (val: string) => {
    onChange(val === "all" ? null : (val as T));
  };

  return (
    <Select value={value ?? "all"} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <Icon className="size-4" />
                <span>{option.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
