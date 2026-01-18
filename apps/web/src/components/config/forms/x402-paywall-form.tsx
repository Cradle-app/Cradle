'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatWei } from '@/lib/utils';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const CURRENCIES = [
  { value: 'ETH', label: 'ETH' },
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
  { value: 'DAI', label: 'DAI' },
  { value: 'CUSTOM', label: 'Custom Token' },
];

export function X402PaywallForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Resource Path */}
      <Input
        label="Resource Path"
        value={(config.resourcePath as string) || ''}
        onChange={(e) => handleChange('resourcePath', e.target.value)}
        placeholder="/api/premium/resource"
      />

      {/* Currency */}
      <div>
        <Select
          value={(config.currency as string) || 'ETH'}
          onValueChange={(value) => handleChange('currency', value)}
        >
          <SelectTrigger label="Currency">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((currency) => (
              <SelectItem key={currency.value} value={currency.value}>
                {currency.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Token Address */}
      {config.currency === 'CUSTOM' && (
        <Input
          label="Token Address"
          value={(config.customTokenAddress as string) || ''}
          onChange={(e) => handleChange('customTokenAddress', e.target.value)}
          placeholder="0x..."
        />
      )}

      {/* Price */}
      <div>
        <Input
          label="Price (wei)"
          value={(config.priceInWei as string) || ''}
          onChange={(e) => handleChange('priceInWei', e.target.value)}
          placeholder="1000000000000000"
        />
        {Boolean(config.priceInWei) && (
          <p className="text-xs text-forge-muted mt-1">
            ≈ {formatWei(config.priceInWei as string)}
          </p>
        )}
      </div>

      {/* Payment Timeout */}
      <div>
        <Input
          label="Payment Timeout (seconds)"
          type="number"
          value={(config.paymentTimeout as number) || 300}
          onChange={(e) => handleChange('paymentTimeout', parseInt(e.target.value))}
          placeholder="300"
        />
      </div>

      {/* Options */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
          <div>
            <p className="text-sm font-medium text-white">Receipt Validation</p>
            <p className="text-xs text-forge-muted">Verify payments on-chain</p>
          </div>
          <Switch
            checked={(config.receiptValidation as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('receiptValidation', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
          <div>
            <p className="text-sm font-medium text-white">OpenAPI Spec</p>
            <p className="text-xs text-forge-muted">Generate API documentation</p>
          </div>
          <Switch
            checked={(config.openApiSpec as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('openApiSpec', checked)}
          />
        </div>
      </div>

      {/* Webhook URL */}
      <Input
        label="Webhook URL (optional)"
        value={(config.webhookUrl as string) || ''}
        onChange={(e) => handleChange('webhookUrl', e.target.value)}
        placeholder="https://your-app.com/webhook"
      />
    </div>
  );
}

