'use client';

import { ERC1155InteractionPanel } from '@/components/contract-interactions/ERC1155InteractionPanel';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function ERC1155StylusForm({ nodeId, config }: Props) {
  // Get config values - only pass if explicitly set, otherwise let panel use defaults
  const contractAddress = config.contractAddress as string | undefined;
  const network = (config.network as 'arbitrum' | 'arbitrum-sepolia') || 'arbitrum-sepolia';

  return (
    <div className="space-y-4 -mx-4 -mt-2">
      <ERC1155InteractionPanel
        contractAddress={contractAddress}
        network={network}
      />
    </div>
  );
}
