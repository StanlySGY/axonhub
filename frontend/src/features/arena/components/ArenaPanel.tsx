import { useMemo, useCallback } from 'react';
import { X, Clock, Zap, Coins, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AutoCompleteSelect } from '@/components/auto-complete-select';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response as UIResponse } from '@/components/ai-elements/response';
import { Loader } from '@/components/ai-elements/loader';
import { Actions, Action } from '@/components/ai-elements/actions';
import { useChannelModels } from '@/hooks/use-channel-models';
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
  const { modelOptions, isLoading: channelsLoading } = useChannelModels();

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
  const messages = state?.messages ?? [];

  const hasContent = messages.length > 0 || content || isStreaming;

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
