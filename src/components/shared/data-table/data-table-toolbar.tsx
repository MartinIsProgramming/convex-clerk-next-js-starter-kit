import type { Table } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  filterColumn?: string;
  filterPlaceholder?: string;
  columnLabels: Record<string, string>;
  /** Additional filters to show next to the search input (left side) */
  filters?: React.ReactNode;
  /** Action button (e.g., "Create" button) shown on the right side */
  action?: React.ReactNode;
  /** External search value for controlled mode (server-side filtering) */
  searchValue?: string;
  /** Callback for search changes in controlled mode */
  onSearchChange?: (value: string) => void;
  /** Hide the search input (useful when using custom filters instead) */
  hideSearch?: boolean;
};

export function DataTableToolbar<TData>({
  table,
  filterColumn,
  filterPlaceholder,
  columnLabels,
  filters,
  action,
  searchValue,
  onSearchChange,
  hideSearch,
}: DataTableToolbarProps<TData>) {
  // Controlled mode: external search value and callback
  const isControlled = searchValue !== undefined && onSearchChange !== undefined;

  // For uncontrolled mode: use table's internal column filter
  const internalValue = filterColumn
    ? ((table.getColumn(filterColumn)?.getFilterValue() as string) ?? "")
    : "";

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (isControlled) {
      onSearchChange(value);
    } else if (filterColumn) {
      table.getColumn(filterColumn)?.setFilterValue(value);
    }
  };

  return (
    <div className="flex items-center gap-2 py-4">
      {!hideSearch && (
        <Input
          placeholder={filterPlaceholder ?? "Search..."}
          value={isControlled ? searchValue : internalValue}
          onChange={handleChange}
          className="w-[200px]"
        />
      )}
      {filters}
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {columnLabels[column.id] ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {action}
      </div>
    </div>
  );
}
