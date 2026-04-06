import { create } from 'zustand';
import type {
  Blueprint,
  BlueprintNode,
  BlueprintEdge,
  BlueprintConfig,
} from '@dapp-forge/blueprint-schema';
import { getDefaultConfig } from '@cradle/plugin-config';

// Decorated type for UI-only enhancements in the store
type DecoratedBlueprintNode = BlueprintNode & { data?: Record<string, any> };

// Generate proper UUIDs for blueprint schema validation
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Maximum history stack size
const MAX_HISTORY_SIZE = 50;

interface HistoryEntry {
  blueprint: Blueprint;
  timestamp: number;
}

interface BlueprintState {
  blueprint: Blueprint;
  selectedNodeId: string | null;

  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  // Ghost nodes/edges — UI-only suggested blocks shown on template load
  ghostNodes: DecoratedBlueprintNode[];
  ghostEdges: BlueprintEdge[];

  // Node operations
  addNode: (type: string, position: { x: number; y: number }, config?: Record<string, any>) => BlueprintNode;
  updateNode: (nodeId: string, updates: Partial<BlueprintNode>) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  removeNode: (nodeId: string) => void;

  // Edge operations
  addEdge: (source: string, target: string) => BlueprintEdge | null;
  removeEdge: (edgeId: string) => void;

  // Ghost operations
  addGhostNode: (type: string, position: { x: number; y: number }, data?: Record<string, unknown>) => DecoratedBlueprintNode;
  addGhostEdge: (source: string, target: string) => BlueprintEdge | null;
  updateGhostNode: (nodeId: string, updates: Partial<DecoratedBlueprintNode>) => void;
  activateGhostNode: (ghostNodeId: string) => void;
  dismissGhostNode: (ghostNodeId: string) => void;
  clearGhostNodes: () => void;
  clearGhostSuggestions: () => void;

  // Selection
  selectNode: (nodeId: string | null) => void;

  // Blueprint operations
  updateConfig: (config: Partial<BlueprintConfig>) => void;
  exportBlueprint: () => string;
  importBlueprint: (json: string) => void;
  resetBlueprint: () => void;
  clearAllNodes: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;

  // Internal helper
  _saveToHistory: () => void;
}

const createInitialBlueprint = (): Blueprint => ({
  id: generateUUID(),
  version: '1.0.0',
  nodes: [],
  edges: [],
  config: {
    project: {
      name: 'My App',
      description: '',
      version: '0.1.0',
      license: 'MIT',
      keywords: [],
    },
    network: {
      chainId: 421614,
      name: 'Arbitrum Sepolia',
      rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
      explorerUrl: 'https://sepolia.arbiscan.io',
      isTestnet: true,
    },
    generateDocs: true,
    deployOnGenerate: false,
  },
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Helper to deep clone blueprint
const cloneBlueprint = (bp: Blueprint): Blueprint => JSON.parse(JSON.stringify(bp));

export const useBlueprintStore = create<BlueprintState>((set, get) => ({
  blueprint: createInitialBlueprint(),
  selectedNodeId: null,
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  ghostNodes: [],
  ghostEdges: [],

  // Helper to save state to history (called before mutations)
  _saveToHistory: () => {
    const { blueprint, history, historyIndex } = get();

    // Slice off any redo history (we're branching)
    const newHistory = history.slice(0, historyIndex + 1);

    // Add current state
    newHistory.push({
      blueprint: cloneBlueprint(blueprint),
      timestamp: Date.now(),
    });

    // Limit history size
    while (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: newHistory.length > 0,
      canRedo: false,
    });
  },

  addNode: (type, position, config) => {
    // Save current state before mutation
    get()._saveToHistory();

    const node: BlueprintNode = {
      id: generateUUID(),
      type: type as BlueprintNode['type'],
      position,
      // Merge template config with defaults, with template config taking precedence
      config: config ? { ...getDefaultConfig(type), ...config } : getDefaultConfig(type),
    };

    set((state) => ({
      blueprint: {
        ...state.blueprint,
        nodes: [...state.blueprint.nodes, node],
        updatedAt: new Date().toISOString(),
      },
      canUndo: true,
    }));

    return node;
  },

  updateNode: (nodeId, updates) => {
    get()._saveToHistory();

    set((state) => ({
      blueprint: {
        ...state.blueprint,
        nodes: state.blueprint.nodes.map((node) =>
          node.id === nodeId ? { ...node, ...updates } : node
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  updateNodeConfig: (nodeId, config) => {
    get()._saveToHistory();

    set((state) => ({
      blueprint: {
        ...state.blueprint,
        nodes: state.blueprint.nodes.map((node) =>
          node.id === nodeId
            ? { ...node, config: { ...node.config, ...config } }
            : node
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  removeNode: (nodeId) => {
    get()._saveToHistory();

    set((state) => ({
      blueprint: {
        ...state.blueprint,
        nodes: state.blueprint.nodes.filter((n) => n.id !== nodeId),
        edges: state.blueprint.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        ),
        updatedAt: new Date().toISOString(),
      },
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
  },

  addEdge: (source, target) => {
    // Check if edge already exists
    const { blueprint } = get();
    const exists = blueprint.edges.some(
      (e) => e.source === source && e.target === target
    );
    if (exists) return null;

    // Check for self-loop
    if (source === target) return null;

    get()._saveToHistory();

    const edge: BlueprintEdge = {
      id: generateUUID(),
      source,
      target,
      type: 'dependency',
    };

    set((state) => ({
      blueprint: {
        ...state.blueprint,
        edges: [...state.blueprint.edges, edge],
        updatedAt: new Date().toISOString(),
      },
    }));

    return edge;
  },

  removeEdge: (edgeId) => {
    get()._saveToHistory();

    set((state) => ({
      blueprint: {
        ...state.blueprint,
        edges: state.blueprint.edges.filter((e) => e.id !== edgeId),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  // ── Ghost operations ──────────────────────────────────────────────────
  addGhostNode: (type, position, data = {}) => {
    const defaultConfig = getDefaultConfig(type);
    const node: DecoratedBlueprintNode = {
      id: generateUUID(),
      type: type as BlueprintNode['type'],
      position,
      config: { ...defaultConfig, ...(data?.config || {}) },
      data: { ...data },
    };
    set((state) => ({ ghostNodes: [...state.ghostNodes, node] }));
    return node;
  },

  updateGhostNode: (nodeId, updates) => {
    set((state) => ({
      ghostNodes: state.ghostNodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    }));
  },

  addGhostEdge: (source, target) => {
    if (source === target) return null;
    const { ghostEdges } = get();
    const exists = ghostEdges.some((e) => e.source === source && e.target === target);
    if (exists) return null;

    const edge: BlueprintEdge = {
      id: generateUUID(),
      source,
      target,
      type: 'dependency',
    };
    set((state) => ({ ghostEdges: [...state.ghostEdges, edge] }));
    return edge;
  },

  activateGhostNode: (ghostNodeId) => {
    get()._saveToHistory();

    set((state) => {
      const ghostNode = state.ghostNodes.find((n) => n.id === ghostNodeId);
      if (!ghostNode) return state;

      const realNodeIds = new Set(state.blueprint.nodes.map((n) => n.id));
      realNodeIds.add(ghostNodeId);

      const edgesToPromote: BlueprintEdge[] = [];
      const remainingGhostEdges: BlueprintEdge[] = [];

      for (const ge of state.ghostEdges) {
        if (realNodeIds.has(ge.source) && realNodeIds.has(ge.target)) {
          edgesToPromote.push(ge);
        } else {
          remainingGhostEdges.push(ge);
        }
      }

      // Strip UI-only ghost data when promoting to real node
      const { data, ...nodeRest } = ghostNode;

      return {
        blueprint: {
          ...state.blueprint,
          nodes: [...state.blueprint.nodes, nodeRest as BlueprintNode],
          edges: [...state.blueprint.edges, ...edgesToPromote],
          updatedAt: new Date().toISOString(),
        },
        ghostNodes: state.ghostNodes.filter((n) => n.id !== ghostNodeId),
        ghostEdges: remainingGhostEdges,
      };
    });
  },

  dismissGhostNode: (ghostNodeId) => {
    set((state) => ({
      ghostNodes: state.ghostNodes.filter((n) => n.id !== ghostNodeId),
      ghostEdges: state.ghostEdges.filter(
        (e) => e.source !== ghostNodeId && e.target !== ghostNodeId,
      ),
    }));
  },

  clearGhostNodes: () => {
    set({ ghostNodes: [], ghostEdges: [] });
  },

  clearGhostSuggestions: () => {
    set((state) => {
      const suggestionNodeIds = new Set(
        state.ghostNodes
          .filter((n: DecoratedBlueprintNode) => n.data?.isSuggestion)
          .map(n => n.id)
      );

      return {
        ghostNodes: state.ghostNodes.filter(n => !suggestionNodeIds.has(n.id)),
        ghostEdges: state.ghostEdges.filter(
          e => !suggestionNodeIds.has(e.source) && !suggestionNodeIds.has(e.target)
        ),
      };
    });
  },

  selectNode: (nodeId) => {
    // Don't save to history for selection changes
    set({ selectedNodeId: nodeId });
  },

  updateConfig: (config) => {
    (get() as any)._saveToHistory();

    set((state) => ({
      blueprint: {
        ...state.blueprint,
        config: {
          ...state.blueprint.config,
          ...config,
          project: {
            ...state.blueprint.config.project,
            ...(config.project || {}),
          },
          network: {
            ...state.blueprint.config.network,
            ...(config.network || {}),
          },
        },
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  exportBlueprint: () => {
    return JSON.stringify(get().blueprint, null, 2);
  },

  importBlueprint: (json) => {
    try {
      get()._saveToHistory();

      const imported = JSON.parse(json);
      set({
        blueprint: {
          ...imported,
          id: imported.id || generateUUID(),
          updatedAt: new Date().toISOString(),
        },
        selectedNodeId: null,
      });
    } catch (error) {
      throw new Error('Invalid blueprint JSON');
    }
  },

  resetBlueprint: () => {
    get()._saveToHistory();

    set({
      blueprint: createInitialBlueprint(),
      selectedNodeId: null,
      ghostNodes: [],
      ghostEdges: [],
    });
  },

  clearAllNodes: () => {
    get()._saveToHistory();

    set((state) => ({
      blueprint: {
        ...state.blueprint,
        nodes: [],
        edges: [],
        updatedAt: new Date().toISOString(),
      },
      selectedNodeId: null,
      ghostNodes: [],
      ghostEdges: [],
    }));
  },

  undo: () => {
    const { history, historyIndex, blueprint } = get();

    if (historyIndex < 0) return;

    // If at the end of history, save current state for potential redo
    if (historyIndex === history.length - 1) {
      const newHistory = [...history, {
        blueprint: cloneBlueprint(blueprint),
        timestamp: Date.now(),
      }];

      set({
        blueprint: cloneBlueprint(history[historyIndex].blueprint),
        history: newHistory,
        historyIndex: historyIndex - 1,
        canUndo: historyIndex - 1 >= 0,
        canRedo: true,
      });
    } else {
      set({
        blueprint: cloneBlueprint(history[historyIndex].blueprint),
        historyIndex: historyIndex - 1,
        canUndo: historyIndex - 1 >= 0,
        canRedo: true,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();

    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;

    set({
      blueprint: cloneBlueprint(history[newIndex].blueprint),
      historyIndex: newIndex,
      canUndo: true,
      canRedo: newIndex < history.length - 1,
    });
  },
}));


