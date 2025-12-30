"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type FormActionsProps = {
  isSubmitting: boolean;
  isValid: boolean;
  submitLabel: string;
  submittingLabel: string;
  cancelLabel?: string;
  onCancel?: () => void;
};

/**
 * Form action buttons for creation forms.
 * Includes Cancel (goes back) and Submit buttons.
 *
 * For edit forms, use a single Button with `disabled={!isDirty || !isValid || isSubmitting}` instead.
 */
export function FormActions({
  isSubmitting,
  isValid,
  submitLabel,
  submittingLabel,
  cancelLabel = "Cancel",
  onCancel,
}: FormActionsProps) {
  const router = useRouter();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
        {cancelLabel}
      </Button>
      <Button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </div>
  );
}
