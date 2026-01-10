import { create } from 'zustand';
import type { ArenaPanelConfig, ArenaPanelState, ArenaMetrics } from '../types';

interface ArenaStore {
  panels: ArenaPanelConfig[];
  panelStates: Record<string, ArenaPanelState>;
  globalSystemPrompt: string;
  globalTemperature: number;
  globalMaxTokens: number;
  isComparing: boolean;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;

  addPanel: () => void;
  removePanel: (id: string) => void;
  updatePanel: (id: string, updates: Partial<ArenaPanelConfig>) => void;
  setPanelState: (id: string, state: Partial<ArenaPanelState>) => void;
  appendPanelContent: (id: string, content: string) => void;
  setPanelMetrics: (id: string, metrics: ArenaMetrics) => void;
  setPanelError: (id: string, error: string) => void;
  setGlobalSystemPrompt: (prompt: string) => void;
  setGlobalTemperature: (temp: number) => void;
  setGlobalMaxTokens: (tokens: number) => void;
  setIsComparing: (comparing: boolean) => void;
  addUserMessage: (content: string) => void;
  clearMessages: () => void;
  resetPanelStates: () => void;
}

const createDefaultPanel = (index: number): ArenaPanelConfig => ({
  id: `panel-${Date.now()}-${index}`,
  channelId: null,
  model: '',
  label: `Model ${index + 1}`,
});

const createDefaultPanelState = (): ArenaPanelState => ({
  content: '',
  isStreaming: false,
  error: null,
  metrics: null,
});

export const useArenaStore = create<ArenaStore>((set, get) => ({
  panels: [createDefaultPanel(0), createDefaultPanel(1)],
  panelStates: {},
  globalSystemPrompt: 'You are a helpful assistant.',
  globalTemperature: 0.6,
  globalMaxTokens: 4096,
  isComparing: false,
  messages: [],

  addPanel: () => {
    const { panels } = get();
    if (panels.length >= 4) return;
    set({ panels: [...panels, createDefaultPanel(panels.length)] });
  },

  removePanel: (id) => {
    const { panels, panelStates } = get();
    if (panels.length <= 2) return;
    const newPanelStates = { ...panelStates };
    delete newPanelStates[id];
    set({
      panels: panels.filter((p) => p.id !== id),
      panelStates: newPanelStates,
    });
  },

  updatePanel: (id, updates) => {
    set((state) => ({
      panels: state.panels.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  setPanelState: (id, partialState) => {
    set((state) => ({
      panelStates: {
        ...state.panelStates,
        [id]: { ...(state.panelStates[id] || createDefaultPanelState()), ...partialState },
      },
    }));
  },

  appendPanelContent: (id, content) => {
    set((state) => {
      const current = state.panelStates[id] || createDefaultPanelState();
      return {
        panelStates: {
          ...state.panelStates,
          [id]: { ...current, content: current.content + content },
        },
      };
    });
  },

  setPanelMetrics: (id, metrics) => {
    set((state) => {
      const current = state.panelStates[id] || createDefaultPanelState();
      return {
        panelStates: {
          ...state.panelStates,
          [id]: { ...current, metrics, isStreaming: false },
        },
      };
    });
  },

  setPanelError: (id, error) => {
    set((state) => {
      const current = state.panelStates[id] || createDefaultPanelState();
      return {
        panelStates: {
          ...state.panelStates,
          [id]: { ...current, error, isStreaming: false },
        },
      };
    });
  },

  setGlobalSystemPrompt: (prompt) => set({ globalSystemPrompt: prompt }),
  setGlobalTemperature: (temp) => set({ globalTemperature: temp }),
  setGlobalMaxTokens: (tokens) => set({ globalMaxTokens: tokens }),
  setIsComparing: (comparing) => set({ isComparing: comparing }),

  addUserMessage: (content) => {
    set((state) => ({
      messages: [...state.messages, { role: 'user', content }],
    }));
  },

  clearMessages: () => set({ messages: [], panelStates: {} }),

  resetPanelStates: () => {
    const { panels } = get();
    const newStates: Record<string, ArenaPanelState> = {};
    panels.forEach((p) => {
      newStates[p.id] = createDefaultPanelState();
    });
    set({ panelStates: newStates });
  },
}));
