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
  const { uniqueModels, getChannelsForModel, getDefaultChannel, isLoading: channelsLoading } = useModelSelection();

  const [channelPopoverOpen, setChannelPopoverOpen] = useState(false);

  // Get available channels for current model
  const availableChannels = useMemo(() => {
    if (!panel.model) return [];
    return getChannelsForModel(panel.model);
  }, [panel.model, getChannelsForModel]);

  // Get current channel name
  const currentChannelName = useMemo(() => {
    if (!panel.channelId) return '';
    const channel = availableChannels.find((ch) => ch.value === panel.channelId);
    return channel?.label || '';
  }, [panel.channelId, availableChannels]);

  // Handle model change - auto-select default channel
  const handleModelChange = useCallback(
    (model: string) => {
      const defaultChannel = getDefaultChannel(model);
      updatePanel(panel.id, { model, channelId: defaultChannel || undefined });
    },
    [panel.id, updatePanel, getDefaultChannel]
  );

  // Handle channel change
  const handleChannelChange = useCallback(
    (channelId: string) => {
      updatePanel(panel.id, { channelId });
      setChannelPopoverOpen(false);
    },
    [panel.id, updatePanel]
  );

  // Auto-select first model if none selected
  useEffect(() => {
    if (!panel.model && uniqueModels.length > 0) {
      handleModelChange(uniqueModels[0].value);
    }
  }, [panel.model, uniqueModels, handleModelChange]);

  const isStreaming = state?.isStreaming ?? false;
  const content = state?.content ?? '';
  const error = state?.error ?? null;
  const metrics = state?.metrics ?? null;
  const messages = state?.messages ?? [];

  const hasContent = messages.length > 0 || content || isStreaming;

  return (
    <div className="bg-card border-border flex h-full flex-col rounded-xl border">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        {/* Model Selector */}
        <div className="min-w-0 flex-1">
          <AutoCompleteSelect
            selectedValue={panel.model || ''}
            onSelectedValueChange={handleModelChange}
            items={uniqueModels}
            isLoading={channelsLoading}
            emptyMessage={t('playground.errors.noChannelsAvailable')}
            placeholder={t('arena.selectModel')}
          />
        </div>

        {/* Channel Badge (only show if multiple channels available) */}
        {availableChannels.length > 1 && (
          <Popover open={channelPopoverOpen} onOpenChange={setChannelPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0 gap-1 px-2 text-xs"
              >
                <span className="max-w-[80px] truncate">{currentChannelName || t('arena.selectChannel')}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="end">
              <div className="space-y-1">
                {availableChannels.map((channel) => (
                  <Button
                    key={channel.value}
                    variant={channel.value === panel.channelId ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => handleChannelChange(channel.value)}
                  >
                    {channel.label}
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
