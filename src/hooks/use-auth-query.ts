"use client";

import { convexQuery } from "@convex-dev/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useConvexAuth } from "convex/react";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";

type AuthQueryOptions = Omit<
  UseQueryOptions<unknown, Error, unknown, unknown[]>,
  "queryKey" | "queryFn"
>;

/**
 * A wrapper around useQuery + convexQuery that automatically handles
 * the authentication skip pattern.
 *
 * Instead of:
 * ```tsx
 * const { isAuthenticated, isLoading } = useConvexAuth();
 * const { data } = useQuery(
 *   convexQuery(api.something, !isLoading && isAuthenticated ? args : "skip")
 * );
 * ```
 *
 * You can write:
 * ```tsx
 * const { data } = useAuthQuery(api.something, args);
 * ```
 *
 * @param query - The Convex query function reference
 * @param args - The arguments to pass to the query
 * @param options - Additional TanStack Query options (e.g., placeholderData)
 */
export function useAuthQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>,
  options?: AuthQueryOptions,
) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const shouldSkip = isLoading || !isAuthenticated;
  const queryArgs: FunctionArgs<Query> | "skip" = shouldSkip ? "skip" : args;

  return useQuery({
    ...convexQuery(query, queryArgs),
    ...options,
  }) as ReturnType<typeof useQuery<FunctionReturnType<Query>, Error>>;
}
