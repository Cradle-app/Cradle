'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const CONTRACT_TYPES = [
  { value: 'erc721', label: 'ERC-721 NFT' },
  { value: 'erc20', label: 'ERC-20 Token' },
  { value: 'erc1155', label: 'ERC-1155 Multi-Token' },
];

const ZK_CIRCUIT_TYPES = [
  { value: 'balance-proof', label: 'Balance Proof' },
  { value: 'ownership-proof', label: 'Ownership Proof' },
  { value: 'custom', label: 'Custom Circuit' },
];

export function StylusZKContractForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Contract Name */}
      <Input
        label="Contract Name"
        value={(config.contractName as string) || ''}
        onChange={(e) => handleChange('contractName', e.target.value)}
        placeholder="MyZKToken"
      />

      {/* Contract Type */}
      <div>
        <Select
          value={(config.contractType as string) || 'erc721'}
          onValueChange={(value) => handleChange('contractType', value)}
        >
          <SelectTrigger label="Contract Type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {CONTRACT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ZK Circuit Type */}
      <div>
        <Select
          value={(config.zkCircuitType as string) || 'balance-proof'}
          onValueChange={(value) => handleChange('zkCircuitType', value)}
        >
          <SelectTrigger label="ZK Circuit Type">
            <SelectValue placeholder="Select circuit type" />
          </SelectTrigger>
          <SelectContent>
            {ZK_CIRCUIT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Min Balance (for balance-proof) */}
      {config.zkCircuitType === 'balance-proof' && (
        <Input
          label="Minimum Required Balance (wei)"
          value={(config.minBalance as string) || ''}
          onChange={(e) => handleChange('minBalance', e.target.value)}
          placeholder="1000000000000000000"
        />
      )}

      {/* Options */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
          <div>
            <p className="text-sm font-medium text-white">Oracle Enabled</p>
            <p className="text-xs text-forge-muted">Balance verification service</p>
          </div>
          <Switch
            checked={(config.oracleEnabled as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('oracleEnabled', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
          <div>
            <p className="text-sm font-medium text-white">Nullifier System</p>
            <p className="text-xs text-forge-muted">Prevent replay attacks</p>
          </div>
          <Switch
            checked={(config.nullifierEnabled as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('nullifierEnabled', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
          <div>
            <p className="text-sm font-medium text-white">Test Coverage</p>
            <p className="text-xs text-forge-muted">Generate test files</p>
          </div>
          <Switch
            checked={(config.testCoverage as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('testCoverage', checked)}
          />
        </div>
      </div>

      {/* Custom Circuit Code */}
      {config.zkCircuitType === 'custom' && (
        <div>
          <label className="text-sm font-medium text-white mb-1.5 block">
            Custom Circuit Code
          </label>
          <textarea
            value={(config.circuitCustomization as string) || ''}
            onChange={(e) => handleChange('circuitCustomization', e.target.value)}
            placeholder="// Add your custom Circom circuit logic here..."
            className="w-full h-40 px-3 py-2 text-sm bg-forge-bg border border-forge-border rounded-lg text-white placeholder:text-forge-muted focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent font-mono resize-none"
          />
        </div>
      )}
    </div>
  );
}

