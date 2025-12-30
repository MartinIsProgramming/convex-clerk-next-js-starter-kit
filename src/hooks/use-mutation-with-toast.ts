"use client";

import { useMutation } from "convex/react";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import { useState } from "react";
import { toast } from "sonner";

type MutationWithToastOptions = {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

/**
 * A wrapper around useMutation that automatically shows toast notifications.
 *
 * @example
 * ```tsx
 * const deleteProduct = useMutationWithToast(api.products.remove, {
 *   successMessage: "Product deleted",
 *   errorMessage: "Error deleting product",
 * });
 *
 * <button onClick={() => deleteProduct({ id: productId })}>Delete</button>
 * ```
 */
export function useMutationWithToast<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation,
  options: MutationWithToastOptions = {},
) {
  const mutationFn = useMutation(mutation);
  const [isPending, setIsPending] = useState(false);

  const execute = async (args: FunctionArgs<Mutation>): Promise<FunctionReturnType<Mutation>> => {
    setIsPending(true);
    try {
      const result = await mutationFn(args);
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
