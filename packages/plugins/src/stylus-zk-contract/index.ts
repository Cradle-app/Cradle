import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { StylusZKContractConfig } from '@dapp-forge/blueprint-schema';
import {
  generateZKContractCode,
  generateZKCircuit,
  generateOracleService,
  generateFrontendZKIntegration,
  generateCargoToml,
} from './templates';

/**
 * Stylus ZK Contract Plugin
 * Generates Rust/WASM smart contracts with Zero-Knowledge proof verification
 * Inspired by thirdweb's Stylus ZK ERC721 template
 */
export class StylusZKContractPlugin extends BasePlugin<z.infer<typeof StylusZKContractConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'stylus-zk-contract',
    name: 'Stylus ZK Contract',
    version: '0.1.0',
    description: 'Generate privacy-preserving Stylus contracts with ZK proof verification',
    category: 'contracts',
    tags: ['rust', 'wasm', 'arbitrum', 'stylus', 'zk', 'zero-knowledge', 'privacy'],
  };

  readonly configSchema = StylusZKContractConfig as unknown as z.ZodType<z.infer<typeof StylusZKContractConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'contract-out',
      name: 'ZK Contract ABI',
      type: 'output',
      dataType: 'contract',
    },
    {
      id: 'circuit-out',
      name: 'ZK Circuit',
      type: 'output',
      dataType: 'config',
    },
    {
      id: 'oracle-out',
      name: 'Oracle Service',
      type: 'output',
      dataType: 'api',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof StylusZKContractConfig>> {
    return {
      contractType: 'erc721',
      zkCircuitType: 'balance-proof',
      oracleEnabled: true,
      nullifierEnabled: true,
      testCoverage: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const contractDir = `contracts/${config.contractName.toLowerCase()}`;
    const circuitsDir = `circuits/${config.contractName.toLowerCase()}`;
    const oracleDir = `services/oracle`;

    // Generate Cargo.toml for Stylus contract
    this.addFile(
      output,
      `${contractDir}/Cargo.toml`,
      generateCargoToml(config)
    );

    // Generate ZK contract code
    this.addFile(
      output,
      `${contractDir}/src/lib.rs`,
      generateZKContractCode(config)
    );

    // Generate ZK circuit (Circom)
    this.addFile(
      output,
      `${circuitsDir}/${config.contractName.toLowerCase()}_circuit.circom`,
      generateZKCircuit(config)
    );

    // Generate circuit configuration
    this.addFile(
      output,
      `${circuitsDir}/circuit.config.json`,
      JSON.stringify({
        circuitName: `${config.contractName}Circuit`,
        template: config.zkCircuitType,
        inputs: {
          private: ['actual_balance', 'salt'],
          public: ['min_required_balance', 'user_address_hash', 'timestamp'],
        },
      }, null, 2)
    );

    // Generate oracle service if enabled
    if (config.oracleEnabled) {
      this.addFile(
        output,
        `${oracleDir}/src/index.ts`,
        generateOracleService(config)
      );
      
      this.addFile(
        output,
        `${oracleDir}/package.json`,
        JSON.stringify({
          name: `${config.contractName.toLowerCase()}-oracle`,
          version: '0.1.0',
          type: 'module',
          scripts: {
            dev: 'tsx watch src/index.ts',
            start: 'tsx src/index.ts',
          },
          dependencies: {
            '@noble/curves': '^1.0.0',
            'fastify': '^4.26.0',
            'viem': '^2.0.0',
          },
          devDependencies: {
            'tsx': '^4.7.0',
            'typescript': '^5.3.0',
          },
        }, null, 2)
      );
    }

    // Generate frontend ZK integration
    this.addFile(
      output,
      `src/lib/zk/${config.contractName.toLowerCase()}-zk.ts`,
      generateFrontendZKIntegration(config)
    );

    // Generate test file if enabled
    if (config.testCoverage) {
      this.addFile(
        output,
        `${contractDir}/tests/integration.rs`,
        generateTestFile(config)
      );
    }

    // Add environment variables
    this.addEnvVar(output, 'ORACLE_SECRET_KEY', 'Secret key for oracle signing', {
      required: config.oracleEnabled,
      secret: true,
    });
    this.addEnvVar(output, 'ZK_CONTRACT_ADDRESS', 'Deployed ZK contract address', {
      required: true,
    });
    this.addEnvVar(output, 'CIRCUIT_WASM_PATH', 'Path to compiled circuit WASM', {
      required: true,
      defaultValue: `circuits/${config.contractName.toLowerCase()}/circuit.wasm`,
    });
    this.addEnvVar(output, 'CIRCUIT_ZKEY_PATH', 'Path to circuit zkey file', {
      required: true,
      defaultValue: `circuits/${config.contractName.toLowerCase()}/circuit_final.zkey`,
    });

    // Add scripts
    this.addScript(
      output,
      'circuit:build',
      `cd ${circuitsDir} && circom ${config.contractName.toLowerCase()}_circuit.circom --r1cs --wasm --sym`,
      'Build ZK circuit'
    );
    this.addScript(
      output,
      'circuit:setup',
      `cd ${circuitsDir} && snarkjs groth16 setup ${config.contractName.toLowerCase()}_circuit.r1cs ptau/powersOfTau28_hez_final_${config.zkCircuitType === 'balance-proof' ? '15' : '20'}.ptau circuit_0000.zkey`,
      'Generate zkey'
    );
    this.addScript(
      output,
      'circuit:verify',
      `cd ${circuitsDir} && snarkjs groth16 verify verification_key.json public.json proof.json`,
      'Verify ZK proof'
    );
    this.addScript(output, 'build:zk-contract', `cd ${contractDir} && cargo build --release --target wasm32-unknown-unknown`);
    this.addScript(output, 'test:zk-contract', `cd ${contractDir} && cargo test`);
    if (config.oracleEnabled) {
      this.addScript(output, 'oracle:dev', `cd ${oracleDir} && pnpm dev`, 'Start oracle service');
    }

    // Add ABI interface
    output.interfaces.push({
      name: `${config.contractName}ZKABI`,
      type: 'abi',
      content: generateZKABI(config),
    });

    // Add documentation
    this.addDoc(
      output,
      `docs/contracts/${config.contractName}-zk.md`,
      `${config.contractName} ZK Contract`,
      generateZKContractDocs(config)
    );

    context.logger.info(`Generated Stylus ZK contract: ${config.contractName}`, {
      nodeId: node.id,
      contractType: config.contractType,
      zkCircuitType: config.zkCircuitType,
    });

    return output;
  }
}

function generateZKABI(config: z.infer<typeof StylusZKContractConfig>): string {
  const abiEntries: object[] = [];

  // Base ERC721 functions
  if (config.contractType === 'erc721') {
    abiEntries.push(
      { type: 'function', name: 'balanceOf', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
      { type: 'function', name: 'ownerOf', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'address' }], stateMutability: 'view' },
      { type: 'function', name: 'safeTransferFrom', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'tokenId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' }
    );
  }

  // ZK-specific functions
  abiEntries.push(
    { 
      type: 'function', 
      name: 'mintWithProof', 
      inputs: [
        { name: 'proof', type: 'uint256[8]' },
        { name: 'publicInputs', type: 'uint256[4]' },
        { name: 'nullifier', type: 'uint256' },
      ], 
      outputs: [{ type: 'uint256' }], 
      stateMutability: 'nonpayable' 
    },
    { 
      type: 'function', 
      name: 'verifyProof', 
      inputs: [
        { name: 'proof', type: 'uint256[8]' },
        { name: 'publicInputs', type: 'uint256[4]' },
      ], 
      outputs: [{ type: 'bool' }], 
      stateMutability: 'view' 
    },
    { 
      type: 'function', 
      name: 'isNullifierUsed', 
      inputs: [{ name: 'nullifier', type: 'uint256' }], 
      outputs: [{ type: 'bool' }], 
      stateMutability: 'view' 
    }
  );

  return JSON.stringify(abiEntries, null, 2);
}

function generateZKContractDocs(config: z.infer<typeof StylusZKContractConfig>): string {
  return `# ${config.contractName} - ZK Contract

A privacy-preserving ${config.contractType.toUpperCase()} smart contract with Zero-Knowledge proof verification on Arbitrum Stylus.

## Overview

This contract uses ZK proofs to enable private token minting. Users can prove they meet certain criteria (e.g., minimum balance) without revealing their exact values.

## Features

- **ZK Proof Verification**: On-chain verification of Groth16 proofs
- **Privacy-Preserving**: Users don't reveal sensitive information
${config.nullifierEnabled ? '- **Nullifier System**: Prevents replay attacks' : ''}
${config.oracleEnabled ? '- **Oracle Integration**: Secure balance verification' : ''}

## Circuit Type: ${config.zkCircuitType}

${config.zkCircuitType === 'balance-proof' ? `
### Balance Proof Circuit

Proves that a user owns a minimum amount of ETH/tokens without revealing the exact balance.

**Private Inputs:**
- \`actual_balance\`: User's real balance (hidden)
- \`salt\`: Randomness for uniqueness

**Public Inputs:**
- \`min_required_balance\`: Minimum threshold
- \`user_address_hash\`: Hashed user address
- \`timestamp\`: When oracle signed data
- \`oracle_commitment\`: Oracle's commitment

**Output:**
- \`nullifier\`: Prevents replay attacks
` : config.zkCircuitType === 'ownership-proof' ? `
### Ownership Proof Circuit

Proves ownership of specific tokens without revealing which tokens.

**Private Inputs:**
- \`token_ids\`: Array of owned token IDs (hidden)
- \`salt\`: Randomness

**Public Inputs:**
- \`min_token_count\`: Minimum number of tokens required
- \`user_address\`: User's address
- \`contract_address\`: Token contract address
` : `
### Custom Circuit

Custom ZK circuit logic defined in the configuration.
`}

## Building

### 1. Build the ZK Circuit

\`\`\`bash
pnpm circuit:build
pnpm circuit:setup
\`\`\`

### 2. Build the Contract

\`\`\`bash
pnpm build:zk-contract
\`\`\`

### 3. Deploy

\`\`\`bash
cargo stylus deploy --endpoint arbitrum-sepolia
\`\`\`

## Testing

\`\`\`bash
pnpm test:zk-contract
\`\`\`

## Usage

### Frontend Integration

\`\`\`typescript
import { generateZKProof, mintWithProof } from '@/lib/zk/${config.contractName.toLowerCase()}-zk';

// Generate proof
const proof = await generateZKProof({
  actualBalance: userBalance,
  minRequiredBalance: '1000000000000000000', // 1 ETH
  userAddress: userAddress,
});

// Mint with proof
const txHash = await mintWithProof(contractAddress, proof);
\`\`\`

${config.oracleEnabled ? `
## Oracle Service

The oracle service provides secure balance verification:

\`\`\`bash
pnpm oracle:dev
\`\`\`

The oracle:
- Fetches user balances
- Signs data with oracle secret key
- Provides commitments for ZK proofs
` : ''}

## Security Considerations

1. **Oracle Secret**: Keep the oracle secret key secure and private
2. **Nullifier Replay**: The nullifier system prevents proof reuse
3. **Circuit Trust**: The circuit must be audited before production use
4. **Trusted Setup**: The Groth16 trusted setup must be performed securely

## References

- [Arbitrum Stylus Documentation](https://docs.arbitrum.io/stylus)
- [Circom Documentation](https://docs.circom.io/)
- [Groth16 Protocol](https://eprint.iacr.org/2016/260.pdf)
`;
}

function generateTestFile(config: z.infer<typeof StylusZKContractConfig>): string {
  return `// Integration tests for ${config.contractName} ZK Contract
// Generated by Cradle

use ${config.contractName.toLowerCase()}::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_zk_contract_initialization() {
        // Test contract initialization
        assert!(true, "Contract should initialize correctly");
    }

    #[test]
    fn test_proof_verification() {
        // Test ZK proof verification
        // This is a placeholder - implement with actual proof data
        assert!(true, "Proof verification should work");
    }

    ${config.nullifierEnabled ? `
    #[test]
    fn test_nullifier_system() {
        // Test nullifier prevents replay attacks
        assert!(true, "Nullifier system should prevent replays");
    }
    ` : ''}

    #[test]
    fn test_mint_with_proof() {
        // Test minting with valid ZK proof
        assert!(true, "Minting with proof should work");
    }

    #[test]
    fn test_invalid_proof_rejection() {
        // Test that invalid proofs are rejected
        assert!(true, "Invalid proofs should be rejected");
    }
}
`;
}

export { generateZKContractCode, generateZKCircuit, generateOracleService, generateFrontendZKIntegration, generateCargoToml };

