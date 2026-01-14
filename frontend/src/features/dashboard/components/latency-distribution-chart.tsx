'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { formatNumber } from '@/utils/format-number';
import { Skeleton } from '@/components/ui/skeleton';
import { useLatencyStats } from '../data/dashboard';

const COLORS = [
  'hsl(142, 76%, 36%)', // Green - fast
  'hsl(142, 71%, 45%)', // Light green
  'hsl(48, 96%, 53%)',  // Yellow
  'hsl(38, 92%, 50%)',  // Orange
  'hsl(25, 95%, 53%)',  // Dark orange
  'hsl(0, 84%, 60%)',   // Red
  'hsl(0, 72%, 51%)',   // Dark red - slow
];

type ChartTooltipProps = TooltipProps<number, string> & {
  payload?: Array<{
    value?: number;
    payload?: {
      range: string;
      count: number;
      percentage: number;
    };
  }>;
};

export function LatencyDistributionChart() {
  const { t } = useTranslation();
  const { data: latencyStats, isLoading, error } = useLatencyStats();

  const chartData = useMemo(() => {
    if (!latencyStats?.distribution) return [];
    return latencyStats.distribution.map((item) => ({
      range: item.range,
      count: item.count,
      percentage: item.percentage,
    }));
  }, [latencyStats]);

  const tooltipContent = useMemo(() => {
    return (props: ChartTooltipProps) => {
      const payload = props.payload;
      if (!props.active || !payload?.length) return null;

      const data = payload[0].payload;
      if (!data) return null;

      return (
        <div className='bg-background/90 rounded-md border px-3 py-2 text-xs shadow-sm backdrop-blur'>
          <div className='text-foreground text-sm font-medium'>{data.range}</div>
          <div className='text-muted-foreground'>
            {formatNumber(data.count)} {t('dashboard.stats.requests')} ({data.percentage.toFixed(1)}%)
          </div>
        </div>
      );
    };
  }, [t]);

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-[280px] w-full rounded-md' />
        <div className='grid grid-cols-4 gap-4'>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className='h-12 w-full rounded-md' />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex h-[320px] items-center justify-center'>
        <div className='text-sm text-red-500'>
          {t('dashboard.charts.errorLoadingLatencyData')} {error.message}
        </div>
      </div>
    );
  }

  if (!latencyStats || chartData.length === 0) {
    return (
      <div className='flex h-[320px] items-center justify-center'>
        <div className='text-muted-foreground text-sm'>{t('dashboard.charts.noLatencyData')}</div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <ResponsiveContainer width='100%' height={280}>
        <BarChart data={chartData} barSize={40}>
          <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} />
          <XAxis
            dataKey='range'
            stroke='var(--muted-foreground)'
            fontSize={11}
            tickLine={false}
            axisLine={false}
            angle={-30}
            textAnchor='end'
            height={60}
          />
          <YAxis
            stroke='var(--muted-foreground)'
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatNumber(value)}
          />
          <Tooltip content={tooltipContent} cursor={{ fill: 'var(--muted)' }} />
          <Bar dataKey='count' radius={[6, 6, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {latencyStats && (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {latencyStats.average !== null && (
            <div className='rounded-lg border bg-muted/30 p-3 text-center'>
              <div className='text-muted-foreground text-xs'>{t('dashboard.stats.average')}</div>
              <div className='text-foreground text-lg font-semibold tabular-nums'>{latencyStats.average.toFixed(0)}ms</div>
            </div>
          )}
          {latencyStats.p50 !== null && (
            <div className='rounded-lg border bg-muted/30 p-3 text-center'>
              <div className='text-muted-foreground text-xs'>P50</div>
              <div className='text-foreground text-lg font-semibold tabular-nums'>{latencyStats.p50.toFixed(0)}ms</div>
            </div>
          )}
          {latencyStats.p95 !== null && (
            <div className='rounded-lg border bg-muted/30 p-3 text-center'>
              <div className='text-muted-foreground text-xs'>P95</div>
              <div className='text-foreground text-lg font-semibold tabular-nums'>{latencyStats.p95.toFixed(0)}ms</div>
            </div>
          )}
          {latencyStats.p99 !== null && (
            <div className='rounded-lg border bg-muted/30 p-3 text-center'>
              <div className='text-muted-foreground text-xs'>P99</div>
              <div className='text-foreground text-lg font-semibold tabular-nums'>{latencyStats.p99.toFixed(0)}ms</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
