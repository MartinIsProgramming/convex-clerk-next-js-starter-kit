import type { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  itemLabel?: string;
};

export function DataTablePagination<TData>({
  table,
  itemLabel = "item(s)",
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <div className="text-muted-foreground flex-1 text-sm">
        {table.getFilteredRowModel().rows.length} {itemLabel}
      </div>
      <div className="space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
