import { useMemo, useCallback } from 'react';
import { X, Clock, Zap, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AutoCompleteSelect } from '@/components/auto-complete-select';
import { Response as UIResponse } from '@/components/ai-elements/response';
import { Loader } from '@/components/ai-elements/loader';
import { useQueryChannels } from '@/features/channels/data/channels';
import { useArenaStore } from '../stores/arenaStore';
import type { ArenaPanelConfig, ArenaPanelState } from '../types';

interface ArenaPanelProps {
  panel: ArenaPanelConfig;
  state: ArenaPanelState | undefined;
  canRemove: boolean;
}

export function ArenaPanel({ panel, state, canRemove }: ArenaPanelProps) {
  const { t } = useTranslation();
  const { updatePanel, removePanel } = useArenaStore();

  const { data: channelsData, isLoading: channelsLoading } = useQueryChannels({
    first: 100,
    orderBy: { field: 'ORDERING_WEIGHT', direction: 'DESC' },
    where: { statusIn: ['enabled', 'disabled'] },
  });

  const modelOptions = useMemo(() => {
    if (!channelsData?.edges) return [];
    return channelsData.edges.flatMap((edge) =>
      edge.node.supportedModels.map((model) => ({
        value: `${edge.node.id}|${model}`,
        label: `${edge.node.name} - ${model}`,
      }))
    );
  }, [channelsData]);

  const selectedValue = panel.channelId && panel.model ? `${panel.channelId}|${panel.model}` : '';

  const handleModelChange = useCallback(
    (value: string) => {
      const [channelId, model] = value.split('|');
      updatePanel(panel.id, { channelId, model });
    },
    [panel.id, updatePanel]
  );

  const isStreaming = state?.isStreaming ?? false;
  const content = state?.content ?? '';
  const error = state?.error ?? null;
  const metrics = state?.metrics ?? null;

  return (
    <div className="bg-card border-border flex h-full flex-col rounded-xl border">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex-1 pr-2">
          <AutoCompleteSelect
            selectedValue={selectedValue}
            onSelectedValueChange={handleModelChange}
            items={modelOptions}
            isLoading={channelsLoading}
            emptyMessage={t('playground.errors.noChannelsAvailable')}
            placeholder={t('arena.selectModel')}
          />
        </div>
        {canRemove && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removePanel(panel.id)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        {error ? (
          <div className="text-destructive rounded-lg bg-red-50 p-3 text-sm dark:bg-red-950/20">{error}</div>
        ) : content ? (
          <UIResponse>{content}</UIResponse>
        ) : isStreaming ? (
          <Loader />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            {t('arena.waitingForInput')}
          </div>
        )}
      </ScrollArea>

      {metrics && (
        <div className="border-t p-3">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="text-muted-foreground h-3 w-3" />
              <span className="text-muted-foreground">TTFT:</span>
              <span className="font-medium">{metrics.ttft_ms ?? '-'}ms</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="text-muted-foreground h-3 w-3" />
              <span className="text-muted-foreground">{t('arena.latency')}:</span>
              <span className="font-medium">{metrics.latency_ms}ms</span>
            </div>
            <div className="flex items-center gap-1">
              <Coins className="text-muted-foreground h-3 w-3" />
              <span className="text-muted-foreground">{t('arena.tokens')}:</span>
              <span className="font-medium">{metrics.total_tokens ?? '-'}</span>
            </div>
          </div>
          {metrics.estimated_cost !== undefined && metrics.estimated_cost > 0 && (
            <div className="text-muted-foreground mt-1 text-xs">
              {t('arena.estimatedCost')}: ${metrics.estimated_cost.toFixed(6)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
