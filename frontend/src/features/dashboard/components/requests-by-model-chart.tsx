'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequestsByModel } from '../data/dashboard';
import { BarChartWithLegend } from './bar-chart-with-legend';

export function RequestsByModelChart() {
  const { t } = useTranslation();
  const { data: modelData, isLoading, error } = useRequestsByModel();

  const chartData = useMemo(() => {
    if (!modelData) return [];
    return modelData.map((item) => ({
      name: item.modelId,
      value: item.count,
    }));
  }, [modelData]);

  if (isLoading) {
    return (
      <div className='flex h-[300px] items-center justify-center'>
        <Skeleton className='h-[250px] w-full rounded-md' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex h-[300px] items-center justify-center'>
        <div className='text-sm text-red-500'>
          {t('dashboard.charts.errorLoadingModelData')} {error.message}
        </div>
      </div>
    );
  }

  if (!modelData || modelData.length === 0) {
    return (
      <div className='flex h-[300px] items-center justify-center'>
        <div className='text-muted-foreground text-sm'>{t('dashboard.charts.noModelData')}</div>
      </div>
    );
  }

  return <BarChartWithLegend data={chartData} />;
}
