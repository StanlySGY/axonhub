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
    uniqueModels,
    getChannelsForModel,
    getDefaultChannel,
    isLoading: channelsLoading,
    channelCount,
  } = useModelSelection();

  const [model, setModel] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
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

  // Handle model change - auto-select default channel
  const handleModelChange = useCallback(
    (newModel: string) => {
      setModel(newModel);
      const defaultChannel = getDefaultChannel(newModel);
      setSelectedChannel(defaultChannel);
    },
    [getDefaultChannel]
  );

  // Handle channel change
  const handleChannelChange = useCallback((channelId: string) => {
    setSelectedChannel(channelId);
  }, []);

  // Get available channels for current model
  const availableChannels = getChannelsForModel(model);

  // Auto-select first model on load
  useEffect(() => {
    if (!model && uniqueModels.length > 0) {
      handleModelChange(uniqueModels[0].value);
    }
  }, [uniqueModels, handleModelChange, model]);

  const getSettings = useCallback(() => settingsRef.current, []);

  return {
    // State values
    model,
    selectedChannel,
    temperature,
    maxTokens,
    systemPrompt,
    // Setters
    setTemperature,
    setMaxTokens,
    setSystemPrompt,
    handleModelChange,
    handleChannelChange,
    // Model options (new API)
    modelOptions: uniqueModels,
    channelOptions: availableChannels,
    // Loading state
    channelsLoading,
    channelCount,
    // Ref accessor for callbacks
    getSettings,
  };
}
