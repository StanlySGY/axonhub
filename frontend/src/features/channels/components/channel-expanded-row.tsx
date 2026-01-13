import { memo } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { formatDuration } from '@/utils/format-duration';
import { Badge } from '@/components/ui/badge';
import {
  ExpandedRowContainer,
  ExpandedRowGrid,
  ExpandedRowSection,
  ExpandedRowField,
} from '@/components/ui/expanded-row';
import { CHANNEL_CONFIGS } from '../data/config_channels';
import { Channel } from '../data/schema';

interface ChannelExpandedRowProps {
  channel: Channel;
  columnsLength?: number;
  getApiFormatLabel: (apiFormat?: string) => string;
}

export const ChannelExpandedRow = memo(({ channel, getApiFormatLabel }: ChannelExpandedRowProps) => {
  const { t } = useTranslation();
  const config = CHANNEL_CONFIGS[channel.type];
  const performance = channel.channelPerformance;

  return (
    <ExpandedRowContainer>
      <ExpandedRowGrid columns={2}>
        <ExpandedRowSection title={t('channels.expandedRow.basic')}>
          <ExpandedRowField
            label={t('channels.columns.baseURL')}
            value={<span className='font-mono text-xs'>{channel.baseURL}</span>}
            breakAll
          />
          <ExpandedRowField
            label={t('channels.columns.type')}
            value={
              <Badge variant='outline' className={config?.color}>
                {t(`channels.types.${channel.type}`)}
              </Badge>
            }
          />
          <ExpandedRowField
            label={t('channels.expandedRow.apiFormat')}
            value={<span className='font-mono text-xs'>{getApiFormatLabel(config?.apiFormat)}</span>}
          />
          <ExpandedRowField label={t('common.columns.createdAt')} value={format(channel.createdAt, 'yyyy-MM-dd HH:mm')} />
          <ExpandedRowField label={t('common.columns.updatedAt')} value={format(channel.updatedAt, 'yyyy-MM-dd HH:mm')} />
        </ExpandedRowSection>

        <div className='space-y-4 md:space-y-6'>
          <ExpandedRowSection title={t('channels.expandedRow.additional')}>
            <ExpandedRowField
              label={t('channels.columns.orderingWeight')}
              value={<span className='font-mono text-xs'>{channel.orderingWeight ?? 0}</span>}
            />
            <ExpandedRowField
              label={t('channels.expandedRow.remark')}
              value={
                <span className='max-w-[200px] truncate' title={channel.remark || undefined}>
                  {channel.remark || '-'}
                </span>
              }
            />
            <div className='flex items-start justify-between gap-2'>
              <span className='text-muted-foreground shrink-0 text-sm'>{t('channels.expandedRow.tags')}:</span>
              <div className='flex max-w-[200px] flex-wrap justify-end gap-1'>
                {channel.tags && channel.tags.length > 0 ? (
                  channel.tags.map((tag) => (
                    <Badge key={tag} variant='outline' className='text-xs'>
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className='text-sm'>-</span>
                )}
              </div>
            </div>
          </ExpandedRowSection>

          <ExpandedRowSection title={t('channels.expandedRow.performance')}>
            {performance ? (
              <>
                <ExpandedRowField
                  label={t('channels.columns.firstTokenLatencyFull')}
                  value={formatDuration(performance.avgStreamFirstTokenLatencyMs || performance.avgLatencyMs || 0)}
                />
                <ExpandedRowField
                  label={t('channels.columns.tokensPerSecondFull')}
                  value={(performance.avgStreamTokenPerSecond || performance.avgTokenPerSecond || 0).toFixed(1)}
                />
              </>
            ) : (
              <span className='text-muted-foreground text-sm'>{t('channels.expandedRow.noPerformanceData')}</span>
            )}
          </ExpandedRowSection>
        </div>
      </ExpandedRowGrid>

      {channel.supportedModels && channel.supportedModels.length > 0 && (
        <ExpandedRowSection title={t('channels.expandedRow.supportedModels')}>
          <div className='flex flex-wrap gap-2'>
            {channel.supportedModels.map((model) => (
              <Badge key={model} variant='secondary' className='font-mono text-xs'>
                {model}
              </Badge>
            ))}
          </div>
        </ExpandedRowSection>
      )}
    </ExpandedRowContainer>
  );
});

ChannelExpandedRow.displayName = 'ChannelExpandedRow';
