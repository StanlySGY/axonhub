import { useMemo, useCallback } from 'react';
import { useQueryChannels } from '@/features/channels/data/channels';

interface ChannelInfo {
  id: string;
  name: string;
  orderingWeight: number;
}

export function useModelSelection() {
  const { data: channelsData, isLoading } = useQueryChannels({
    first: 100,
    orderBy: { field: 'ORDERING_WEIGHT', direction: 'DESC' },
    where: { statusIn: ['enabled', 'disabled'] },
  });

  // Build model -> channels mapping
  const modelChannelsMap = useMemo(() => {
    if (!channelsData?.edges) return new Map<string, ChannelInfo[]>();

    const map = new Map<string, ChannelInfo[]>();

    channelsData.edges.forEach((edge) => {
      const channelInfo: ChannelInfo = {
        id: edge.node.id,
        name: edge.node.name,
        orderingWeight: edge.node.orderingWeight ?? 0,
      };

      edge.node.supportedModels.forEach((model) => {
        const existing = map.get(model) || [];
        existing.push(channelInfo);
        map.set(model, existing);
      });
    });

    // Sort channels by orderingWeight (DESC) for each model
    map.forEach((channels, model) => {
      channels.sort((a, b) => b.orderingWeight - a.orderingWeight);
      map.set(model, channels);
    });

    return map;
  }, [channelsData]);

  // Unique models list (sorted alphabetically)
  const uniqueModels = useMemo(() => {
    const models = Array.from(modelChannelsMap.keys()).sort();
    return models.map((model) => ({
      value: model,
      label: model,
    }));
  }, [modelChannelsMap]);

  // Get channels for a specific model
  const getChannelsForModel = useCallback(
    (model: string): { value: string; label: string }[] => {
      const channels = modelChannelsMap.get(model) || [];
      return channels.map((ch) => ({
        value: ch.id,
        label: ch.name,
      }));
    },
    [modelChannelsMap]
  );

  // Get default channel for a model (highest orderingWeight)
  const getDefaultChannel = useCallback(
    (model: string): string | null => {
      const channels = modelChannelsMap.get(model);
      if (!channels || channels.length === 0) return null;
      return channels[0].id; // Already sorted by orderingWeight DESC
    },
    [modelChannelsMap]
  );

  // Legacy: combined options for backward compatibility
  const combinedOptions = useMemo(() => {
    if (!channelsData?.edges) return [];
    return channelsData.edges.flatMap((edge) =>
      edge.node.supportedModels.map((model) => ({
        value: `${edge.node.id}|${model}`,
        label: `${edge.node.name} - ${model}`,
      }))
    );
  }, [channelsData]);

  const channelCount = channelsData?.edges?.length ?? 0;

  return {
    // New API
    uniqueModels,
    getChannelsForModel,
    getDefaultChannel,
    // Legacy API (backward compatibility)
    combinedOptions,
    // Common
    isLoading,
    channelCount,
  };
}
