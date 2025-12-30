"use client";

import { useMutation } from "convex/react";
import type { FunctionReference, FunctionReturnType } from "convex/server";
import { toast } from "sonner";

type MutationOptions = {
  successMessage?: string;
  errorMessage?: string;
};

type MutationResult<T> = { success: true; data: T } | { success: false; error: Error };

export function useMutationWithToast<T extends FunctionReference<"mutation">>(
  mutation: T,
  options: MutationOptions = {},
) {
  const mutate = useMutation(mutation);

  const execute = async (
    args: T extends FunctionReference<"mutation", "public", infer Args> ? Args : never,
  ): Promise<MutationResult<FunctionReturnType<T>>> => {
    try {
      const result = await mutate(args);
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
