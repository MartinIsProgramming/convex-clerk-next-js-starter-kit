"use client";

import { useAction } from "convex/react";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import { useState } from "react";
import { toast } from "sonner";

type ActionWithToastOptions = {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

/**
 * A wrapper around useAction that automatically shows toast notifications.
 *
 * @example
 * ```tsx
 * const generateReport = useActionWithToast(api.reports.generate, {
 *   successMessage: "Report generated",
 *   errorMessage: "Error generating report",
 * });
 *
 * <button onClick={() => generateReport({ type: "monthly" })}>Generate</button>
 * ```
 */
export function useActionWithToast<Action extends FunctionReference<"action">>(
  action: Action,
  options: ActionWithToastOptions = {},
) {
  const actionFn = useAction(action);
  const [isPending, setIsPending] = useState(false);

  const execute = async (args: FunctionArgs<Action>): Promise<FunctionReturnType<Action>> => {
    setIsPending(true);
    try {
      const result = await actionFn(args);
      if (options.successMessage) {
        toast.success(options.successMessage);
      }
      options.onSuccess?.();
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast.error(options.errorMessage ?? errorMsg);
      options.onError?.(error instanceof Error ? error : new Error(errorMsg));
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return Object.assign(execute, { isPending });
}
