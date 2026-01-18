import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { EIP7702SmartEOAConfig } from '@dapp-forge/blueprint-schema';
import {
  generateDelegateContract,
  generateEIP7702Helpers,
  generateAuthorizationHooks,
  generateDelegationUI,
  generateSecurityUtils,
} from './templates';

/**
 * EIP-7702 Smart EOA Plugin
 * Generates code for EIP-7702 smart EOA delegation on Arbitrum
 */
export class EIP7702SmartEOAPlugin extends BasePlugin<z.infer<typeof EIP7702SmartEOAConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'eip7702-smart-eoa',
    name: 'EIP-7702 Smart EOA',
    version: '0.1.0',
    description: 'Enable EOAs to temporarily delegate to smart contract logic (EIP-7702)',
    category: 'contracts',
    tags: ['eip-7702', 'account-abstraction', 'arbitrum', 'smart-eoa', 'delegation'],
  };

  readonly configSchema = EIP7702SmartEOAConfig as unknown as z.ZodType<z.infer<typeof EIP7702SmartEOAConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'delegate-out',
      name: 'Delegate Contract',
      type: 'output',
      dataType: 'contract',
    },
    {
      id: 'hooks-out',
      name: 'React Hooks',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof EIP7702SmartEOAConfig>> {
    return {
      delegateType: 'batch-executor',
      features: ['batch-calls', 'sponsored-tx'],
      securityWarnings: true,
      generateUI: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const contractDir = `contracts/${config.delegateName.toLowerCase()}`;
    const libDir = 'src/lib/eip7702';
    const hooksDir = 'src/hooks';
    const componentsDir = 'src/components/eip7702';

    // Generate delegate contract (Solidity for EIP-7702 compatibility)
    this.addFile(
      output,
      `${contractDir}/src/${config.delegateName}.sol`,
      generateDelegateContract(config)
    );

    // Generate EIP-7702 helpers (viem-based)
    this.addFile(
      output,
      `${libDir}/eip7702-helpers.ts`,
      generateEIP7702Helpers(config)
    );

    // Generate authorization hooks
    this.addFile(
      output,
      `${hooksDir}/useEIP7702.ts`,
      generateAuthorizationHooks(config)
    );

    // Generate security utilities
    if (config.securityWarnings) {
      this.addFile(
        output,
        `${libDir}/security.ts`,
        generateSecurityUtils(config)
      );
    }

    // Generate UI components if enabled
    if (config.generateUI) {
      this.addFile(
        output,
        `${componentsDir}/DelegationManager.tsx`,
        generateDelegationUI(config)
      );
    }

    // Add environment variables
    this.addEnvVar(output, 'NEXT_PUBLIC_ARBITRUM_RPC_URL', 'Arbitrum RPC URL for EIP-7702 transactions', {
      required: true,
      defaultValue: 'https://arb1.arbitrum.io/rpc',
    });

    if (config.features.includes('sponsored-tx')) {
      this.addEnvVar(output, 'SPONSOR_PRIVATE_KEY', 'Private key for gas sponsorship', {
        required: false,
        secret: true,
      });
    }

    // Add scripts
    this.addScript(output, 'build:delegate', `cd ${contractDir} && forge build`);
    this.addScript(output, 'test:delegate', `cd ${contractDir} && forge test`);
    this.addScript(output, 'deploy:delegate', `cd ${contractDir} && forge script script/Deploy.s.sol --broadcast`);

    // Add ABI interface
    output.interfaces.push({
      name: `${config.delegateName}ABI`,
      type: 'abi',
      content: generateDelegateABI(config),
    });

    // Add documentation
    this.addDoc(
      output,
      `docs/eip7702/${config.delegateName}.md`,
      `${config.delegateName} - EIP-7702 Delegate`,
      generateEIP7702Docs(config)
    );

    context.logger.info(`Generated EIP-7702 delegate: ${config.delegateName}`, {
      nodeId: node.id,
      delegateType: config.delegateType,
    });

    return output;
  }
}

function generateDelegateABI(config: z.infer<typeof EIP7702SmartEOAConfig>): string {
  const abiEntries: object[] = [];

  // Base execute function
  abiEntries.push({
    type: 'function',
    name: 'execute',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [{ name: 'result', type: 'bytes' }],
    stateMutability: 'payable',
  });

  // Batch execute if enabled
  if (config.features.includes('batch-calls')) {
    abiEntries.push({
      type: 'function',
      name: 'executeBatch',
      inputs: [
        { name: 'targets', type: 'address[]' },
        { name: 'values', type: 'uint256[]' },
        { name: 'calldatas', type: 'bytes[]' },
      ],
      outputs: [{ name: 'results', type: 'bytes[]' }],
      stateMutability: 'payable',
    });
  }

  // Session keys if enabled
  if (config.features.includes('session-keys')) {
    abiEntries.push(
      {
        type: 'function',
        name: 'addSessionKey',
        inputs: [
          { name: 'key', type: 'address' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'permissions', type: 'bytes32' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      {
        type: 'function',
        name: 'revokeSessionKey',
        inputs: [{ name: 'key', type: 'address' }],
        outputs: [],
        stateMutability: 'nonpayable',
      }
    );
  }

  return JSON.stringify(abiEntries, null, 2);
}

function generateEIP7702Docs(config: z.infer<typeof EIP7702SmartEOAConfig>): string {
  return `# ${config.delegateName}

An EIP-7702 delegate contract for smart EOA functionality on Arbitrum.

## Overview

EIP-7702 allows your regular EOA (Externally Owned Account) to temporarily adopt smart contract 
functionality for a single transaction. This enables features like:

${config.features.map(f => `- **${f}**: Enabled`).join('\n')}

## How It Works

1. **Authorization**: Sign an authorization that points to this delegate contract
2. **SetCode Transaction**: Include the authorization in a type 0x04 transaction
3. **Execution**: Your EOA temporarily has the delegate's code for that transaction
4. **Cleanup**: After the transaction, your EOA returns to normal

## Security Considerations

⚠️ **Important Security Notes:**

- Always verify the delegate contract address before signing authorizations
- Never sign authorizations for contracts you haven't audited
- Be aware of phishing attacks that may try to get you to sign malicious authorizations
- Authorizations can be revoked by signing a new authorization to address(0)

## Usage

### Basic Execute

\`\`\`typescript
import { useEIP7702 } from '@/hooks/useEIP7702';

const { execute, authorize } = useEIP7702();

// First authorize the delegate
await authorize();

// Then execute a call through the delegate
await execute({
  to: contractAddress,
  value: 0n,
  data: encodedCalldata,
});
\`\`\`

${config.features.includes('batch-calls') ? `
### Batch Execution

\`\`\`typescript
// Execute multiple calls atomically
await executeBatch([
  { to: token, value: 0n, data: approveCalldata },
  { to: dex, value: 0n, data: swapCalldata },
  { to: vault, value: 0n, data: depositCalldata },
]);
\`\`\`
` : ''}

${config.features.includes('sponsored-tx') ? `
### Sponsored Transactions

\`\`\`typescript
// Execute with gas paid by sponsor
await executeSponsored({
  to: contractAddress,
  value: 0n,
  data: encodedCalldata,
  sponsor: sponsorAddress,
});
\`\`\`
` : ''}

## Building

\`\`\`bash
pnpm build:delegate
\`\`\`

## Testing

\`\`\`bash
pnpm test:delegate
\`\`\`

## Deployment

\`\`\`bash
pnpm deploy:delegate
\`\`\`

## References

- [EIP-7702 Specification](https://eips.ethereum.org/EIPS/eip-7702)
- [Arbitrum ArbOS 40 (Callisto) - EIP-7702 Support](https://docs.arbitrum.io)
- [Viem EIP-7702 Documentation](https://viem.sh/experimental/eip7702)
`;
}

export { generateDelegateContract, generateEIP7702Helpers, generateAuthorizationHooks };

