'use client';

import { useTranslation } from 'react-i18next';
import { CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { formatNumber } from '@/utils/format-number';
import { ChartSkeleton } from '@/components/ui/chart-skeleton';
import { ErrorState } from '@/components/error-state';
import { useDailyRequestStats } from '../data/dashboard';

export function DailyRequestStats() {
  const { t } = useTranslation();
  const { data: dailyStats, isLoading, error, refetch } = useDailyRequestStats();

  if (isLoading) {
    return <ChartSkeleton height={350} />;
  }

  if (error) {
    return (
      <ErrorState
        title={t('dashboard.charts.errorLoadingChart')}
        description={error.message}
        onRetry={() => refetch()}
        className="h-[350px]"
      />
    );
  }

  // Transform data for the chart
  const chartData =
    dailyStats?.map((stat) => ({
      name: new Date(stat.date).toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
      }),
      total: stat.count,
    })) || [];

  // Calculate max value for Y-axis domain
  const maxValue = Math.max(...chartData.map((d) => d.total), 0);
  const yAxisMax = Math.max(10, Math.ceil(maxValue * 1.1));

  // Calculate total requests for accessibility summary
  const totalRequests = chartData.reduce((sum, d) => sum + d.total, 0);

  return (
    <div
      role="img"
      aria-label={t('dashboard.charts.dailyRequestOverview') + `: ${totalRequests} ${t('dashboard.stats.totalRequests')}`}
    >
      <ResponsiveContainer width='100%' height={350}>
        <AreaChart data={chartData}>
        <defs>
          <linearGradient id='colorTotal' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='var(--primary)' stopOpacity={0.2} />
            <stop offset='95%' stopColor='var(--primary)' stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} />
        <XAxis dataKey='name' stroke='var(--muted-foreground)' fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke='var(--muted-foreground)'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={[0, yAxisMax]}
          tickFormatter={(value) => formatNumber(value)}
        />
        <Tooltip formatter={(value) => formatNumber(Number(value))} />
        <Area
          type='monotone'
          dataKey='total'
          stroke='var(--primary)'
          strokeWidth={2}
          fillOpacity={1}
          fill='url(#colorTotal)'
          dot={false}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
}
