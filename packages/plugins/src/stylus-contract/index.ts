import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { StylusContractConfig } from '@dapp-forge/blueprint-schema';
import { generateContractCode, generateCargoToml, generateTestFile } from './templates';

/**
 * Stylus Contract Plugin
 * Generates Rust/WASM smart contracts for Arbitrum Stylus
 */
export class StylusContractPlugin extends BasePlugin<z.infer<typeof StylusContractConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'stylus-contract',
    name: 'Stylus Contract',
    version: '0.1.0',
    description: 'Generate Rust smart contracts for Arbitrum Stylus (WASM)',
    category: 'contracts',
    tags: ['rust', 'wasm', 'arbitrum', 'stylus', 'smart-contract'],
  };

  readonly configSchema = StylusContractConfig as unknown as z.ZodType<z.infer<typeof StylusContractConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'contract-out',
      name: 'Contract ABI',
      type: 'output',
      dataType: 'contract',
    },
    {
      id: 'types-out',
      name: 'Generated Types',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof StylusContractConfig>> {
    return {
      contractType: 'custom',
      features: ['ownable'],
      testCoverage: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const contractName = config.contractName.toLowerCase();

    // Generate Cargo.toml - contract-source will place in contracts/
    this.addFile(output, `${contractName}/Cargo.toml`, generateCargoToml(config), 'contract-source');

    // Generate main contract file
    this.addFile(output, `${contractName}/src/lib.rs`, generateContractCode(config), 'contract-source');

    // Generate test file if enabled
    if (config.testCoverage) {
      this.addFile(output, `${contractName}/tests/integration.rs`, generateTestFile(config), 'contract-source');
    }

    // Add environment variables
    this.addEnvVar(output, 'STYLUS_RPC_URL', 'Arbitrum RPC URL for deployment', {
      required: true,
      defaultValue: context.config.network.rpcUrl,
    });
    this.addEnvVar(output, 'DEPLOYER_PRIVATE_KEY', 'Private key for contract deployment', {
      required: true,
      secret: true,
    });

    // Add scripts
    const contractDir = `contracts/${contractName}`;
    this.addScript(output, 'build:contract', `cd ${contractDir} && cargo build --release --target wasm32-unknown-unknown`);
    this.addScript(output, 'test:contract', `cd ${contractDir} && cargo test`);
    this.addScript(output, 'deploy:contract', `cargo stylus deploy --private-key $DEPLOYER_PRIVATE_KEY`);

    // Add ABI interface
    output.interfaces.push({
      name: `${config.contractName}ABI`,
      type: 'abi',
      content: generateABI(config),
    });

    // Add documentation
    this.addDoc(
      output,
      `docs/contracts/${config.contractName}.md`,
      `${config.contractName} Contract`,
      generateContractDocs(config)
    );

    context.logger.info(`Generated Stylus contract: ${config.contractName}`, {
      nodeId: node.id,
      contractType: config.contractType,
    });

    return output;
  }
}

function generateABI(config: z.infer<typeof StylusContractConfig>): string {
  const abiEntries: object[] = [];

  // Add standard functions based on contract type
  if (config.contractType === 'erc20') {
    abiEntries.push(
      { type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
      { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
      { type: 'function', name: 'transfer', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
      { type: 'function', name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
      { type: 'function', name: 'transferFrom', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' }
    );
  } else if (config.contractType === 'erc721') {
    abiEntries.push(
      { type: 'function', name: 'balanceOf', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
      { type: 'function', name: 'ownerOf', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'address' }], stateMutability: 'view' },
      { type: 'function', name: 'safeTransferFrom', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'tokenId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' }
    );
  }

  // Add ownable functions if enabled
  if (config.features.includes('ownable')) {
    abiEntries.push(
      { type: 'function', name: 'owner', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
      { type: 'function', name: 'transferOwnership', inputs: [{ name: 'newOwner', type: 'address' }], outputs: [], stateMutability: 'nonpayable' }
    );
  }

  // Add pausable functions if enabled
  if (config.features.includes('pausable')) {
    abiEntries.push(
      { type: 'function', name: 'paused', inputs: [], outputs: [{ type: 'bool' }], stateMutability: 'view' },
      { type: 'function', name: 'pause', inputs: [], outputs: [], stateMutability: 'nonpayable' },
      { type: 'function', name: 'unpause', inputs: [], outputs: [], stateMutability: 'nonpayable' }
    );
  }

  return JSON.stringify(abiEntries, null, 2);
}

function generateContractDocs(config: z.infer<typeof StylusContractConfig>): string {
  return `# ${config.contractName}

A ${config.contractType.toUpperCase()} smart contract built with Arbitrum Stylus (Rust/WASM).

## Features

${config.features.map(f => `- **${f}**: Enabled`).join('\n')}

## Building

\`\`\`bash
pnpm build:contract
\`\`\`

## Testing

\`\`\`bash
pnpm test:contract
\`\`\`

## Deployment

1. Set your environment variables:
   - \`STYLUS_RPC_URL\`: Your Arbitrum RPC endpoint
   - \`DEPLOYER_PRIVATE_KEY\`: Your deployer wallet private key

2. Deploy the contract:
   \`\`\`bash
   pnpm deploy:contract
   \`\`\`

## Contract Type: ${config.contractType}

${config.contractType === 'erc20' ? `
### ERC-20 Token Standard

This contract implements the ERC-20 token standard with the following functions:
- \`totalSupply()\`: Returns the total token supply
- \`balanceOf(address)\`: Returns the token balance of an account
- \`transfer(address, uint256)\`: Transfers tokens to a recipient
- \`approve(address, uint256)\`: Approves a spender to transfer tokens
- \`transferFrom(address, address, uint256)\`: Transfers tokens on behalf of another account
` : config.contractType === 'erc721' ? `
### ERC-721 NFT Standard

This contract implements the ERC-721 NFT standard with the following functions:
- \`balanceOf(address)\`: Returns the number of NFTs owned by an account
- \`ownerOf(uint256)\`: Returns the owner of a specific token ID
- \`safeTransferFrom(address, address, uint256)\`: Safely transfers an NFT
` : `
### Custom Contract

This is a custom contract. Add your own functions and logic in \`src/lib.rs\`.
`}
`;
}

export { generateContractCode, generateCargoToml, generateTestFile };

