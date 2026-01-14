import { useMemo, useCallback, useState, useEffect } from 'react';
import { X, Clock, Zap, Coins, Copy, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AutoCompleteSelect } from '@/components/auto-complete-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response as UIResponse } from '@/components/ai-elements/response';
import { Loader } from '@/components/ai-elements/loader';
import { Actions, Action } from '@/components/ai-elements/actions';
import { useModelSelection } from '@/hooks/use-model-selection';
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
  const { channelOptions, getModelsForChannel, getDefaultModel, getDefaultChannel, isLoading: channelsLoading } = useModelSelection();

  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);

  // Get available models for current channel
  const availableModels = useMemo(() => {
    if (!panel.channelId) return [];
    return getModelsForChannel(panel.channelId);
  }, [panel.channelId, getModelsForChannel]);

  // Handle channel change - auto-select first model
  const handleChannelChange = useCallback(
    (channelId: string) => {
      const defaultModel = getDefaultModel(channelId);
      updatePanel(panel.id, { channelId, model: defaultModel || undefined });
    },
    [panel.id, updatePanel, getDefaultModel]
  );

  // Handle model change
  const handleModelChange = useCallback(
    (model: string) => {
      updatePanel(panel.id, { model });
      setModelPopoverOpen(false);
    },
    [panel.id, updatePanel]
  );

  // Auto-select first channel if none selected
  useEffect(() => {
    if (!panel.channelId && channelOptions.length > 0) {
      const defaultChannel = getDefaultChannel();
      if (defaultChannel) {
        handleChannelChange(defaultChannel);
      }
    }
  }, [panel.channelId, channelOptions, handleChannelChange, getDefaultChannel]);

  const isStreaming = state?.isStreaming ?? false;
  const content = state?.content ?? '';
  const error = state?.error ?? null;
  const metrics = state?.metrics ?? null;
  const messages = state?.messages ?? [];

  const hasContent = messages.length > 0 || content || isStreaming;

  return (
    <div className="bg-card border-border flex h-full flex-col rounded-xl border">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        {/* Channel Selector (Primary) */}
        <div className="min-w-0 flex-1">
          <AutoCompleteSelect
            selectedValue={panel.channelId || ''}
            onSelectedValueChange={handleChannelChange}
            items={channelOptions}
            isLoading={channelsLoading}
            emptyMessage={t('playground.errors.noChannelsAvailable')}
            placeholder={t('arena.selectChannel')}
          />
        </div>

        {/* Model Badge (Secondary, only show if channel selected) */}
        {panel.channelId && availableModels.length > 0 && (
          <Popover open={modelPopoverOpen} onOpenChange={setModelPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0 gap-1 px-2 text-xs"
              >
                <span className="max-w-[100px] truncate">{panel.model || t('arena.selectModel')}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1" align="end">
              <div className="max-h-[200px] space-y-1 overflow-y-auto">
                {availableModels.map((model) => (
                  <Button
                    key={model.value}
                    variant={model.value === panel.model ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => handleModelChange(model.value)}
                  >
                    {model.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {canRemove && (
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removePanel(panel.id)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Conversation className="flex-1">
        <ConversationContent className="gap-4 p-4">
          {error ? (
            <div className="text-destructive rounded-lg bg-red-50 p-3 text-sm dark:bg-red-950/20">{error}</div>
          ) : hasContent ? (
            <>
              {messages.map((msg, idx) => (
                <Message key={idx} from={msg.role}>
                  <MessageContent>
                    <UIResponse>{msg.content}</UIResponse>
                  </MessageContent>
                </Message>
              ))}
              {content && (
                <Message from="assistant">
                  <MessageContent>
                    <UIResponse>{content}</UIResponse>
                    <Actions className="mt-2">
                      <Action
                        onClick={() => {
                          navigator.clipboard.writeText(content);
                          toast.success(t('copy'));
                        }}
                        label={t('copy')}
                      >
                        <Copy className="size-3" />
                      </Action>
                    </Actions>
                  </MessageContent>
                </Message>
              )}
              {isStreaming && !content && <Loader />}
            </>
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              {t('arena.waitingForInput')}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

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
