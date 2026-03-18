'use client';

import { useCallback, useMemo, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Trash2, Undo2, Redo2, Maximize2, ZoomOut, ZoomIn } from 'lucide-react';
import { nodeTypeToColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { useAuthStore } from '@/store/auth';
import { useBlueprintStore } from '@/store/blueprint';
import { ForgeNode } from './forge-node';
import { ForgeEdge } from './forge-edge';
import { CanvasSuggestions } from './canvas-suggestions';
import { NodeSearchModal, useNodeSearchModal } from './node-search-modal';
import { AIChatbot } from './ai-chatbot';
import { getPluginIds } from '@cradle/plugin-config';
import { useSessionMonitor, useAuthState } from '@/hooks/useSessionMonitor';
import { AuthStatusBadge } from '@/components/auth/auth-guard';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  BlueprintNode as BPNode,
  BlueprintEdge as BPEdge,
  Blueprint,
} from '@dapp-forge/blueprint-schema';
import { BlueprintTemplatesModal } from '@/components/templates/blueprint-templates-modal';
import { TEMPLATES } from '@/data/templates';

// Dynamically build node types from plugin registry
const nodeTypes: NodeTypes = getPluginIds().reduce(
  (acc, pluginId) => {
    acc[pluginId] = ForgeNode;
    return acc;
  },
  {
    // Keep legacy AI-generated stylus-contract nodes styled with ForgeNode
    'stylus-contract': ForgeNode,
  } as NodeTypes
);

// Custom edge types
const edgeTypes: EdgeTypes = {
  default: ForgeEdge,
};

function BlueprintCanvasInner() {
  const {
    blueprint,
    addNode,
    addEdge: storeAddEdge,
    selectNode,
    updateNode,
    removeEdge,
    removeNode,
    selectedNodeId,
    undo,
    redo,
    canUndo,
    canRedo,
    ghostNodes,
    ghostEdges,
    activateGhostNode,
    clearAllNodes,
  } = useBlueprintStore();
  const { isConnected, address } = useAccount();
  const {
    isWalletConnected,
    isFullyAuthenticated,
    showAuthModal,
    openAuthModal,
    closeAuthModal,
    walletError,
    githubError,
    getConnectionState,
  } = useAuthStore();

  // Use session monitor for automatic session handling
  const { checkSession } = useSessionMonitor({
    showModalOnExpiry: true,
    onWalletDisconnect: () => {
      console.log('Wallet disconnected');
    },
    onGitHubExpiry: () => {
      console.log('GitHub session expired');
    },
    onAccountChange: (newAddress, oldAddress) => {
      console.log(`Account changed from ${oldAddress} to ${newAddress}`);
    },
  });

  // Get comprehensive auth state
  const authState = useAuthState();
  const connectionState = getConnectionState();

  // Node search modal
  const { isOpen: showNodeSearch, close: closeNodeSearch } = useNodeSearchModal();

  // Templates modal state
  const [showTemplates, setShowTemplates] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Zoom controls
  const { fitView, zoomIn, zoomOut, screenToFlowPosition } = useReactFlow();
  const { zoom } = useViewport();
  const zoomPercentage = Math.round(zoom * 100);

  // Convert blueprint nodes to ReactFlow nodes (including ghost nodes)
  const blueprintNodes: Node[] = useMemo(() => {
    const real = blueprint.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      selected: node.id === selectedNodeId,
      data: {
        ...node.config,
        ...(node as any).data,
        nodeType: node.type,
        label: node.config.label || node.config.contractName || node.config.agentName || node.type,
        isGhost: false,
      },
    }));
    const ghosts = ghostNodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      selected: false,
      draggable: false,
      selectable: false,
      data: {
        ...node.config,
        ...(node as any).data,
        nodeType: node.type,
        label: node.config.label || node.config.contractName || node.config.agentName || node.type,
        isGhost: true,
      },
    }));
    return [...real, ...ghosts];
  }, [blueprint.nodes, ghostNodes, selectedNodeId]);

  // Convert blueprint edges to ReactFlow edges (including ghost edges)
  const blueprintEdges: Edge[] = useMemo(() => {
    const real = blueprint.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'default',
      animated: true,
      data: { isGhost: false },
    }));
    const ghosts = ghostEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'default',
      animated: false,
      data: { isGhost: true },
    }));
    return [...real, ...ghosts];
  }, [blueprint.edges, ghostEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(blueprintNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(blueprintEdges);

  // Sync blueprint store changes to local ReactFlow state
  useEffect(() => {
    setNodes(blueprintNodes);
  }, [blueprintNodes, setNodes]);

  useEffect(() => {
    setEdges(blueprintEdges);
  }, [blueprintEdges, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        // Redundant setEdges removed as store update triggers effect
        storeAddEdge(connection.source, connection.target);
      }
    },
    [storeAddEdge]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      // Check wallet connection - use isConnected from wagmi for real-time status
      const walletConnected = isConnected || isWalletConnected;
      if (!walletConnected) {
        openAuthModal();
        return;
      }

      // Check GitHub authentication
      if (!isFullyAuthenticated) {
        openAuthModal();
        return;
      }

      // Use screenToFlowPosition for accurate drop location
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Redundant setNodes removed as store update triggers effect
      addNode(type, position);
    },
    [addNode, isConnected, isWalletConnected, isFullyAuthenticated, openAuthModal, screenToFlowPosition]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // If this is a ghost node, activate it instead of selecting
      if (node.data?.isGhost) {
        activateGhostNode(node.id);
        return;
      }
      const walletConnected = isConnected || isWalletConnected;
      if (!walletConnected) {
        openAuthModal(() => selectNode(node.id));
        return;
      }
      selectNode(node.id);
    },
    [isConnected, isWalletConnected, openAuthModal, selectNode, activateGhostNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateNode(node.id, { position: node.position });
    },
    [updateNode]
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      deletedEdges.forEach(edge => {
        removeEdge(edge.id);
      });
    },
    [removeEdge]
  );

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      deletedNodes.forEach(node => {
        removeNode(node.id);
      });
      // Close config panel if deleted node was selected
      if (deletedNodes.some(n => n.id === selectedNodeId)) {
        selectNode(null);
      }
    },
    [removeNode, selectedNodeId, selectNode]
  );

  // State for delete all confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Delete all nodes handler
  const handleDeleteAll = useCallback(() => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
      return;
    }

    // Actually delete all nodes and ghosts
    clearAllNodes();
    setShowDeleteConfirm(false);
    setShowOnboarding(false);
  }, [showDeleteConfirm, clearAllNodes]);

  // Show auth error notification
  const hasAuthError = walletError || githubError;
  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z = Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div data-tour="canvas" className="relative h-full w-full">
      {/* Canvas container with overflow hidden */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-forge-border/80 bg-[hsl(var(--color-bg-base))]">
        {/* Top bar with hint and actions */}
        <div className="absolute inset-x-0 top-3 z-20 flex items-center justify-between px-3">
          {/* Auth status badge */}
          <div className="flex items-center gap-1">
            <AuthStatusBadge className="min-w-[120px]" />
            {/* Left side - Undo/Redo buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-forge-bg/40 ring-1 ring-forge-border/40 backdrop-blur-md">
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                  canUndo
                    ? 'bg-forge-elevated text-forge-text ring-1 ring-forge-border-strong/50 shadow-sm hover:bg-forge-hover hover:text-white hover:ring-forge-border-strong active:scale-95 active:bg-forge-active'
                    : 'text-forge-text/80 cursor-not-allowed opacity-40'
                )}
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                  canRedo
                    ? 'bg-forge-elevated text-forge-text ring-1 ring-forge-border-strong/50 shadow-sm hover:bg-forge-hover hover:text-white hover:ring-forge-border-strong active:scale-95 active:bg-forge-active'
                    : 'text-forge-text/80 cursor-not-allowed opacity-40'
                )}
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Subtle canvas hint - centered */}
          <div className="pointer-events-none inline-flex items-center gap-2 rounded-full bg-forge-elevated/60 px-3 py-1 text-[11px] font-medium text-forge-text-secondary ring-1 ring-forge-border/40 backdrop-blur-md shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-primary animate-pulse-subtle" />
            <span>Drag to pan · Scroll to zoom · ? shortcuts</span>
          </div>

          {/* Right side controls: Delete All + Zoom Controls */}
          <div className="flex items-center gap-2">
            {/* Delete All button - only show when there are nodes */}
            {nodes.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium border transition-all duration-200 shadow-sm backdrop-blur-md',
                  showDeleteConfirm
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                    : 'bg-forge-elevated text-forge-text border-forge-border-strong/50 hover:bg-forge-hover hover:text-white hover:border-forge-border-strong active:scale-95'
                )}
              >
                <Trash2 className="h-3 w-3" />
                <span>{showDeleteConfirm ? 'Click to confirm' : 'Delete All'}</span>
                {showDeleteConfirm && (
                  <span className="ml-1 text-[9px] text-red-400/70">({blueprint.nodes.length})</span>
                )}
              </button>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 rounded-lg bg-forge-bg/60 p-1 ring-1 ring-forge-border/40 backdrop-blur-md shadow-sm">
              <button
                onClick={() => zoomOut()}
                className="p-1.5 rounded-md hover:bg-forge-hover text-forge-text-secondary hover:text-white transition-all active:scale-90"
                title="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[11px] font-mono text-forge-text min-w-[40px] text-center font-medium">
                {zoomPercentage}%
              </span>
              <button
                onClick={() => zoomIn()}
                className="p-1.5 rounded-md hover:bg-forge-hover text-forge-text-secondary hover:text-white transition-all active:scale-90"
                title="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <div className="w-px h-4 bg-forge-border-strong/40 mx-0.5" />
              <button
                onClick={() => fitView({ padding: 0.2 })}
                className="p-1.5 rounded-md hover:bg-forge-hover text-forge-text-secondary hover:text-white transition-all active:scale-90"
                title="Fit to view"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeDragStop={onNodeDragStop}
          onEdgesDelete={onEdgesDelete}
          onNodesDelete={onNodesDelete}
          deleteKeyCode={['Delete', 'Backspace']}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          proOptions={{ hideAttribution: true }}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          defaultEdgeOptions={{
            animated: true,
            style: { strokeWidth: 2 },
          }}
          className="z-10 rounded-2xl bg-transparent backdrop-blur-sm"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={30}
            size={2}
            color="rgba(255,255,255, 0.15)"
          />
          {/* Minimap - positioned to left-bottom */}
          <MiniMap
            position="bottom-left"
            pannable
            zoomable
            nodeColor={(node) => {
              const color = nodeTypeToColor(node.type || '');
              const colorMap: Record<string, string> = {
                'node-contracts': '#00d4ff',
                'node-payments': '#ffaa00',
                'node-agents': '#ff00ff',
                'node-app': '#00ff88',
                'node-quality': '#ff6b6b',
                'node-telegram': '#0088cc',
                'node-intelligence': '#a855f7',
                'accent-cyan': '#00d4ff',
                'accent-purple': '#8b5cf6',
              };
              return colorMap[color] || '#666';
            }}
            maskColor="rgba(0, 0, 0, 0.85)"
            className="!bg-forge-surface/90 !border-forge-border !rounded-xl !shadow-sm cursor-pointer"
            style={{ left: 12, right: 'auto' }}
          />
        </ReactFlow>

        {/* Empty state */}
        {nodes.length === 0 && showOnboarding && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="max-w-lg text-center"
            >
              {/* Animated logo/icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="relative mx-auto mb-8 w-32 h-32"
              >
                {/* Outer rotating ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-accent-cyan/30"
                />
                {/* Middle counter-rotating ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-3 rounded-full border-2 border-dashed border-accent-purple/20"
                />
                {/* Static inner ring */}
                <div className="absolute inset-6 rounded-full border border-forge-border/40" />

                {/* Center icon with pulse */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 border border-accent-cyan/40 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-accent-cyan/10">
                    {/* Sparkles icon */}
                    <svg
                      className="w-8 h-8 text-accent-cyan"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  </div>
                </motion.div>
              </motion.div>

              {/* Text content */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="mb-3 text-2xl font-bold text-white">
                  Start Building Your Project
                </h3>
                <p className="text-sm text-forge-muted mb-8 max-w-md mx-auto leading-relaxed">
                  Choose from {TEMPLATES.length} ready-to-use templates or start from scratch by dragging components from the palette
                </p>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 pointer-events-auto"
              >
                {/* Primary CTA: Use Templates */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowTemplates(true);
                  }}
                  className="group relative px-6 py-3 rounded-xl font-semibold text-sm overflow-hidden transition-all duration-300 shadow-lg shadow-accent-cyan/20 hover:shadow-accent-cyan/30"
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan to-accent-cyan/80 group-hover:from-accent-cyan/90 group-hover:to-accent-cyan transition-all duration-300" />

                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />

                  <span className="relative z-10 flex items-center gap-2 text-black">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
                    </svg>
                    Use Templates
                  </span>
                </motion.button>

                {/* Secondary CTA: Start from Scratch */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    clearAllNodes();
                    setShowOnboarding(false);
                  }}
                  className="group px-6 py-3 rounded-xl font-semibold text-sm bg-forge-elevated/80 text-white border border-forge-border/50 hover:bg-forge-elevated hover:border-accent-purple/50 transition-all duration-300 shadow-md hover:shadow-lg backdrop-blur-sm"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Start from Scratch
                  </span>
                </motion.button>
              </motion.div>

              {/* Quick hints */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex items-center justify-center gap-4 text-xs text-forge-muted mb-6"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forge-elevated/30 border border-forge-border/30 backdrop-blur-sm">
                  <span className="text-accent-cyan font-semibold">←</span>
                  <span>Drag from palette</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forge-elevated/30 border border-forge-border/30 backdrop-blur-sm">
                  <kbd className="px-1.5 py-0.5 text-[10px] bg-forge-bg rounded font-mono border border-forge-border/40">Cmd+K</kbd>
                  <span>Quick search</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forge-elevated/30 border border-forge-border/30 backdrop-blur-sm">
                  <kbd className="px-1.5 py-0.5 text-[10px] bg-forge-bg rounded font-mono border border-forge-border/40">?</kbd>
                  <span>Shortcuts</span>
                </div>
              </motion.div>

              {/* Auth hint */}
              {!isFullyAuthenticated && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1 }}
                  onClick={() => openAuthModal()}
                  className="text-xs text-accent-cyan hover:text-accent-cyan/80 hover:underline pointer-events-auto transition-colors inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {connectionState === 'none_connected'
                    ? 'Connect wallet & GitHub to get started'
                    : connectionState === 'wallet_only'
                      ? 'Connect GitHub to unlock all features'
                      : 'Connect wallet to get started'
                  }
                </motion.button>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Canvas-based suggestions - rendered OUTSIDE overflow-hidden container */}
      <CanvasSuggestions />

      {/* AI Chatbot - Right bottom corner with genie animation */}
      <AIChatbot
        onApplyWorkflow={(blueprintNodes: BPNode[], blueprintEdges: BPEdge[]) => {
          // Get current state and update the blueprint directly
          const currentState = useBlueprintStore.getState();

          // Replace blueprint with new nodes and edges
          useBlueprintStore.setState({
            ...currentState,
            blueprint: {
              ...currentState.blueprint,
              nodes: blueprintNodes as Blueprint['nodes'],
              edges: blueprintEdges as Blueprint['edges'],
              updatedAt: new Date().toISOString(),
            },
            // Also clear any ghosts
            ghostNodes: [],
            ghostEdges: [],
          });
          setShowOnboarding(false);
        }}
      />

      {/* Node Search Modal (Cmd+K) */}
      <NodeSearchModal open={showNodeSearch} onClose={closeNodeSearch} />

      {/* Templates Modal */}
      <BlueprintTemplatesModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
      />
    </div>
  );
}

// Wrap with ReactFlowProvider so suggestions can access viewport hooks
export function BlueprintCanvas() {
  // Avoid hydration mismatches by only rendering on the client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <ReactFlowProvider>
      <BlueprintCanvasInner />
    </ReactFlowProvider>
  );
}
