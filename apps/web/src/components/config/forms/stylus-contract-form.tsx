'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Box, FileCode, ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const REFERENCE_LINKS = [
  { label: 'Stylus by Example', url: 'https://stylus-by-example.org/' },
  { label: 'Arbitrum Stylus Docs', url: 'https://docs.arbitrum.io/stylus/gentle-introduction' },
  { label: 'Arbitrum Discord', url: 'https://discord.com/channels/585084330037084172/1146789176939909251' },
  { label: 'Arbitrum Stylus Telegram', url: 'https://t.me/arbitrum_stylus' },
];

export function StylusContractForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  const contractInstructions = (config.contractInstructions as string) || '';
  const contractName = (config.contractName as string) || 'my-contract';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 rounded-lg border border-forge-border/50 bg-gradient-to-r from-accent-cyan/10 to-transparent">
        <Box className="w-5 h-5 text-accent-cyan" />
        <div>
          <h3 className="text-sm font-medium text-white">Stylus Contract</h3>
          <p className="text-[11px] text-forge-muted">
            Describe your contract logic. A markdown guide will be generated for LLM-assisted code generation.
          </p>
        </div>
      </div>

      {/* Contract Name */}
      <Input
        label="Project/Contract Name"
        value={contractName}
        onChange={(e) => handleChange('contractName', e.target.value)}
        placeholder="my-contract"
      />

      {/* Instruction Panel */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 flex items-center gap-1.5">
          <FileCode className="w-3.5 h-3.5" />
          Contract Logic Instructions
        </label>
        <textarea
          value={contractInstructions}
          onChange={(e) => handleChange('contractInstructions', e.target.value)}
          placeholder={`Describe how you want your Stylus Rust contract to work. For example:

- A vending machine that distributes tokens with a 5-second cooldown per user
- An ERC-20 token with minting, burning, and transfer capabilities
- A simple counter with increment, decrement, and set functions
- A voting contract where addresses can vote once per proposal

Be as specific as you like. This will be included in a markdown file that you can pass to any LLM (ChatGPT, Claude, etc.) to generate or modify your contract code.`}
          className={cn(
            'w-full min-h-[180px] px-3 py-2.5 text-sm bg-forge-bg border border-forge-border rounded-lg',
            'text-white placeholder:text-forge-muted focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent',
            'resize-y font-mono'
          )}
          rows={8}
        />
        <p className="text-[10px] text-forge-muted mt-1.5">
          A comprehensive markdown guide with deployment steps, error troubleshooting, and your instructions will be pushed to your GitHub.
        </p>
      </div>

      {/* What gets generated */}
      <div className="p-3 rounded-lg border border-accent-cyan/30 bg-accent-cyan/5">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="text-xs font-medium text-white">What gets generated</span>
        </div>
        <ul className="text-[10px] text-forge-muted space-y-1">
          <li>• <strong className="text-forge-text">contracts/counter-contract/</strong> – Full template (Cargo.toml, src/lib.rs, .cargo, etc.)</li>
          <li>• <strong className="text-forge-text">docs/STYLUS_CONTRACT_GUIDE.md</strong> – Your instructions + paste guide + troubleshooting</li>
          <li>• <strong className="text-forge-text">LLM workflow</strong> – Pass the markdown to any LLM, paste output into <code>counter-contract/src/lib.rs</code></li>
        </ul>
      </div>

      {/* Reference links */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">Reference Resources</label>
        <div className="flex flex-wrap gap-2">
          {REFERENCE_LINKS.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium',
                'bg-forge-elevated/50 border border-forge-border/50',
                'text-accent-cyan hover:bg-accent-cyan/10 hover:border-accent-cyan/30 transition-all'
              )}
            >
              {link.label}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
