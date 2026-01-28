'use client';

import { useState, useEffect } from 'react';
import { Check, Info } from 'lucide-react';
import { ERC20InteractionPanel } from '@/components/contract-interactions/ERC20InteractionPanel';
import { useBlueprintStore } from '@/store/blueprint';
import { getAvailableFunctions } from '@/lib/contract-instructions-generator';
import { cn } from '@/lib/utils';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

// All available ERC20 functions
const ALL_FUNCTIONS = ['mint', 'mint_to', 'burn'];

export function ERC20StylusForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  // Get config values
  const contractAddress = config.contractAddress as string | undefined;
  const network = (config.network as 'arbitrum' | 'arbitrum-sepolia' | 'superposition' | 'superposition-testnet') || 'arbitrum-sepolia';
  const selectedFunctions = (config.selectedFunctions as string[]) || ALL_FUNCTIONS;

  // Local state for function selection
  const [localSelectedFunctions, setLocalSelectedFunctions] = useState<string[]>(selectedFunctions);

  // Get function metadata
  const functionMeta = getAvailableFunctions('erc20-stylus');

  // Sync local state with config when it changes
  useEffect(() => {
    setLocalSelectedFunctions(selectedFunctions);
  }, [selectedFunctions]);

  // Toggle function selection
  const toggleFunction = (funcName: string) => {
    const newSelection = localSelectedFunctions.includes(funcName)
      ? localSelectedFunctions.filter(f => f !== funcName)
      : [...localSelectedFunctions, funcName];

    setLocalSelectedFunctions(newSelection);
    updateNodeConfig(nodeId, {
      ...config,
      selectedFunctions: newSelection,
    });
  };

  // Select/deselect all
  const selectAll = () => {
    setLocalSelectedFunctions(ALL_FUNCTIONS);
    updateNodeConfig(nodeId, {
      ...config,
      selectedFunctions: ALL_FUNCTIONS,
    });
  };

  const deselectAll = () => {
    setLocalSelectedFunctions([]);
    updateNodeConfig(nodeId, {
      ...config,
      selectedFunctions: [],
    });
  };

  return (
    <div className="space-y-4 -mx-4 -mt-2">
      {/* Function Selection Section */}
      <div className="px-4 py-3 bg-forge-bg/50 border-b border-forge-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-medium text-white">Contract Functions</h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
              {localSelectedFunctions.length}/{ALL_FUNCTIONS.length} selected
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={selectAll}
              className="text-[10px] px-2 py-1 rounded bg-forge-border/50 hover:bg-forge-border text-forge-muted hover:text-white transition-colors"
            >
              All
            </button>
            <button
              onClick={deselectAll}
              className="text-[10px] px-2 py-1 rounded bg-forge-border/50 hover:bg-forge-border text-forge-muted hover:text-white transition-colors"
            >
              None
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {functionMeta.map((func) => {
            const isSelected = localSelectedFunctions.includes(func.name);
            return (
              <div
                key={func.name}
                onClick={() => toggleFunction(func.name)}
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all",
                  isSelected
                    ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15"
                    : "bg-forge-bg/30 border-forge-border/30 hover:bg-forge-bg/50 opacity-60"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                  isSelected
                    ? "bg-emerald-500 text-white"
                    : "bg-forge-border/50 text-transparent"
                )}>
                  <Check className="w-3 h-3" strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className={cn(
                      "text-xs font-mono",
                      isSelected ? "text-emerald-400" : "text-forge-muted"
                    )}>
                      {func.name}
                    </code>
                  </div>
                  <p className="text-[10px] text-forge-muted mt-0.5 line-clamp-1">
                    {func.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info about markdown generation */}
        <div className="mt-3 flex items-start gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-blue-300">
            Function selections will generate a markdown file with instructions for your LLM to modify the contract code.
          </p>
        </div>
      </div>

      {/* Existing interaction panel */}
      <ERC20InteractionPanel
        contractAddress={contractAddress}
        network={network}
      />
    </div>
  );
}
