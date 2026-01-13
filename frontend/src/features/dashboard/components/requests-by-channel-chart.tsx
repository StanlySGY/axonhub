'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequestsByChannel } from '../data/dashboard';
import { BarChartWithLegend } from './bar-chart-with-legend';

export function RequestsByChannelChart() {
  const { t } = useTranslation();
  const { data: channelData, isLoading, error } = useRequestsByChannel();

  const chartData = useMemo(() => {
    if (!channelData) return [];
    return channelData.map((item) => ({
      name: item.channelName,
      value: item.count,
    }));
  }, [channelData]);

  if (isLoading) {
    return (
      <div className='flex h-[300px] items-center justify-center'>
        <Skeleton className='h-[250px] w-[250px] rounded-full' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex h-[300px] items-center justify-center'>
        <div className='text-sm text-red-500'>
          {t('dashboard.charts.errorLoadingChannelData')} {error.message}
        </div>
      </div>
    );
  }

  if (!channelData || channelData.length === 0) {
    return (
      <div className='flex h-[300px] items-center justify-center'>
        <div className='text-muted-foreground text-sm'>{t('dashboard.charts.noChannelData')}</div>
      </div>
    );
  }

  return <BarChartWithLegend data={chartData} />;
}
