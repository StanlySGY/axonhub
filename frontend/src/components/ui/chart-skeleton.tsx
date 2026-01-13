import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ChartSkeletonProps extends React.ComponentProps<'div'> {
  height?: number | string;
}

export function ChartSkeleton({ height = 350, className, ...props }: ChartSkeletonProps) {
  return (
    <Skeleton className={cn('w-full rounded-xl', className)} style={{ height }} {...props} />
  );
}
