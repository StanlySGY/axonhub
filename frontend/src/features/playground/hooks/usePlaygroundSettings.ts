import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useModelSelection } from '@/hooks/use-model-selection';

export interface PlaygroundSettings {
  model: string;
  selectedChannel: string | null;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export function usePlaygroundSettings() {
  const { t } = useTranslation();
  const {
    channelOptions,
    getModelsForChannel,
    getDefaultModel,
    getDefaultChannel,
    isLoading: channelsLoading,
    channelCount,
  } = useModelSelection();

  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(0.6);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [systemPrompt, setSystemPrompt] = useState(t('playground.settings.defaultSystemPrompt'));

  // Refs for closure-safe access in callbacks
  const settingsRef = useRef<PlaygroundSettings>({
    model,
    selectedChannel,
    temperature,
    maxTokens,
    systemPrompt,
  });

  // Keep ref synchronized
  useEffect(() => {
    settingsRef.current = { model, selectedChannel, temperature, maxTokens, systemPrompt };
  }, [model, selectedChannel, temperature, maxTokens, systemPrompt]);

  // Handle channel change - auto-select first model
  const handleChannelChange = useCallback(
    (channelId: string) => {
      setSelectedChannel(channelId);
      const defaultModel = getDefaultModel(channelId);
      setModel(defaultModel || '');
    },
    [getDefaultModel]
  );

  // Handle model change
  const handleModelChange = useCallback((newModel: string) => {
    setModel(newModel);
  }, []);

  // Get available models for current channel
  const modelOptions = getModelsForChannel(selectedChannel || '');

  // Auto-select first channel on load
  useEffect(() => {
    if (!selectedChannel && channelOptions.length > 0) {
      const defaultChannel = getDefaultChannel();
      if (defaultChannel) {
        handleChannelChange(defaultChannel);
      }
    }
  }, [channelOptions, handleChannelChange, selectedChannel, getDefaultChannel]);

  const getSettings = useCallback(() => settingsRef.current, []);

  return {
    // State values
    selectedChannel,
    model,
    temperature,
    maxTokens,
    systemPrompt,
    // Setters
    setTemperature,
    setMaxTokens,
    setSystemPrompt,
    handleChannelChange,
    handleModelChange,
    // Options (Channel-First API)
    channelOptions,
    modelOptions,
    // Loading state
    channelsLoading,
    channelCount,
    // Ref accessor for callbacks
    getSettings,
  };
}
