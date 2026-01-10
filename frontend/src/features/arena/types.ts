export interface ArenaPanelConfig {
  id: string;
  channelId: string | null;
  model: string;
  label: string;
}

export interface ArenaMetrics {
  ttft_ms?: number;
  latency_ms: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  estimated_cost?: number;
}

export interface ArenaPanelMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ArenaPanelState {
  content: string;
  isStreaming: boolean;
  error: string | null;
  metrics: ArenaMetrics | null;
  messages: ArenaPanelMessage[];
}

export interface ArenaSSEMeta {
  channels: Array<{
    index: number;
    channel_id: string;
    channel_int_id: number;
    model: string;
  }>;
}

export interface ArenaSSEChunk {
  channel_index: number;
  channel_id: string;
  channel_int_id: number;
  model: string;
  chunk: {
    choices?: Array<{
      delta?: {
        content?: string;
        reasoning_content?: string;
      };
    }>;
  };
}

export interface ArenaSSEError {
  channel_index: number;
  channel_id: string;
  channel_int_id: number;
  model: string;
  error: {
    error: {
      code?: number;
      message: string;
    };
  };
}

export interface ArenaSSEMetrics {
  channel_index: number;
  channel_id: string;
  channel_int_id: number;
  model: string;
  metrics: ArenaMetrics;
}
