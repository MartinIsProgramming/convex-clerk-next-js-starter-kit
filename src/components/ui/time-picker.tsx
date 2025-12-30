"use client";

import { AlertCircle, Clock } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Generate time slots in 30-minute intervals (00:00 to 23:30) */
function generateTimeSlots(intervalMinutes = 30): string[] {
  const slots: string[] = [];
  const slotsPerDay = (24 * 60) / intervalMinutes;

  for (let i = 0; i < slotsPerDay; i++) {
    const totalMinutes = i * intervalMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    slots.push(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
  }

  return slots;
}

const TIME_SLOTS = generateTimeSlots(30);

type TimePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  "aria-label"?: string;
};

export function TimePicker({
  value,
  onChange,
  placeholder = "Seleccionar hora",
  disabled = false,
  className,
  error,
  "aria-label": ariaLabel,
}: TimePickerProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn("w-full", className)}
        aria-label={ariaLabel}
        aria-invalid={!!error}
      >
        <Clock className="mr-2 size-4 shrink-0 text-muted-foreground" />
        <SelectValue placeholder={placeholder} className="flex-1" />
        <span className="ml-auto flex w-5 shrink-0 items-center justify-center">
          {error && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex cursor-help items-center">
                  <AlertCircle className="size-4 text-destructive" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{error}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </span>
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {TIME_SLOTS.map((time) => (
          <SelectItem key={time} value={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
