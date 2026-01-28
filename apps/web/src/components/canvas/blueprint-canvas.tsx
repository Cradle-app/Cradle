'use client';

import { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypeToColor } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { useAuthStore } from '@/store/auth';
import { useBlueprintStore } from '@/store/blueprint';
import { ForgeNode } from './forge-node';
import { ForgeEdge } from './forge-edge';

// Custom node types
const nodeTypes: NodeTypes = {
  // Contracts
  'stylus-contract': ForgeNode,
  'stylus-zk-contract': ForgeNode,
  'eip7702-smart-eoa': ForgeNode,
  'zk-primitives': ForgeNode,
  'stylus-rust-contract': ForgeNode,
  'smartcache-caching': ForgeNode,
  'auditware-analyzing': ForgeNode,
  // Payments
  'x402-paywall-api': ForgeNode,
  // Agents
  'erc8004-agent-runtime': ForgeNode,
  'ostium-trading': ForgeNode,
  'maxxit': ForgeNode,
  'onchain-activity': ForgeNode,
  // App
  'wallet-auth': ForgeNode,
  'rpc-provider': ForgeNode,
  'arbitrum-bridge': ForgeNode,
  'chain-data': ForgeNode,
  'ipfs-storage': ForgeNode,
  'chain-abstraction': ForgeNode,
  'erc20-stylus': ForgeNode,
  'erc721-stylus': ForgeNode,
  'erc1155-stylus': ForgeNode,
  'frontend-scaffold': ForgeNode,
  'sdk-generator': ForgeNode,
  // Telegram
  'telegram-notifications': ForgeNode,
  'telegram-commands': ForgeNode,
  'telegram-ai-agent': ForgeNode,
  'telegram-wallet-link': ForgeNode,
  // Quality
  'repo-quality-gates': ForgeNode,
  // Intelligence
  'aixbt-momentum': ForgeNode,
  'aixbt-signals': ForgeNode,
  'aixbt-indigo': ForgeNode,
  'aixbt-observer': ForgeNode,
  // Superposition L3
  'superposition-network': ForgeNode,
  'superposition-bridge': ForgeNode,
  'superposition-longtail': ForgeNode,
  'superposition-super-assets': ForgeNode,
  'superposition-thirdweb': ForgeNode,
  'superposition-utility-mining': ForgeNode,
  'superposition-faucet': ForgeNode,
  'superposition-meow-domains': ForgeNode,
  // Dune Analytics
  'dune-execute-sql': ForgeNode,
  'dune-token-price': ForgeNode,
  'dune-wallet-balances': ForgeNode,
  'dune-dex-volume': ForgeNode,
  'dune-nft-floor': ForgeNode,
  'dune-address-labels': ForgeNode,
  'dune-transaction-history': ForgeNode,
  'dune-gas-price': ForgeNode,
  'dune-protocol-tvl': ForgeNode,
};

// Custom edge types
const edgeTypes: EdgeTypes = {
  default: ForgeEdge,
};

export function BlueprintCanvas() {
  const {
    blueprint,
    addNode,
    addEdge: storeAddEdge,
    selectNode,
    updateNode,
    removeEdge,
  } = useBlueprintStore();
  const { isConnected } = useAccount();
  const { isWalletConnected, isFullyAuthenticated, showAuthModal, openAuthModal, closeAuthModal } = useAuthStore();

  // Convert blueprint nodes to ReactFlow nodes
  const blueprintNodes: Node[] = useMemo(() =>
    blueprint.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...node.config,
        nodeType: node.type,
        label: node.config.label || node.config.contractName || node.config.agentName || node.type,
      },
    })), [blueprint.nodes]);

  // Convert blueprint edges to ReactFlow edges
  const blueprintEdges: Edge[] = useMemo(() =>
    blueprint.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'default',
      animated: true,
    })), [blueprint.edges]);

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
        const newEdge = storeAddEdge(connection.source, connection.target);
        if (newEdge) {
          setEdges((eds) => addEdge({
            ...connection,
            id: newEdge.id,
            type: 'default',
            animated: true,
          }, eds));
        }
      }
    },
    [storeAddEdge, setEdges]
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

      // Double check wallet connection on drop - use isConnected from wagmi for real-time status
      const walletConnected = isConnected || isWalletConnected;
      if (!walletConnected) {
        openAuthModal();
        return;
      }

      const position = {
        x: event.clientX - 280, // Offset for sidebar
        y: event.clientY - 56,   // Offset for header
      };

      const newNode = addNode(type, position);

      if (newNode) {
        setNodes((nds) => [
          ...nds,
          {
            id: newNode.id,
            type: newNode.type,
            position: newNode.position,
            data: {
              ...newNode.config,
              nodeType: newNode.type,
              label: (newNode.config as Record<string, unknown>).contractName ||
                (newNode.config as Record<string, unknown>).agentName ||
                newNode.type,
            },
          },
        ]);
      }
    },
    [addNode, setNodes, isConnected, isWalletConnected, openAuthModal]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const walletConnected = isConnected || isWalletConnected;
      if (!walletConnected) {
        openAuthModal(() => selectNode(node.id));
        return;
      }
      selectNode(node.id);
    },
    [isConnected, isWalletConnected, openAuthModal, selectNode]
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

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-forge-border/60 bg-gradient-to-b from-black/70 via-black/80 to-black/95">
      {/* Subtle canvas hint */}
      <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-forge-muted ring-1 ring-white/5 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan/80" />
          <span>Drag to pan · Scroll to zoom · Drop nodes from the left</span>
        </div>
      </div>

      {/* Subtle grid / lighting */}
      {/* <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),transparent_55%),radial-gradient(circle_at_bottom,_rgba(147,51,234,0.10),transparent_55%)]" /> */}

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
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 2 },
        }}
        className="z-10 rounded-2xl bg-black/60 backdrop-blur-sm"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255,255,255, 0.15)"
        />
        <Controls className="!bg-forge-surface/95 !border-forge-border !rounded-xl !shadow-sm !text-forge-muted" />
        <MiniMap
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
          className="!bg-forge-surface/90 !border-forge-border !rounded-xl !shadow-sm"
        />
      </ReactFlow>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="max-w-xs text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-forge-border/60 bg-black/60">
              <svg
                className="h-6 w-6 text-forge-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="mb-1 text-sm font-semibold text-white">
              Drop your first component
            </h3>
            <p className="text-xs text-forge-muted">
              Drag a node from the left palette into the canvas to begin your blueprint.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
