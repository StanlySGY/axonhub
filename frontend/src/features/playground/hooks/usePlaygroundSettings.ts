import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useChannelModels } from '@/hooks/use-channel-models';

export interface PlaygroundSettings {
  model: string;
  selectedChannel: string | null;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export function usePlaygroundSettings() {
  const { t } = useTranslation();
  const { modelOptions, isLoading: channelsLoading, channelCount } = useChannelModels();

  const [selectedGroupModel, setSelectedGroupModel] = useState('');
  const [model, setModel] = useState('gpt-4o');
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

  const handleModelChange = useCallback((newModel: string) => {
    setSelectedGroupModel(newModel);
    const parts = newModel.split('|');
    if (parts.length >= 2) {
      setModel(parts[1]);
      setSelectedChannel(parts[0]);
    }
  }, []);

  // Auto-select first model
  useEffect(() => {
    if (!selectedGroupModel && modelOptions.length > 0) {
      handleModelChange(modelOptions[0].value);
    }
  }, [modelOptions, handleModelChange, selectedGroupModel]);

  const getSettings = useCallback(() => settingsRef.current, []);

  return {
    // State values
    selectedGroupModel,
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
    // Model options
    modelOptions,
    channelsLoading,
    channelCount,
    // Ref accessor for callbacks
    getSettings,
  };
}
