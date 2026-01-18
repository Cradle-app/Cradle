import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { ArbitrumBridgeConfig } from '@dapp-forge/blueprint-schema';
import {
  generateBridgeUtils,
  generateBridgeHooks,
  generateBridgeUI,
  generateRetryableHelpers,
} from './templates';

/**
 * Arbitrum Bridge Plugin
 * Generates L1-L2 bridging functionality using @arbitrum/sdk
 */
export class ArbitrumBridgePlugin extends BasePlugin<z.infer<typeof ArbitrumBridgeConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'arbitrum-bridge',
    name: 'Arbitrum Bridge',
    version: '0.1.0',
    description: 'L1-L2 bridging with @arbitrum/sdk - ETH, ERC-20, and messaging',
    category: 'app',
    tags: ['arbitrum', 'bridge', 'l1-l2', 'retryable-tickets', 'cross-chain'],
  };

  readonly configSchema = ArbitrumBridgeConfig as unknown as z.ZodType<z.infer<typeof ArbitrumBridgeConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'bridge-out',
      name: 'Bridge Utils',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof ArbitrumBridgeConfig>> {
    return {
      supportedTokens: ['ETH'],
      enableERC20: true,
      enableMessaging: false,
      generateUI: true,
      targetNetwork: 'arbitrum',
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const libDir = 'src/lib/bridge';
    const hooksDir = 'src/hooks';
    const componentsDir = 'src/components/bridge';

    // Generate bridge utilities
    this.addFile(
      output,
      `${libDir}/bridge-utils.ts`,
      generateBridgeUtils(config)
    );

    // Generate retryable ticket helpers
    this.addFile(
      output,
      `${libDir}/retryable-helpers.ts`,
      generateRetryableHelpers(config)
    );

    // Generate React hooks
    this.addFile(
      output,
      `${hooksDir}/useBridge.ts`,
      generateBridgeHooks(config)
    );

    // Generate UI components if enabled
    if (config.generateUI) {
      this.addFile(
        output,
        `${componentsDir}/BridgeWidget.tsx`,
        generateBridgeUI(config)
      );
    }

    // Add environment variables
    this.addEnvVar(output, 'NEXT_PUBLIC_L1_RPC_URL', 'Ethereum L1 RPC URL', {
      required: true,
      defaultValue: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
    });
    this.addEnvVar(output, 'NEXT_PUBLIC_L2_RPC_URL', 'Arbitrum L2 RPC URL', {
      required: true,
      defaultValue: 'https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY',
    });

    // Add scripts
    this.addScript(output, 'bridge:status', 'tsx src/lib/bridge/check-status.ts');

    // Add documentation
    this.addDoc(
      output,
      'docs/bridge/arbitrum-bridge.md',
      'Arbitrum Bridge',
      generateBridgeDocs(config)
    );

    context.logger.info('Generated Arbitrum bridge configuration', {
      nodeId: node.id,
      targetNetwork: config.targetNetwork,
    });

    return output;
  }
}

function generateBridgeDocs(config: z.infer<typeof ArbitrumBridgeConfig>): string {
  return `# Arbitrum Bridge

L1-L2 bridging functionality using the official @arbitrum/sdk.

## Features

- **ETH Bridging**: ${config.supportedTokens.includes('ETH') ? 'Enabled' : 'Disabled'}
- **ERC-20 Bridging**: ${config.enableERC20 ? 'Enabled' : 'Disabled'}
- **Cross-chain Messaging**: ${config.enableMessaging ? 'Enabled' : 'Disabled'}
- **Target Network**: ${config.targetNetwork}

## How Bridging Works

### L1 → L2 (Deposit)

1. Call deposit function on L1
2. Transaction creates a "retryable ticket" on L2
3. Ticket is automatically executed (or can be manually redeemed)
4. Funds appear on L2 (~10-15 minutes)

### L2 → L1 (Withdrawal)

1. Call withdraw function on L2
2. Wait for the challenge period (~7 days on mainnet, ~1 hour on testnet)
3. Execute the withdrawal on L1
4. Funds appear on L1

## Usage

### Deposit ETH

\`\`\`typescript
import { useBridge } from '@/hooks/useBridge';

function DepositForm() {
  const { depositEth, isLoading } = useBridge();
  
  const handleDeposit = async () => {
    const tx = await depositEth({
      amount: '0.1', // ETH
    });
    console.log('Deposit tx:', tx);
  };
  
  return (
    <button onClick={handleDeposit} disabled={isLoading}>
      {isLoading ? 'Depositing...' : 'Deposit 0.1 ETH'}
    </button>
  );
}
\`\`\`

${config.enableERC20 ? `
### Deposit ERC-20

\`\`\`typescript
const { depositToken, approveToken } = useBridge();

// First approve the token
await approveToken({
  tokenAddress: '0x...', // L1 token address
  amount: '1000000000000000000', // 1 token in wei
});

// Then deposit
await depositToken({
  tokenAddress: '0x...',
  amount: '1000000000000000000',
});
\`\`\`
` : ''}

### Withdraw ETH

\`\`\`typescript
const { withdrawEth } = useBridge();

const tx = await withdrawEth({
  amount: '0.1',
});
\`\`\`

### Check Withdrawal Status

\`\`\`typescript
const { getWithdrawalStatus } = useBridge();

const status = await getWithdrawalStatus(txHash);
// status: 'UNCONFIRMED' | 'CONFIRMED' | 'EXECUTED'
\`\`\`

## Retryable Tickets

If a retryable ticket fails to auto-redeem, you can manually redeem it:

\`\`\`typescript
import { redeemRetryableTicket } from '@/lib/bridge/retryable-helpers';

await redeemRetryableTicket({
  ticketId: '0x...',
});
\`\`\`

## Security Considerations

- Always verify token addresses before bridging
- Be aware of the ~7 day withdrawal period for mainnet
- Monitor retryable tickets for failed redemptions
- Use canonical bridge contracts only

## References

- [Arbitrum Bridge Documentation](https://docs.arbitrum.io/build-decentralized-apps/token-bridging/overview)
- [@arbitrum/sdk GitHub](https://github.com/OffchainLabs/arbitrum-sdk)
- [Retryable Tickets](https://docs.arbitrum.io/how-arbitrum-works/arbos/l1-l2-messaging)
`;
}

export { generateBridgeUtils, generateBridgeHooks, generateBridgeUI };

