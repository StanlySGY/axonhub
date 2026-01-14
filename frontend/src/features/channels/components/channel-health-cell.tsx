import { memo, useMemo } from 'react';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChannelProbePoint } from '../data/schema';

interface ChannelHealthCellProps {
  points: ChannelProbePoint[];
}

export const ChannelHealthCell = memo(({ points }: ChannelHealthCellProps) => {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    if (!points || points.length === 0) return null;

    const totalRequests = points.reduce((sum, p) => sum + p.totalRequestCount, 0);
    const successRequests = points.reduce((sum, p) => sum + p.successRequestCount, 0);
    const overallRate = totalRequests > 0 ? (successRequests / totalRequests) * 100 : 0;

    // Calculate trend (compare last 5 vs previous 5)
    const recentPoints = points.slice(-5);
    const previousPoints = points.slice(-10, -5);

    const recentTotal = recentPoints.reduce((sum, p) => sum + p.totalRequestCount, 0);
    const recentSuccess = recentPoints.reduce((sum, p) => sum + p.successRequestCount, 0);
    const recentRate = recentTotal > 0 ? recentSuccess / recentTotal : 0;

    const prevTotal = previousPoints.reduce((sum, p) => sum + p.totalRequestCount, 0);
    const prevSuccess = previousPoints.reduce((sum, p) => sum + p.successRequestCount, 0);
    const prevRate = prevTotal > 0 ? prevSuccess / prevTotal : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (previousPoints.length > 0 && recentPoints.length > 0) {
      const diff = recentRate - prevRate;
      if (diff > 0.05) trend = 'up';
      else if (diff < -0.05) trend = 'down';
    }

    return { overallRate, trend, totalRequests, successRequests };
  }, [points]);

  if (!points || points.length === 0) {
    return <span className='text-muted-foreground text-xs'>-</span>;
  }

  const maxBars = 15;
  const displayPoints = points.slice(-maxBars);

  return (
    <div className='flex items-center gap-2'>
      <div className='flex items-center gap-0.5'>
        {displayPoints.map((point, index) => {
          const hasRequests = point.totalRequestCount > 0;
          const successRate = hasRequests
            ? point.successRequestCount / point.totalRequestCount
            : 0;

          const isHealthy = hasRequests && successRate >= 0.9;
          const isWarning = hasRequests && successRate >= 0.5 && successRate < 0.9;
          const isError = hasRequests && successRate < 0.5;
          const isIdle = !hasRequests;

          const probeTime = format(new Date(point.timestamp * 1000), 'MM-dd HH:mm');

          return (
            <Tooltip key={`${point.timestamp}-${index}`}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'h-8 w-1.5 cursor-help rounded-sm transition-opacity hover:opacity-80',
                    isHealthy && 'bg-green-500',
                    isWarning && 'bg-yellow-500',
                    isError && 'bg-red-500',
                    isIdle && 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <div className='space-y-1 text-xs'>
                  <div>{t('channels.columns.healthTooltip.probeTime')}: {probeTime}</div>
                  <div>{t('channels.columns.healthTooltip.successRate')}: {point.successRequestCount}/{point.totalRequestCount}</div>
                  {hasRequests && (
                    <div className={cn(
                      'font-medium',
                      successRate >= 0.9 && 'text-green-500',
                      successRate >= 0.5 && successRate < 0.9 && 'text-yellow-500',
                      successRate < 0.5 && 'text-red-500'
                    )}>
                      {(successRate * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      {stats && stats.totalRequests > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='flex items-center gap-1 cursor-help'>
              <span className={cn(
                'text-xs font-medium tabular-nums',
                stats.overallRate >= 90 && 'text-green-600 dark:text-green-400',
                stats.overallRate >= 50 && stats.overallRate < 90 && 'text-yellow-600 dark:text-yellow-400',
                stats.overallRate < 50 && 'text-red-600 dark:text-red-400'
              )}>
                {stats.overallRate.toFixed(0)}%
              </span>
              {stats.trend === 'up' && <TrendingUp className='h-3 w-3 text-green-500' />}
              {stats.trend === 'down' && <TrendingDown className='h-3 w-3 text-red-500' />}
              {stats.trend === 'stable' && <Minus className='h-3 w-3 text-muted-foreground' />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className='space-y-1 text-xs'>
              <div>{t('channels.columns.healthTooltip.overallRate')}: {stats.overallRate.toFixed(1)}%</div>
              <div>{t('channels.columns.healthTooltip.totalRequests')}: {stats.successRequests}/{stats.totalRequests}</div>
              <div>{t('channels.columns.healthTooltip.trend')}: {t(`channels.columns.healthTooltip.trend${stats.trend.charAt(0).toUpperCase() + stats.trend.slice(1)}`)}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
});

ChannelHealthCell.displayName = 'ChannelHealthCell';
