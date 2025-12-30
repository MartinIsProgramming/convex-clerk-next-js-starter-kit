"use client";

import { Loader2 } from "lucide-react";

import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type DialogLoadingOverlayProps = {
  text?: string;
  className?: string;
};

/**
 * Loading overlay for dialogs that shows a centered spinner
 * while data is being fetched.
 *
 * Use this when you want to show the dialog overlay immediately
 * but delay showing the content until data is ready.
 *
 * @example
 * <Dialog open onOpenChange={onClose}>
 *   {isPending ? (
 *     <DialogLoadingOverlay text="Cargando documento..." />
 *   ) : (
 *     <DialogContent>...</DialogContent>
 *   )}
 * </Dialog>
 */
export function DialogLoadingOverlay({ text, className }: DialogLoadingOverlayProps) {
  return (
    <DialogPortal>
      <DialogOverlay className={cn("flex items-center justify-center", className)}>
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="size-8 animate-spin" />
          {text && <p className="text-sm">{text}</p>}
        </div>
      </DialogOverlay>
    </DialogPortal>
  );
}
