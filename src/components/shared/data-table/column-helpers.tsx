"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowUpDown, LayoutGrid } from "lucide-react";

import { TruncatedText } from "@/components/shared/truncated-text";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ReservationStatusBadge } from "@/features/reservations/components/shared/reservation-status-badge";
import { formatDate, getTodayDateString } from "@/lib/date-utils";
import { formatTime } from "@/shared/schemas/time";

// === Generic Column Factories ===

/** Base type for rows with a title field */
type WithTitle = { title: string };

/** Base type for rows with a createdAt timestamp field */
type WithCreatedAt = { createdAt: number };

/**
 * Creates a sortable title column with truncated text and tooltip.
 * @param maxWidth - Max width CSS class (default: "max-w-[250px]")
 */
export function createTitleColumn<T extends WithTitle>(maxWidth = "max-w-[250px]"): ColumnDef<T> {
  return {
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Título
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className={maxWidth}>
        <TruncatedText text={row.getValue("title")} className="font-medium" />
      </div>
    ),
  };
}

/**
 * Creates a sortable relative date column (e.g., "hace 2 días").
 */
export function createRelativeDateColumn<T extends WithCreatedAt>(): ColumnDef<T> {
  return {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Fecha
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDistanceToNow(new Date(row.original.createdAt), {
          addSuffix: true,
          locale: es,
        })}
      </span>
    ),
  };
}

/**
 * Creates a standard array-based filter function for badge columns.
 * Use with columns that have a filterFn property.
 */
export function createArrayFilterFn<T>() {
  return (row: { getValue: (id: string) => T }, id: string, value: T[]) => {
    return value.includes(row.getValue(id));
  };
}

/**
 * Base type for reservation data that can be displayed in tables
 */
type BaseReservationData = {
  resourceName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
};

/**
 * Base type for data with user information
 */
type WithUserName = {
  userName: string;
};

/**
 * Base type for data with apartment information
 */
type WithApartmentNumber = {
  apartmentNumber: string;
};

/**
 * Creates a sortable resource column with icon
 */
export function createResourceColumn<T extends BaseReservationData>(): ColumnDef<T> {
  return {
    accessorKey: "resourceName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Recurso
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("resourceName")}</span>
      </div>
    ),
  };
}

/**
 * Creates a sortable date column with formatted date
 */
export function createDateColumn<T extends BaseReservationData>(): ColumnDef<T> {
  return {
    accessorKey: "date",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Fecha
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="capitalize">{formatDate(row.getValue("date"))}</div>,
  };
}

/**
 * Creates a time range column showing start and end time
 */
export function createTimeColumn<T extends BaseReservationData>(): ColumnDef<T> {
  return {
    id: "time",
    header: "Horario",
    cell: ({ row }) => (
      <div>
        {formatTime(row.original.startTime)} - {formatTime(row.original.endTime)}
      </div>
    ),
  };
}

/**
 * Creates a status column with badge indicator
 */
export function createStatusColumn<T extends BaseReservationData>(): ColumnDef<T> {
  return {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as "confirmed" | "cancelled";
      return <ReservationStatusBadge status={status} />;
    },
  };
}

/**
 * Creates a sortable user name column
 */
export function createUserColumn<T extends WithUserName>(): ColumnDef<T> {
  return {
    accessorKey: "userName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Usuario
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("userName")}</div>,
  };
}

/**
 * Creates an apartment number column
 */
export function createApartmentColumn<T extends WithApartmentNumber>(): ColumnDef<T> {
  return {
    accessorKey: "apartmentNumber",
    header: "Apartamento",
    cell: ({ row }) => <div>{row.getValue("apartmentNumber")}</div>,
  };
}

// === History Column Factories ===

/**
 * Base type for history rows with date and status
 */
type WithHistoryStatus = {
  date: string;
  status: "confirmed" | "cancelled";
};

/**
 * Base type for rows with cancellation info
 */
type WithCancellationReason = {
  status: "confirmed" | "cancelled";
  cancellationReason?: string;
};

/**
 * Creates a history status column that shows "Completada" for past confirmed reservations.
 * Uses ReservationStatusBadge with isPast calculation.
 */
export function createHistoryStatusColumn<T extends WithHistoryStatus>(): ColumnDef<T> {
  return {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.original.status;
      const isPast = row.original.date < getTodayDateString();

      return <ReservationStatusBadge status={status} isPast={isPast} />;
    },
  };
}

/**
 * Creates a cancellation reason column.
 * Shows "-" for non-cancelled reservations, "Sin motivo" for cancelled without reason,
 * and "Con motivo" with tooltip for cancelled with reason.
 */
export function createCancellationReasonColumn<T extends WithCancellationReason>(): ColumnDef<T> {
  return {
    accessorKey: "cancellationReason",
    header: "Motivo",
    cell: ({ row }) => {
      const reason = row.original.cancellationReason;
      const status = row.original.status;

      if (status !== "cancelled") {
        return <span className="text-muted-foreground">-</span>;
      }

      if (!reason) {
        return <span className="text-muted-foreground italic">Sin motivo</span>;
      }

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help text-sm underline decoration-dotted underline-offset-2">
              Con motivo
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[300px]">
            <p className="text-sm">{reason}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
  };
}
