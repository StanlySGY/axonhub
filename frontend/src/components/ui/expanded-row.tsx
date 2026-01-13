import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ExpandedRowFieldProps {
  label: string;
  value: ReactNode;
  className?: string;
  valueClassName?: string;
  breakAll?: boolean;
}

export function ExpandedRowField({ label, value, className, valueClassName, breakAll }: ExpandedRowFieldProps) {
  return (
    <div className={cn('flex items-start justify-between gap-2', className)}>
      <span className='text-muted-foreground shrink-0 text-sm'>{label}:</span>
      <span className={cn('text-sm text-right', breakAll && 'break-all', valueClassName)}>{value ?? '-'}</span>
    </div>
  );
}

interface ExpandedRowSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ExpandedRowSection({ title, children, className }: ExpandedRowSectionProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <h4 className='text-sm font-semibold'>{title}</h4>
      <div className='space-y-2'>{children}</div>
    </div>
  );
}

interface ExpandedRowContainerProps {
  children: ReactNode;
  className?: string;
}

export function ExpandedRowContainer({ children, className }: ExpandedRowContainerProps) {
  return (
    <div className={cn('bg-muted/30 p-4 hover:bg-muted/50 md:p-6', className)}>
      <div className='space-y-4 md:space-y-6'>{children}</div>
    </div>
  );
}

interface ExpandedRowGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function ExpandedRowGrid({ children, columns = 2, className }: ExpandedRowGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return <div className={cn('grid gap-4 md:gap-6', gridCols[columns], className)}>{children}</div>;
}
