"use client";

import { useAction } from "convex/react";
import type { FunctionReference, FunctionReturnType } from "convex/server";
import { toast } from "sonner";

type ActionOptions = {
  successMessage?: string;
  errorMessage?: string;
};

type ActionResult<T> = { success: true; data: T } | { success: false; error: Error };

export function useActionWithToast<T extends FunctionReference<"action">>(
  action: T,
  options: ActionOptions = {},
) {
  const runAction = useAction(action);

  const execute = async (
    args: T extends FunctionReference<"action", "public", infer Args> ? Args : never,
  ): Promise<ActionResult<FunctionReturnType<T>>> => {
    try {
      const result = await runAction(args);
      if (options.successMessage) {
        toast.success(options.successMessage);
      }
      return { success: true, data: result };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Ocurrió un error inesperado");
      toast.error(options.errorMessage ?? "Error", {
        description: err.message,
      });
      return { success: false, error: err };
    }
  };

  return execute;
}
