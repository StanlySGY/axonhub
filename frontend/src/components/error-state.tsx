import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  className,
}: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 p-8 text-center', className)}>
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title || t('error.title', 'Something went wrong')}</h3>
        {description && (
          <p className="text-muted-foreground text-sm max-w-md">{description}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          {retryLabel || t('error.retry', 'Try again')}
        </Button>
      )}
    </div>
  );
}
