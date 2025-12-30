import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

type FormCardSkeletonProps = {
  fields?: number;
};

export function FormCardSkeleton({ fields = 2 }: FormCardSkeletonProps) {
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-1.5 h-5 w-80" />
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <div key={`field-skeleton-${i}`} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex gap-4">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

const APARTMENTS_SKELETON_COUNT = 6;

export function ApartmentsGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: APARTMENTS_SKELETON_COUNT }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <Card key={`apartment-skeleton-${i}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const SELECT_OPTIONS_SKELETON_COUNT = 3;

export function SelectOptionsSkeleton() {
  return (
    <div className="space-y-1 p-1">
      {Array.from({ length: SELECT_OPTIONS_SKELETON_COUNT }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <Skeleton key={`option-skeleton-${i}`} className="h-8 w-full rounded-sm" />
      ))}
    </div>
  );
}

const PRICING_SKELETON_COUNT = 3;

export function PricingCardsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {Array.from({ length: PRICING_SKELETON_COUNT }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          key={`pricing-skeleton-${i}`}
          className="animate-pulse rounded-lg border border-gray-200 p-6"
        >
          <div className="mb-4 h-6 w-24 rounded bg-gray-200" />
          <div className="mb-6 h-10 w-32 rounded bg-gray-200" />
          <div className="mb-6 space-y-3">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
          </div>
          <div className="h-12 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

type DetailPageSkeletonProps = {
  titleWidth?: string;
  columns?: number;
};

export function DetailPageSkeleton({ titleWidth = "w-48", columns = 2 }: DetailPageSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className={`h-9 ${titleWidth}`} />
          <Skeleton className="mt-1 h-5 w-32" />
        </div>
      </div>
      <div className={`grid gap-6 md:grid-cols-${columns}`}>
        {Array.from({ length: columns }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <CardSkeleton key={`detail-card-skeleton-${i}`} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para contenido de perfil de usuario (avatar + nombre + email).
 * Se usa dentro de un Card que ya tiene header estático.
 */
export function ProfileContentSkeleton() {
  return (
    <CardContent className="flex items-center gap-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    </CardContent>
  );
}

const INFO_ITEMS_SKELETON_COUNT = 4;

/**
 * Skeleton para contenido de información (lista de items icon + label + value).
 * Se usa dentro de un Card que ya tiene header estático.
 */
export function InfoContentSkeleton() {
  return (
    <CardContent className="space-y-3">
      {Array.from({ length: INFO_ITEMS_SKELETON_COUNT }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <div key={`info-skeleton-${i}`} className="flex items-center gap-3">
          <Skeleton className="h-4 w-4" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      ))}
    </CardContent>
  );
}

const NOTIFICATION_ITEMS_SKELETON_COUNT = 3;

/**
 * Skeleton for notification popover content (list of notification items).
 * Used in notification bell popover while loading.
 */
export function NotificationPopoverSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: NOTIFICATION_ITEMS_SKELETON_COUNT }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <div key={`notification-skeleton-${i}`} className="flex gap-3 rounded-lg p-3">
          <Skeleton className="size-4 shrink-0 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
