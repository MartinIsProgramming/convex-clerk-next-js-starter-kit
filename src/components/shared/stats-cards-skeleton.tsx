"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsSkeletonProps {
  count?: number;
}

const DEFAULT_SKELETON_IDS = [1, 2, 3, 4] as const;

export function StatsCardsSkeleton({ count = 4 }: StatsCardsSkeletonProps) {
  const ids = count === 4 ? DEFAULT_SKELETON_IDS : Array.from({ length: count }, (_, i) => i);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {ids.map((id) => (
        <Card key={id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="size-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-1 h-8 w-12" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
