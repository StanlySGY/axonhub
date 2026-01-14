import { memo } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { IconCheck } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import {
  ExpandedRowContainer,
  ExpandedRowGrid,
  ExpandedRowSection,
  ExpandedRowField,
} from '@/components/ui/expanded-row';
import { Model } from '../data/schema';

interface ModelExpandedRowProps {
  model: Model;
}

function BooleanIndicator({ value }: { value?: boolean }) {
  return value ? <IconCheck className='h-4 w-4 text-green-600' /> : <span>-</span>;
}

export const ModelExpandedRow = memo(({ model }: ModelExpandedRowProps) => {
  const { t } = useTranslation();
  const modelCard = model.modelCard;

  return (
    <ExpandedRowContainer>
      <ExpandedRowGrid columns={2}>
        {/* Basic Info */}
        <ExpandedRowSection title={t('models.expandedRow.basic')}>
          <ExpandedRowField
            label={t('models.columns.modelId')}
            value={<span className='font-mono text-xs'>{model.modelID}</span>}
          />
          <ExpandedRowField
            label={t('models.columns.developer')}
            value={<Badge variant='outline'>{model.developer}</Badge>}
          />
          <ExpandedRowField label={t('models.columns.group')} value={model.group} />
          <ExpandedRowField label={t('common.columns.createdAt')} value={format(model.createdAt, 'yyyy-MM-dd HH:mm')} />
          <ExpandedRowField label={t('common.columns.updatedAt')} value={format(model.updatedAt, 'yyyy-MM-dd HH:mm')} />
          {model.remark && (
            <ExpandedRowField
              label={t('models.columns.remark')}
              value={
                <span className='max-w-[200px] truncate' title={model.remark}>
                  {model.remark}
                </span>
              }
            />
          )}
        </ExpandedRowSection>

        {/* Capabilities */}
        <ExpandedRowSection title={t('models.expandedRow.capabilities')}>
          <ExpandedRowField label={t('models.modelCard.toolCall')} value={<BooleanIndicator value={modelCard?.toolCall} />} />
          <ExpandedRowField label={t('models.modelCard.vision')} value={<BooleanIndicator value={modelCard?.vision} />} />
          <ExpandedRowField label={t('models.modelCard.temperature')} value={<BooleanIndicator value={modelCard?.temperature} />} />
          <div className='space-y-1'>
            <span className='text-muted-foreground text-sm'>{t('models.modelCard.reasoning')}:</span>
            <div className='ml-4 space-y-1'>
              <ExpandedRowField
                label={t('models.modelCard.reasoningSupported')}
                value={<BooleanIndicator value={modelCard?.reasoning?.supported} />}
                className='text-xs'
              />
              <ExpandedRowField
                label={t('models.modelCard.reasoningDefault')}
                value={<BooleanIndicator value={modelCard?.reasoning?.default} />}
                className='text-xs'
              />
            </div>
          </div>
        </ExpandedRowSection>
      </ExpandedRowGrid>

      {/* Modalities + Limits | Cost */}
      <ExpandedRowGrid columns={2} className='border-t pt-4'>
        {/* Modalities + Limits */}
        <div className='space-y-4'>
          <ExpandedRowSection title={t('models.modelCard.modalities')}>
            <div className='flex items-start justify-between gap-2'>
              <span className='text-muted-foreground shrink-0 text-sm'>{t('models.modelCard.input')}:</span>
              <div className='flex flex-wrap justify-end gap-1'>
                {modelCard?.modalities?.input?.length ? (
                  modelCard.modalities.input.map((m) => (
                    <Badge key={m} variant='outline' className='text-xs'>
                      {m}
                    </Badge>
                  ))
                ) : (
                  <span className='text-sm'>-</span>
                )}
              </div>
            </div>
            <div className='flex items-start justify-between gap-2'>
              <span className='text-muted-foreground shrink-0 text-sm'>{t('models.modelCard.output')}:</span>
              <div className='flex flex-wrap justify-end gap-1'>
                {modelCard?.modalities?.output?.length ? (
                  modelCard.modalities.output.map((m) => (
                    <Badge key={m} variant='outline' className='text-xs'>
                      {m}
                    </Badge>
                  ))
                ) : (
                  <span className='text-sm'>-</span>
                )}
              </div>
            </div>
          </ExpandedRowSection>

          <ExpandedRowSection title={t('models.modelCard.limit')}>
            <ExpandedRowField
              label={t('models.modelCard.context')}
              value={<span className='font-mono text-xs'>{modelCard?.limit?.context?.toLocaleString() ?? '-'}</span>}
            />
            <ExpandedRowField
              label={t('models.modelCard.output')}
              value={<span className='font-mono text-xs'>{modelCard?.limit?.output?.toLocaleString() ?? '-'}</span>}
            />
          </ExpandedRowSection>
        </div>

        {/* Cost */}
        <ExpandedRowSection title={`${t('models.modelCard.cost')} ($/M)`}>
          <ExpandedRowField
            label={t('models.modelCard.input')}
            value={<span className='font-mono text-xs'>{modelCard?.cost?.input ?? '-'}</span>}
          />
          <ExpandedRowField
            label={t('models.modelCard.output')}
            value={<span className='font-mono text-xs'>{modelCard?.cost?.output ?? '-'}</span>}
          />
          {modelCard?.cost?.cacheRead !== undefined && (
            <ExpandedRowField
              label={t('models.modelCard.cacheRead')}
              value={<span className='font-mono text-xs'>{modelCard.cost.cacheRead}</span>}
            />
          )}
          {modelCard?.cost?.cacheWrite !== undefined && (
            <ExpandedRowField
              label={t('models.modelCard.cacheWrite')}
              value={<span className='font-mono text-xs'>{modelCard.cost.cacheWrite}</span>}
            />
          )}
        </ExpandedRowSection>
      </ExpandedRowGrid>

      {/* Dates */}
      <ExpandedRowSection title={t('models.modelCard.dates')} className='border-t pt-4'>
        <div className='flex flex-wrap gap-4 md:gap-6'>
          <div className='flex gap-2 text-sm'>
            <span className='text-muted-foreground'>{t('models.modelCard.knowledge')}:</span>
            <span>{modelCard?.knowledge || '-'}</span>
          </div>
          <div className='flex gap-2 text-sm'>
            <span className='text-muted-foreground'>{t('models.modelCard.releaseDate')}:</span>
            <span>{modelCard?.releaseDate || '-'}</span>
          </div>
          <div className='flex gap-2 text-sm'>
            <span className='text-muted-foreground'>{t('models.modelCard.lastUpdated')}:</span>
            <span>{modelCard?.lastUpdated || '-'}</span>
          </div>
        </div>
      </ExpandedRowSection>
    </ExpandedRowContainer>
  );
});

ModelExpandedRow.displayName = 'ModelExpandedRow';
