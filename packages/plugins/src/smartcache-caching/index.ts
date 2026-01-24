import { z } from 'zod';
import {
    BasePlugin,
    type PluginMetadata,
    type PluginPort,
    type CodegenOutput,
    type BlueprintNode,
    type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { SmartCacheCachingConfig } from '@dapp-forge/blueprint-schema';

/**
 * SmartCache Caching Plugin
 * Enables contract caching using the stylus-cache-sdk Rust crate
 */
export class SmartCacheCachingPlugin extends BasePlugin<z.infer<typeof SmartCacheCachingConfig>> {
    readonly metadata: PluginMetadata = {
        id: 'smartcache-caching',
        name: 'SmartCache Caching',
        version: '0.1.0',
        description: 'Enable contract caching for cheaper gas costs using SmartCache',
        category: 'contracts',
        tags: ['caching', 'gas-optimization', 'stylus', 'smartcache'],
    };

    readonly configSchema = SmartCacheCachingConfig as unknown as z.ZodType<z.infer<typeof SmartCacheCachingConfig>>;

    readonly ports: PluginPort[] = [
        {
            id: 'contract-in',
            name: 'Contract Input',
            type: 'input',
            dataType: 'contract',
        },
        {
            id: 'cached-contract-out',
            name: 'Cached Contract',
            type: 'output',
            dataType: 'contract',
        },
    ];

    getDefaultConfig(): Partial<z.infer<typeof SmartCacheCachingConfig>> {
        return {
            crateVersion: 'latest',
            autoOptIn: true,
            contractCode: '',
        };
    }

    async generate(
        node: BlueprintNode,
        context: ExecutionContext
    ): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        // Generate caching integration guide
        this.addFile(
            output,
            'docs/SMARTCACHE_INTEGRATION.md',
            generateCachingGuide(config)
        );

        // Generate example cached contract
        const cachedContract = addCachingToContract(config.contractCode || getDefaultContract());
        this.addFile(
            output,
            'contracts/cached-contract/src/lib.rs',
            cachedContract
        );

        // Generate updated Cargo.toml with caching dependency
        this.addFile(
            output,
            'contracts/cached-contract/Cargo.toml',
            generateCachedCargoToml(config)
        );

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

        // Add deployment scripts to package.json
        this.addScript(output, 'deploy:sepolia', 'bash scripts/deploy-sepolia.sh');
        this.addScript(output, 'deploy:mainnet', 'bash scripts/deploy-mainnet.sh');

        context.logger.info('Generated SmartCache caching integration', {
            nodeId: node.id,
            autoOptIn: config.autoOptIn,
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
# SmartCache Cached Contract ${networkName} Deployment Script
# This script deploys your cached Stylus contract to ${networkName}

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

echo "Deploying the cached Stylus contract using cargo stylus..."
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

echo "✅ Cached Stylus contract deployed successfully!"
echo "Transaction hash: $deployment_tx"

if [[ ! -z "$contract_address" ]]; then
    echo "Contract address: $contract_address"
    echo ""
    echo "⚡ Next Step: Opt-in to caching"
    echo "Run the following command to enable SmartCache:"
    echo "cast send $contract_address \\"opt_in_to_cache()\\" --private-key \$PRIVATE_KEY --rpc-url ${rpcUrl}"
fi

echo "Deployment completed successfully on ${networkName}!"
`;
}

function generateCachedCargoToml(config: z.infer<typeof SmartCacheCachingConfig>): string {
    const version = config.crateVersion === 'latest' ? '*' : config.crateVersion;

    return `[package]
name = "cached-contract"
version = "0.1.0"
edition = "2021"

[dependencies]
stylus-sdk = "0.6.0"
stylus-cache-sdk = "${version}"
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

function getDefaultContract(): string {
    return `//! Counter Contract

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
    pub fn get_count(&self) -> U256 {
        self.count.get()
    }

    pub fn set_count(&mut self, value: U256) {
        self.count.set(value);
    }
}
`;
}

function addCachingToContract(contractCode: string): string {
    // Add caching imports at the top
    const cachingImports = `use stylus_cache_sdk::{is_contract_cacheable, AutoCacheOptIn, emit_cache_opt_in};
use alloy_primitives::Address;

`;

    // Add is_cacheable function
    const cacheableFunction = `
    /// Returns whether this contract is cacheable
    /// Required for SmartCache integration
    pub fn is_cacheable(&self) -> bool {
        is_contract_cacheable()
    }

    /// Opt-in to caching (call once after deployment)
    pub fn opt_in_to_cache(&mut self) {
        emit_cache_opt_in();
    }
`;

    // Insert imports after existing use statements
    let modified = contractCode;

    // Find the last use statement and add caching imports after it
    const useMatch = modified.match(/use [^;]+;/g);
    if (useMatch && useMatch.length > 0) {
        const lastUse = useMatch[useMatch.length - 1];
        modified = modified.replace(lastUse, lastUse + '\n' + cachingImports);
    }

    // Find the impl block and add caching functions
    const implMatch = modified.match(/(#\[public\]\s*impl\s+\w+\s*\{)/);
    if (implMatch) {
        // Find the closing brace of the impl block and add functions before it
        const implStart = modified.indexOf(implMatch[0]);
        const afterImpl = modified.slice(implStart);

        // Find the last closing brace
        let braceCount = 0;
        let implEnd = -1;
        for (let i = 0; i < afterImpl.length; i++) {
            if (afterImpl[i] === '{') braceCount++;
            if (afterImpl[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    implEnd = implStart + i;
                    break;
                }
            }
        }

        if (implEnd > 0) {
            modified = modified.slice(0, implEnd) + cacheableFunction + modified.slice(implEnd);
        }
    }

    return modified;
}

function generateCachingGuide(config: z.infer<typeof SmartCacheCachingConfig>): string {
    return `# SmartCache Integration Guide

## Overview

SmartCache enables contract caching on Arbitrum Stylus, providing:
- **Cheaper function calls** - Reduced gas costs for repeated operations
- **Optimized execution** - Cached WASM bytecode for faster execution

## Installation

### 1. Add the Rust Crate

Add to your \`Cargo.toml\`:

\`\`\`toml
[dependencies]
stylus-cache-sdk = "${config.crateVersion === 'latest' ? '*' : config.crateVersion}"
\`\`\`

### 2. Import the SDK

Add these imports to your contract:

\`\`\`rust
use stylus_cache_sdk::{is_contract_cacheable, AutoCacheOptIn, emit_cache_opt_in};
use alloy_primitives::Address;
\`\`\`

### 3. Add Caching Functions

Add these functions to your contract's impl block:

\`\`\`rust
/// Returns whether this contract is cacheable
pub fn is_cacheable(&self) -> bool {
    is_contract_cacheable()
}

/// Opt-in to caching (call once after deployment)
pub fn opt_in_to_cache(&mut self) {
    emit_cache_opt_in();
}
\`\`\`

## Example: Cached Counter Contract

\`\`\`rust
#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use stylus_sdk::{alloy_primitives::U256, prelude::*, storage::StorageU256};
use stylus_cache_sdk::{is_contract_cacheable, AutoCacheOptIn, emit_cache_opt_in};
use alloy_primitives::Address;

sol_storage! {
    #[entrypoint]
    pub struct Counter {
        StorageU256 count;
    }
}

#[public]
impl Counter {
    pub fn get_count(&self) -> U256 {
        self.count.get()
    }

    pub fn set_count(&mut self, value: U256) {
        self.count.set(value);
    }

    /// Returns whether this contract is cacheable
    pub fn is_cacheable(&self) -> bool {
        is_contract_cacheable()
    }

    /// Opt-in to caching (call once after deployment)
    pub fn opt_in_to_cache(&mut self) {
        emit_cache_opt_in();
    }
}
\`\`\`

## After Deployment

After deploying your contract, call \`opt_in_to_cache()\` once to enable caching:

\`\`\`bash
cast send <CONTRACT_ADDRESS> "opt_in_to_cache()" --private-key $DEPLOYER_PRIVATE_KEY
\`\`\`

## Resources

- [SmartCache Documentation](https://smartcache.gitbook.io/smartcache-docs)
- [stylus-cache-sdk on crates.io](https://crates.io/crates/stylus-cache-sdk)
- [Installation Guide](https://smartcache.gitbook.io/smartcache-docs/caching-strategies/rust-crate/installation)
`;
}
