"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

type DataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData>[];
  filterColumn?: string;
  filterPlaceholder?: string;
  columnLabels: Record<string, string>;
  itemLabel?: string;
  /** Additional filters to show next to the search input (left side) */
  toolbarFilters?: React.ReactNode;
  /** Action button (e.g., "Create" button) shown on the right side */
  toolbarAction?: React.ReactNode;
  /** External search value for controlled mode (server-side filtering) */
  searchValue?: string;
  /** Callback for search changes in controlled mode */
  onSearchChange?: (value: string) => void;
  /** Custom empty state to show when table has no rows */
  emptyState?: React.ReactNode;
  /** Callback when a row is clicked */
  onRowClick?: (row: TData) => void;
  /** Hide the search input (useful when using custom filters instead) */
  hideSearch?: boolean;
};

export function DataTable<TData>({
  data,
  columns,
  filterColumn,
  filterPlaceholder,
  columnLabels,
  itemLabel = "item(s)",
  toolbarFilters,
  toolbarAction,
  searchValue,
  onSearchChange,
  emptyState,
  onRowClick,
  hideSearch,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className="w-full">
      <DataTableToolbar
        table={table}
        filterColumn={filterColumn}
        filterPlaceholder={filterPlaceholder}
        columnLabels={columnLabels}
        filters={toolbarFilters}
        action={toolbarAction}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        hideSearch={hideSearch}
      />

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  {emptyState ?? "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} itemLabel={itemLabel} />
    </div>
  );
}
