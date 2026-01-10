import { useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSelectedProjectId } from '@/stores/projectStore';
import { useArenaStore } from '../stores/arenaStore';
import type { ArenaSSEChunk, ArenaSSEError, ArenaSSEMetrics } from '../types';

export function useArenaCompare() {
  const { accessToken } = useAuthStore((state) => state.auth);
  const selectedProjectId = useSelectedProjectId();
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    panels,
    globalSystemPrompt,
    globalTemperature,
    globalMaxTokens,
    messages,
    panelStates,
    setIsComparing,
    setPanelState,
    appendPanelContent,
    setPanelMetrics,
    setPanelError,
    addUserMessage,
    addPanelMessage,
    resetPanelStates,
  } = useArenaStore();

  const compare = useCallback(
    async (userInput: string) => {
      const validPanels = panels.filter((p) => p.channelId && p.model);
      if (validPanels.length === 0) return;

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      addUserMessage(userInput);
      resetPanelStates();
      setIsComparing(true);

      // Add user message to each valid panel's history
      validPanels.forEach((p) => {
        addPanelMessage(p.id, { role: 'user', content: userInput });
      });

      validPanels.forEach((p) => {
        setPanelState(p.id, { isStreaming: true, content: '', error: null, metrics: null });
      });

      const channelIndexToId = new Map<number, string>();
      validPanels.forEach((p, idx) => {
        channelIndexToId.set(idx, p.id);
      });

      try {
        const response = await fetch('/admin/arena/compare', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'X-Project-ID': selectedProjectId || '',
          },
          body: JSON.stringify({
            channels: validPanels.map((p) => ({
              channel_id: p.channelId,
              model: p.model,
            })),
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: 'user', content: userInput },
            ],
            temperature: globalTemperature,
            max_tokens: globalMaxTokens,
            system: globalSystemPrompt,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              const eventType = line.slice(7).trim();
              continue;
            }

            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (!dataStr || dataStr === '{}') continue;

              try {
                const data = JSON.parse(dataStr);

                if ('chunk' in data) {
                  const chunk = data as ArenaSSEChunk;
                  const panelId = channelIndexToId.get(chunk.channel_index);
                  if (panelId) {
                    const content = chunk.chunk?.choices?.[0]?.delta?.content || '';
                    if (content) {
                      appendPanelContent(panelId, content);
                    }
                  }
                } else if ('error' in data && data.error?.error) {
                  const error = data as ArenaSSEError;
                  const panelId = channelIndexToId.get(error.channel_index);
                  if (panelId) {
                    setPanelError(panelId, error.error.error.message || 'Unknown error');
                  }
                } else if ('metrics' in data) {
                  const metrics = data as ArenaSSEMetrics;
                  const panelId = channelIndexToId.get(metrics.channel_index);
                  if (panelId) {
                    // Save assistant response to history before setting metrics
                    const currentContent = useArenaStore.getState().panelStates[panelId]?.content;
                    if (currentContent) {
                      addPanelMessage(panelId, { role: 'assistant', content: currentContent });
                    }
                    setPanelMetrics(panelId, metrics.metrics);
                  }
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        validPanels.forEach((p) => {
          setPanelError(p.id, err.message || 'Request failed');
        });
      } finally {
        setIsComparing(false);
      }
    },
    [
      panels,
      messages,
      globalSystemPrompt,
      globalTemperature,
      globalMaxTokens,
      accessToken,
      selectedProjectId,
      addUserMessage,
      addPanelMessage,
      resetPanelStates,
      setIsComparing,
      setPanelState,
      appendPanelContent,
      setPanelMetrics,
      setPanelError,
    ]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsComparing(false);
  }, [setIsComparing]);

  return { compare, stop };
}
