/**
 * Shared TypeScript types used across the application
 */

export type LayoutProps<TParams = Record<string, string>> = {
  children: React.ReactNode;
  params: Promise<TParams>;
};

export type Nullable<T> = T | null;
