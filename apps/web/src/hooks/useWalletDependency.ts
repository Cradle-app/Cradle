'use client';

import { useBlueprintStore } from '@/store/blueprint';

/**
 * Hook to check for wallet-auth dependency and add it to canvas if missing
 */
export function useWalletDependency(nodeId: string) {
    const { blueprint, addNode, addEdge, selectNode } = useBlueprintStore();

    const walletAuthNode = blueprint.nodes.find((n) => n.type === 'wallet-auth');
    const hasWalletAuth = !!walletAuthNode;

    const addWalletAuthBlock = () => {
        const currentNode = blueprint.nodes.find((n) => n.id === nodeId);
        const position = {
            x: (currentNode?.position.x || 100) - 300,
            y: currentNode?.position.y || 100,
        };

        const newNode = addNode('wallet-auth', position);
        addEdge(newNode.id, nodeId);
        selectNode(newNode.id);

        return newNode;
    };

    return {
        hasWalletAuth,
        walletAuthNode,
        addWalletAuthBlock,
    };
}
