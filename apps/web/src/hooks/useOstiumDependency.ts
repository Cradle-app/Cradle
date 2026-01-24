'use client';

import { useBlueprintStore } from '@/store/blueprint';

/**
 * Hook to check for ostium-trading dependency and add it to canvas if missing
 */
export function useOstiumDependency(nodeId: string) {
    const { blueprint, addNode, addEdge, selectNode } = useBlueprintStore();

    const ostiumTradingNode = blueprint.nodes.find((n) => n.type === 'ostium-trading');
    const hasOstiumTrading = !!ostiumTradingNode;

    const addOstiumTradingBlock = () => {
        const currentNode = blueprint.nodes.find((n) => n.id === nodeId);
        const position = {
            x: (currentNode?.position.x || 100) + 300,
            y: currentNode?.position.y || 100,
        };

        const newNode = addNode('ostium-trading', position);
        addEdge(nodeId, newNode.id);
        selectNode(newNode.id);

        return newNode;
    };

    return {
        hasOstiumTrading,
        ostiumTradingNode,
        addOstiumTradingBlock,
    };
}
