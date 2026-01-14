import { useMemo, useCallback } from 'react';
import { useQueryChannels } from '@/features/channels/data/channels';

export function useModelSelection() {
  const { data: channelsData, isLoading } = useQueryChannels({
    first: 100,
    orderBy: { field: 'ORDERING_WEIGHT', direction: 'DESC' },
    where: { statusIn: ['enabled', 'disabled'] },
  });

  // Channel options list (sorted by orderingWeight DESC)
  const channelOptions = useMemo(() => {
    if (!channelsData?.edges) return [];
    return channelsData.edges.map((edge) => ({
      value: edge.node.id,
      label: edge.node.name,
      supportedModels: edge.node.supportedModels,
    }));
  }, [channelsData]);

  // Get models for a specific channel
  const getModelsForChannel = useCallback(
    (channelId: string): { value: string; label: string }[] => {
      const channel = channelsData?.edges?.find((edge) => edge.node.id === channelId);
      if (!channel) return [];
      return channel.node.supportedModels.map((model) => ({
        value: model,
        label: model,
      }));
    },
    [channelsData]
  );

  // Get default model for a channel (first model in the list)
  const getDefaultModel = useCallback(
    (channelId: string): string | null => {
      const channel = channelsData?.edges?.find((edge) => edge.node.id === channelId);
      if (!channel || channel.node.supportedModels.length === 0) return null;
      return channel.node.supportedModels[0];
    },
    [channelsData]
  );

  // Get default channel (first channel, highest orderingWeight)
  const getDefaultChannel = useCallback((): string | null => {
    if (!channelsData?.edges || channelsData.edges.length === 0) return null;
    return channelsData.edges[0].node.id;
  }, [channelsData]);

  const channelCount = channelsData?.edges?.length ?? 0;

  return {
    // Channel-First API
    channelOptions,
    getModelsForChannel,
    getDefaultModel,
    getDefaultChannel,
    // Common
    isLoading,
    channelCount,
  };
}
