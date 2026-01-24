import { z } from 'zod';
import {
    BasePlugin,
    type PluginMetadata,
    type PluginPort,
    type CodegenOutput,
    type BlueprintNode,
    type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { StylusRustContractConfig } from '@dapp-forge/blueprint-schema';

/**
 * Stylus Rust Contract Plugin
 * Guides users on creating Stylus Rust contracts for Arbitrum
 */
export class StylusRustContractPlugin extends BasePlugin<z.infer<typeof StylusRustContractConfig>> {
    readonly metadata: PluginMetadata = {
        id: 'stylus-rust-contract',
        name: 'Stylus Rust Contract',
        version: '0.1.0',
        description: 'Guide for building Rust smart contracts on Arbitrum Stylus',
        category: 'contracts',
        tags: ['rust', 'stylus', 'arbitrum', 'wasm', 'tutorial'],
    };

    readonly configSchema = StylusRustContractConfig as unknown as z.ZodType<z.infer<typeof StylusRustContractConfig>>;

    readonly ports: PluginPort[] = [
        {
            id: 'contract-out',
            name: 'Contract Code',
            type: 'output',
            dataType: 'contract',
        },
    ];

    getDefaultConfig(): Partial<z.infer<typeof StylusRustContractConfig>> {
        return {
            network: 'arbitrum-sepolia',
            exampleType: 'counter',
            contractCode: '',
        };
    }

    async generate(
        node: BlueprintNode,
        context: ExecutionContext
    ): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        const contractName = config.contractName || 'MyContract';
        const contractDir = `contracts/${contractName.toLowerCase()}`;

        // Generate Cargo.toml for Stylus
        this.addFile(
            output,
            `${contractDir}/Cargo.toml`,
            generateStylusCargoToml(contractName)
        );

        // Generate contract source
        const contractCode = config.contractCode || getExampleContract(config.exampleType);
        this.addFile(
            output,
            `${contractDir}/src/lib.rs`,
            contractCode
        );

        // Generate setup guide
        this.addFile(
            output,
            `${contractDir}/STYLUS_SETUP.md`,
            generateSetupGuide(config)
        );

        // Add environment variables
        this.addEnvVar(output, 'STYLUS_RPC_URL', 'Arbitrum RPC URL for deployment', {
            required: true,
            defaultValue: config.network === 'arbitrum'
                ? 'https://arb1.arbitrum.io/rpc'
                : 'https://sepolia-rollup.arbitrum.io/rpc',
        });
        this.addEnvVar(output, 'DEPLOYER_PRIVATE_KEY', 'Private key for deployment', {
            required: true,
            secret: true,
        });

        // Generate deployment scripts
        this.addFile(
            output,
            'scripts/deploy-sepolia.sh',
            generateDeployScript('sepolia')
        );

        this.addFile(
            output,
            'scripts/deploy-mainnet.sh',
            generateDeployScript('mainnet')
        );

        // Add scripts
        this.addScript(output, 'stylus:build', `cd ${contractDir} && cargo build --release --target wasm32-unknown-unknown`);
        this.addScript(output, 'stylus:check', `cd ${contractDir} && cargo stylus check`);
        this.addScript(output, 'deploy:sepolia', 'bash scripts/deploy-sepolia.sh');
        this.addScript(output, 'deploy:mainnet', 'bash scripts/deploy-mainnet.sh');

        context.logger.info(`Generated Stylus Rust Contract: ${contractName}`, {
            nodeId: node.id,
            network: config.network,
        });

        return output;
    }
}

function generateDeployScript(network: 'sepolia' | 'mainnet'): string {
    const rpcUrl = network === 'sepolia' 
        ? 'https://sepolia-rollup.arbitrum.io/rpc'
        : 'https://arb1.arbitrum.io/rpc';
    
    const networkName = network === 'sepolia' ? 'Arbitrum Sepolia' : 'Arbitrum One';

    return `#!/bin/bash
# Stylus ${networkName} Deployment Script
# This script deploys your Stylus contract to ${networkName}

# Load .env if present (ignore comments)
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Fail on error, undefined var, or pipefail
set -euo pipefail

# ${networkName} RPC URL
RPC_URL="${rpcUrl}"

# Check for PRIVATE_KEY environment variable
if [[ -z "\${PRIVATE_KEY:-}" ]]; then
  echo "Error: PRIVATE_KEY environment variable is not set."
  echo "Please set your private key: export PRIVATE_KEY=your_private_key_here"
  exit 1
fi

# Check for required tools
for cmd in cast cargo rustup curl; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "Error: $cmd is not installed."
    exit 1
  fi
done

# Ensure the wasm target is installed for the active toolchain
if ! rustup target list --installed | grep -q "^wasm32-unknown-unknown$"; then
  echo "Rust target wasm32-unknown-unknown not found. Adding target using rustup..."
  if ! rustup target add wasm32-unknown-unknown; then
    echo "Error: Failed to add wasm32-unknown-unknown target via rustup."
    echo "If you're using a custom toolchain, ensure rustup is configured correctly."
    exit 1
  fi
  echo "wasm32-unknown-unknown target installed."
else
  echo "wasm32-unknown-unknown target already installed."
fi

# (Optional) check that \`cargo stylus\` can be invoked
if ! cargo stylus --help &> /dev/null; then
  echo "Warning: 'cargo stylus' didn't respond to --help. It may still work when run as a subcommand; continuing..."
fi

# Check if we can connect to ${networkName}
echo "Checking connection to ${networkName}..."
if ! curl -s -X POST -H "Content-Type: application/json" \\
  --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}' \\
  "\${RPC_URL}" > /dev/null; then
    echo "Error: Cannot connect to ${networkName} RPC"
    exit 1
fi
echo "Connected to ${networkName}!"

echo "Deploying the Stylus contract using cargo stylus..."
deploy_output=$(cargo stylus deploy -e "\${RPC_URL}" --private-key "\${PRIVATE_KEY}" --no-verify 2>&1) || true

# If cargo stylus failed, exit with helpful output
if [[ $? -ne 0 ]]; then
    echo "Error: Contract deployment failed"
    echo "Deploy output: $deploy_output"
    exit 1
fi

# Extract deployment transaction hash using more precise pattern
deployment_tx=$(echo "$deploy_output" | grep -i "transaction\\|tx" | grep -oE '0x[a-fA-F0-9]{64}' | head -1)

# Extract contract address using more precise pattern
contract_address=$(echo "$deploy_output" | grep -i "contract\\|deployed" | grep -oE '0x[a-fA-F0-9]{40}' | head -1)

# If the above patterns don't work, try alternative patterns for cargo stylus output
if [[ -z "$deployment_tx" ]]; then
    deployment_tx=$(echo "$deploy_output" | grep -oE '0x[a-fA-F0-9]{64}' | head -1)
fi

if [[ -z "$contract_address" ]]; then
    contract_address=$(echo "$deploy_output" | grep -oE '0x[a-fA-F0-9]{40}' | head -1)
fi

# Verify extraction was successful
if [[ -z "$deployment_tx" ]]; then
    echo "Error: Could not extract deployment transaction hash from output"
    echo "Deploy output: $deploy_output"
    exit 1
fi

echo "Stylus contract deployed successfully!"
echo "Transaction hash: $deployment_tx"

if [[ ! -z "$contract_address" ]]; then
    echo "Contract address: $contract_address"
fi

echo "Deployment completed successfully on ${networkName}!"
`;
}

function generateStylusCargoToml(name: string): string {
    return `[package]
name = "${name.toLowerCase()}"
version = "0.1.0"
edition = "2021"

[dependencies]
stylus-sdk = "0.6.0"
alloy-primitives = "0.7"
alloy-sol-types = "0.7"

[features]
export-abi = ["stylus-sdk/export-abi"]

[lib]
crate-type = ["cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"
`;
}

function getExampleContract(type: string): string {
    if (type === 'counter') {
        return `//! Stylus Counter Contract
//! A simple counter that can be incremented and read.

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use stylus_sdk::{alloy_primitives::U256, prelude::*, storage::StorageU256};

sol_storage! {
    #[entrypoint]
    pub struct Counter {
        StorageU256 count;
    }
}

#[public]
impl Counter {
    /// Gets the current count value
    pub fn get_count(&self) -> U256 {
        self.count.get()
    }

    /// Increments the count by 1
    pub fn increment(&mut self) {
        let current = self.count.get();
        self.count.set(current + U256::from(1));
    }

    /// Sets the count to a specific value
    pub fn set_count(&mut self, value: U256) {
        self.count.set(value);
    }
}
`;
    }

    if (type === 'storage') {
        return `//! Stylus Storage Contract
//! A simple key-value storage contract.

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use stylus_sdk::{alloy_primitives::{U256, Address}, prelude::*, storage::StorageMap};

sol_storage! {
    #[entrypoint]
    pub struct Storage {
        StorageMap<Address, U256> balances;
    }
}

#[public]
impl Storage {
    /// Gets the balance for an address
    pub fn get_balance(&self, addr: Address) -> U256 {
        self.balances.get(addr)
    }

    /// Sets the balance for an address
    pub fn set_balance(&mut self, addr: Address, value: U256) {
        self.balances.insert(addr, value);
    }
}
`;
    }

    // Custom template
    return `//! Custom Stylus Contract
//! Add your contract logic here.

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use stylus_sdk::{alloy_primitives::U256, prelude::*};

sol_storage! {
    #[entrypoint]
    pub struct MyContract {
        // Add your storage variables here
    }
}

#[public]
impl MyContract {
    // Add your public functions here
}
`;
}

function generateSetupGuide(config: z.infer<typeof StylusRustContractConfig>): string {
    return `# Stylus Rust Contract Setup Guide

## Prerequisites

1. **Install Rust** (if not already installed):
   \`\`\`bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   \`\`\`

2. **Add WASM target**:
   \`\`\`bash
   rustup target add wasm32-unknown-unknown
   \`\`\`

3. **Install Cargo Stylus CLI**:
   \`\`\`bash
   cargo install cargo-stylus
   \`\`\`

## Project Structure

\`\`\`
contracts/
└── ${config.contractName?.toLowerCase() || 'mycontract'}/
    ├── Cargo.toml
    └── src/
        └── lib.rs
\`\`\`

## Building Your Contract

\`\`\`bash
pnpm stylus:build
\`\`\`

## Checking Deployment Readiness

\`\`\`bash
pnpm stylus:check
\`\`\`

## Deploying to ${config.network === 'arbitrum' ? 'Arbitrum One' : 'Arbitrum Sepolia'}

1. Set your environment variables in \`.env\`:
   \`\`\`
   STYLUS_RPC_URL=${config.network === 'arbitrum' ? 'https://arb1.arbitrum.io/rpc' : 'https://sepolia-rollup.arbitrum.io/rpc'}
   DEPLOYER_PRIVATE_KEY=your_private_key_here
   \`\`\`

2. Deploy:
   \`\`\`bash
   pnpm stylus:deploy
   \`\`\`

## Resources

- [Arbitrum Stylus Quickstart](https://docs.arbitrum.io/stylus/quickstart)
- [Stylus SDK Documentation](https://docs.rs/stylus-sdk)
- [Stylus Examples](https://github.com/OffchainLabs/stylus-hello-world)
`;
}
