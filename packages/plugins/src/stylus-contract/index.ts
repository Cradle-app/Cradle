import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { StylusContractConfig } from '@dapp-forge/blueprint-schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COUNTER_CONTRACT_TEMPLATE_PATH = path.resolve(__dirname, '../../../../apps/web/src/components/counter-contract');
const CONTRACT_OUTPUT_DIR = 'counter-contract';

/**
 * Stylus Contract Plugin
 * Copies the counter-contract template folder and generates a markdown guide.
 * The user provides instructions for their contract logic; the markdown can be passed
 * to any LLM to generate code, then pasted into counter-contract/src/lib.rs.
 */
export class StylusContractPlugin extends BasePlugin<z.infer<typeof StylusContractConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'stylus-contract',
    name: 'Stylus Contract',
    version: '0.3.0',
    description: 'Counter template + markdown guide - pass to LLM, paste generated code into src/lib.rs',
    category: 'contracts',
    tags: ['rust', 'wasm', 'arbitrum', 'stylus', 'smart-contract', 'llm'],
  };

  readonly configSchema = StylusContractConfig as unknown as z.ZodType<z.infer<typeof StylusContractConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'contract-out',
      name: 'Contract Guide',
      type: 'output',
      dataType: 'any',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof StylusContractConfig>> {
    return {
      contractInstructions: 'Describe your contract logic here. For example: a simple counter with increment and decrement functions.',
      contractName: 'my-contract',
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    // Generate the comprehensive markdown guide (with folder structure + paste instructions)
    const markdownGuide = generateStylusContractGuide(config);
    this.addFile(
      output,
      `docs/STYLUS_CONTRACT_GUIDE.md`,
      markdownGuide,
      'docs'
    );

    // Copy the full counter-contract template folder
    if (fs.existsSync(COUNTER_CONTRACT_TEMPLATE_PATH)) {
      this.copyCounterContractTemplate(output, COUNTER_CONTRACT_TEMPLATE_PATH, CONTRACT_OUTPUT_DIR);
    } else {
      // Fallback: minimal template if counter-contract folder not found
      this.addFallbackTemplate(output, CONTRACT_OUTPUT_DIR);
    }

    // Add environment variables
    this.addEnvVar(output, 'DEPLOYER_PRIVATE_KEY', 'Private key for contract deployment', {
      required: true,
      secret: true,
    });
    this.addEnvVar(output, 'STYLUS_RPC_URL', 'Arbitrum RPC URL (default: Arbitrum Sepolia)', {
      required: false,
      defaultValue: 'https://sepolia-rollup.arbitrum.io/rpc',
    });

    // Add scripts (run from repo root)
    const contractPath = `contracts/${CONTRACT_OUTPUT_DIR}`;
    this.addScript(output, 'stylus:check', `cd ${contractPath} && cargo stylus check`);
    this.addScript(output, 'stylus:deploy', `cd ${contractPath} && cargo stylus deploy --private-key-path=./.env.key --endpoint="https://sepolia-rollup.arbitrum.io/rpc"`);

    context.logger.info(`Generated Stylus Contract: counter-contract template + STYLUS_CONTRACT_GUIDE.md`, {
      nodeId: node.id,
    });

    return output;
  }

  private copyCounterContractTemplate(output: CodegenOutput, sourcePath: string, outputDir: string): void {
    const skipDirs = new Set(['node_modules', 'target', '.git']);
    const skipFiles = new Set(['Cargo.lock']);

    const walk = (dir: string, relativePrefix: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = relativePrefix ? `${relativePrefix}/${item}` : item;
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!skipDirs.has(item)) {
            walk(fullPath, relativePath);
          }
        } else {
          if (!skipFiles.has(item)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const outputPath = `contracts/${outputDir}/${relativePath}`;
            this.addFile(output, outputPath, content);
          }
        }
      }
    };

    walk(sourcePath, '');
  }

  private addFallbackTemplate(output: CodegenOutput, outputDir: string): void {
    this.addFile(output, `contracts/${outputDir}/Cargo.toml`, `[package]
name = "counter-contract"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
stylus-sdk = "0.6"
alloy-primitives = "0.7"

[features]
export-abi = ["stylus-sdk/export-abi"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"
`);
    this.addFile(output, `contracts/${outputDir}/src/lib.rs`, COUNTER_TEMPLATE_CODE);
  }
}

// Counter template from stylus-hello-world (cargo stylus new)
const COUNTER_TEMPLATE_CODE = `//!
//! Stylus Hello World - Counter Template
//!
//! This is the default template from \`cargo stylus new\`.
//! **IMPORTANT**: Modify this contract according to the instructions in docs/STYLUS_CONTRACT_GUIDE.md
//! You can pass that markdown file to any LLM (ChatGPT, Claude, etc.) to generate your custom contract logic.
//!
#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use stylus_sdk::{alloy_primitives::U256, prelude::*};

sol_storage! {
    #[entrypoint]
    pub struct Counter {
        uint256 number;
    }
}

#[public]
impl Counter {
    pub fn number(&self) -> U256 {
        self.number.get()
    }

    pub fn set_number(&mut self, new_number: U256) {
        self.number.set(new_number);
    }

    pub fn increment(&mut self) {
        let number = self.number.get();
        self.set_number(number + U256::from(1));
    }
}
`;

function generateCounterCargoToml(contractName: string): string {
  const crateName = contractName.toLowerCase().replace(/-/g, '_');
  return `[package]
name = "${crateName}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
stylus-sdk = "0.6"
alloy-primitives = "0.7"

[features]
export-abi = ["stylus-sdk/export-abi"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"
`;
}

function generateContractSetupReadme(config: z.infer<typeof StylusContractConfig>): string {
  return `# Stylus Contract Setup

## Quick Start

1. Install cargo-stylus and the wasm target:
   \`\`\`bash
   cargo install cargo-stylus
   rustup target add wasm32-unknown-unknown
   \`\`\`

2. Check that your contract compiles and passes Stylus validation:
   \`\`\`bash
   pnpm stylus:check
   \`\`\`

3. Deploy (see docs/STYLUS_CONTRACT_GUIDE.md for full instructions):
   \`\`\`bash
   pnpm stylus:deploy
   \`\`\`

## Customizing This Contract

The \`src/lib.rs\` file contains the default Counter template. To implement your custom logic:

1. Open \`docs/STYLUS_CONTRACT_GUIDE.md\` - it contains your instructions and LLM guidance
2. Pass that file along with \`src/lib.rs\` to an LLM to generate your contract code
3. Replace the contents of \`src/lib.rs\` with the LLM output
4. Run \`pnpm stylus:check\` to verify
`;
}

function generateStylusContractGuide(config: z.infer<typeof StylusContractConfig>): string {
  const instructions = config.contractInstructions || 'No specific instructions provided.';

  return `# Stylus Contract Deployment & Development Guide

> Generated by Cradle - Web3 Foundation Builder

---

## Your Contract Instructions

The following describes how you want your Stylus Rust contract to work. **Pass this entire markdown file to any LLM** (ChatGPT, Claude, etc.) to generate your contract code. The LLM will return new Rust code. **Paste that code into \`contracts/counter-contract/src/lib.rs\`** to replace the template.

\`\`\`
${instructions}
\`\`\`

---

## Folder Structure (What You Have)

Your repo includes the \`contracts/counter-contract\` folder. You only need to update \`src/lib.rs\`:

\`\`\`
contracts/
└── counter-contract/
    ├── .cargo/
    │   └── config.toml      # Build config (no changes needed)
    ├── .env.example         # Copy to .env and add PRIV_KEY_PATH, RPC_URL
    ├── .gitignore
    ├── Cargo.toml           # Dependencies (no changes needed)
    ├── rust-toolchain.toml
    ├── src/
    │   ├── lib.rs           # ← PASTE YOUR LLM-GENERATED CONTRACT HERE
    │   └── main.rs          # Entrypoint (no changes needed)
    └── README.md

docs/
└── STYLUS_CONTRACT_GUIDE.md   # This file
\`\`\`

### Step-by-Step: Generate Your Contract

1. **Pass this markdown file** to an LLM (ChatGPT, Claude, etc.) along with the current \`counter-contract/src/lib.rs\` content
2. **Ask the LLM** to generate a new contract based on "Your Contract Instructions" above
3. **Copy the LLM output** (the complete Rust code)
4. **Paste it into** \`counter-contract/src/lib.rs\`, replacing the entire file
5. **Verify** with \`pnpm stylus:check\`
6. **Deploy** with \`pnpm stylus:deploy\`

---

## Instructions for LLM

**Task**: Generate a complete Stylus Rust contract based on "Your Contract Instructions" above. The output will be pasted into \`contracts/counter-contract/src/lib.rs\`.

**Requirements**:
1. Replace the Counter logic with the contract logic described in "Your Contract Instructions"
2. Keep the Stylus SDK imports and \`sol_storage!\` / \`#[public]\` patterns
3. Ensure the contract compiles with \`cargo stylus check\`
4. Keep the compressed WASM under 24KB (see troubleshooting below)
5. Preserve \`#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]\`, \`#[entrypoint]\`, and \`#[public]\` / \`#[payable]\` attributes as needed
6. Include \`extern crate alloc\` and \`use stylus_sdk::prelude::*\`

**Output**: Return the complete \`lib.rs\` code ready to paste (no markdown code fences, no extra text).

---

## Deployment Steps

### 1. Prerequisites

\`\`\`bash
# Install Rust (if not installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install cargo-stylus
cargo install cargo-stylus

# Add WASM target
rustup target add wasm32-unknown-unknown
\`\`\`

### 2. Validate Contract

\`\`\`bash
cd counter-contract
cargo stylus check
\`\`\`

Success output:
\`\`\`
Contract succeeded Stylus onchain activation checks with Stylus version: 1
\`\`\`

### 3. Deploy to Arbitrum Sepolia (Testnet)

\`\`\`bash
cd contracts/counter-contract
cargo stylus deploy \\
  --private-key-path=/path/to/your/key.txt \\
  --endpoint="https://sepolia-rollup.arbitrum.io/rpc"
\`\`\`

### 4. Deploy to Arbitrum One (Mainnet)

\`\`\`bash
cd contracts/counter-contract
cargo stylus deploy \\
  --private-key-path=/path/to/your/key.txt \\
  --endpoint="https://arb1.arbitrum.io/rpc"
\`\`\`

### 5. Export ABI

\`\`\`bash
cd contracts/counter-contract
cargo stylus export-abi --output=./abi.json --json
\`\`\`

---

## Error Troubleshooting

### Contract Exceeds 24KB After Compression

**Error**: \`Contract exceeds 24KB after compression\` or similar size limit message.

**Cause**: Stylus contracts must fit within Ethereum's 24KB [code-size limit](https://ethereum.org/en/developers/tutorials/downsizing-contracts-to-fight-the-contract-size-limit/).

**Solutions**:
- Remove unused code and dependencies from \`Cargo.toml\`
- Use \`#[no_std]\` to avoid the Rust standard library
- Set \`opt-level = "z"\` or \`opt-level = "s"\` in \`[profile.release]\`
- Split logic across multiple smaller contracts
- See [Cargo Stylus OPTIMIZING_BINARIES.md](https://github.com/OffchainLabs/stylus-sdk-rs/blob/main/cargo-stylus/OPTIMIZING_BINARIES.md)

---

### max fee per gas less than block base fee

**Error**: \`Execution failed: {'code': -32000, 'message': 'failed with gas: max fee per gas less than block base fee'\`

**Cause**: The Arbitrum network (especially Sepolia testnet) is congested. Your gas price is too low.

**Solutions**:
- Wait and retry when the network is less congested
- Use a higher gas price (cargo stylus may not expose this directly - check for \`--gas-price\` or similar flags)
- Ensure you have sufficient ETH for gas on Arbitrum Sepolia (get testnet ETH from [faucet](https://docs.arbitrum.io/stylus/reference/testnet-information))
- Try deploying during off-peak hours

---

### binary exports reserved symbol / WASM Validation Errors

**Error**: \`binary exports reserved symbol stylus_ink_left\` or \`failed to parse contract\`

**Cause**: The WASM binary uses reserved symbols or invalid exports for Stylus.

**Solutions**:
- Ensure you're using a supported version of \`stylus-sdk\` (check [stylus-sdk-rs](https://github.com/OffchainLabs/stylus-sdk-rs))
- Don't manually export Stylus-internal symbols
- Run \`cargo stylus check\` to validate before deploying
- See [VALID_WASM.md](https://github.com/OffchainLabs/stylus-sdk-rs/blob/main/cargo-stylus/VALID_WASM.md)

---

### Activation Failures

**Error**: Contract deployment succeeds but activation fails.

**Solutions**:
- Verify with \`cargo stylus check\` first
- Ensure sufficient funds for both deploy and activate (two transactions)
- Check contract doesn't exceed size or feature limitations
- Verify RPC endpoint is correct and reachable

---

### Insufficient Funds

**Error**: Transaction reverted or insufficient balance.

**Solutions**:
- Get Arbitrum Sepolia testnet ETH from the [faucet](https://docs.arbitrum.io/stylus/reference/testnet-information)
- For mainnet, ensure your wallet has enough ETH on Arbitrum One

---

## Reference & Support

- **[Stylus by Example](https://stylus-by-example.org/)** – Code examples and tutorials
- **[Arbitrum Stylus Docs](https://docs.arbitrum.io/stylus/gentle-introduction)** – Official documentation
- **[Arbitrum Discord](https://discord.com/channels/585084330037084172/1146789176939909251)** – Stylus dev channel
- **[Arbitrum Stylus Telegram](https://t.me/arbitrum_stylus)** – Community chat
- **[Cargo Stylus README](https://github.com/OffchainLabs/stylus-sdk-rs/blob/main/cargo-stylus/README.md)** – CLI reference
- **[GitHub Issues](https://github.com/OffchainLabs/stylus-sdk-rs/issues)** – Report bugs

---

## Testnet Information

RPC endpoints, faucets, and chain IDs: [Arbitrum Stylus Testnet Info](https://docs.arbitrum.io/stylus/reference/testnet-information)
`;
}
