import { useMemo } from 'react';
import { useQueryChannels } from '@/features/channels/data/channels';

export function useChannelModels() {
  const { data: channelsData, isLoading } = useQueryChannels({
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

  return { modelOptions, isLoading };
}
