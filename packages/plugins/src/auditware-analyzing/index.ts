import { z } from 'zod';
import {
    BasePlugin,
    type PluginMetadata,
    type PluginPort,
    type CodegenOutput,
    type BlueprintNode,
    type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { AuditwareAnalyzingConfig } from '@dapp-forge/blueprint-schema';

/**
 * Auditware Analyzing Plugin
 * Security analysis using Radar static analysis tool
 */
export class AuditwareAnalyzingPlugin extends BasePlugin<z.infer<typeof AuditwareAnalyzingConfig>> {
    readonly metadata: PluginMetadata = {
        id: 'auditware-analyzing',
        name: 'Auditware Analyzer',
        version: '0.1.0',
        description: 'Security analysis with Radar for Rust smart contracts',
        category: 'contracts',
        tags: ['security', 'audit', 'radar', 'static-analysis'],
    };

    readonly configSchema = AuditwareAnalyzingConfig as unknown as z.ZodType<z.infer<typeof AuditwareAnalyzingConfig>>;

    readonly ports: PluginPort[] = [
        {
            id: 'contract-in',
            name: 'Contract Input',
            type: 'input',
            dataType: 'contract',
        },
        {
            id: 'report-out',
            name: 'Security Report',
            type: 'output',
            dataType: 'any',
        },
    ];

    getDefaultConfig(): Partial<z.infer<typeof AuditwareAnalyzingConfig>> {
        return {
            outputFormat: 'both',
            severityFilter: ['low', 'medium', 'high'],
            projectPath: '.',
        };
    }

    async generate(
        node: BlueprintNode,
        context: ExecutionContext
    ): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        // Generate Radar setup guide
        this.addFile(
            output,
            'docs/RADAR_SECURITY_ANALYSIS.md',
            generateRadarGuide(config)
        );

        // Generate install script
        this.addFile(
            output,
            'scripts/install-radar.sh',
            generateInstallScript()
        );

        // Generate analysis script
        this.addFile(
            output,
            'scripts/run-radar.sh',
            generateAnalysisScript(config)
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

        // Add scripts to package.json
        this.addScript(output, 'security:install', 'bash scripts/install-radar.sh');
        this.addScript(output, 'security:analyze', 'bash scripts/run-radar.sh');
        this.addScript(output, 'deploy:sepolia', 'bash scripts/deploy-sepolia.sh');
        this.addScript(output, 'deploy:mainnet', 'bash scripts/deploy-mainnet.sh');

        context.logger.info('Generated Auditware Radar analysis setup', {
            nodeId: node.id,
            outputFormat: config.outputFormat,
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
# Audited Contract ${networkName} Deployment Script
# This script deploys your security-analyzed Stylus contract to ${networkName}

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

# Check if Radar analysis was run
if [ ! -f "output.json" ]; then
    echo "⚠️  Warning: No Radar analysis output found (output.json)"
    echo "It's recommended to run security analysis before deployment:"
    echo "  pnpm security:analyze"
    echo ""
    read -p "Continue with deployment anyway? (y/N) " -n 1 -r
    echo
    if [[ ! \$REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
else
    echo "✅ Found Radar analysis output (output.json)"
    # Check for high severity issues
    if grep -q '"severity": "High"' output.json; then
        echo "⚠️  WARNING: High severity issues found in security analysis!"
        echo "Please review output.json before deploying to production."
        echo ""
        read -p "Continue with deployment anyway? (y/N) " -n 1 -r
        echo
        if [[ ! \$REPLY =~ ^[Yy]$ ]]; then
            echo "Deployment cancelled. Fix security issues first."
            exit 0
        fi
    fi
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

echo "Deploying the audited Stylus contract using cargo stylus..."
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

echo "🔒 Security-analyzed contract deployed successfully!"
echo "Transaction hash: $deployment_tx"

if [[ ! -z "$contract_address" ]]; then
    echo "Contract address: $contract_address"
fi

echo "Deployment completed successfully on ${networkName}!"
`;
}

function generateInstallScript(): string {
    return `#!/bin/bash
# Radar Installation Script
# Requires Docker to be installed and running

echo "🔍 Installing Radar by Auditware..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker."
    exit 1
fi

# Install Radar
curl -L https://raw.githubusercontent.com/auditware/radar/main/install-radar.sh | bash

echo "✅ Radar installed successfully!"
echo ""
echo "⚠️  IMPORTANT: Restart your terminal or run:"
echo "   source ~/.bashrc"
echo ""
echo "Then run: pnpm security:analyze"
`;
}

function generateAnalysisScript(config: z.infer<typeof AuditwareAnalyzingConfig>): string {
    return `#!/bin/bash
# Radar Security Analysis Script

echo "🔍 Running Radar security analysis..."
echo ""

# Check if radar is installed
if ! command -v radar &> /dev/null; then
    echo "❌ Radar is not installed. Run: pnpm security:install"
    exit 1
fi

# Run analysis
radar -p ${config.projectPath || '.'}

echo ""
echo "✅ Analysis complete!"
echo ""
echo "📄 Check output.json for detailed results."
`;
}

function generateRadarGuide(config: z.infer<typeof AuditwareAnalyzingConfig>): string {
    return `# Auditware Radar Security Analysis

## Overview

Radar by Auditware is a powerful static analysis tool designed to identify security vulnerabilities in Rust-based smart contracts. It uses a rule engine to detect common security issues like:

- **Unchecked arithmetic** - Integer overflow/underflow vulnerabilities
- **Missing access controls** - Functions without proper authorization
- **Account validation problems** - Improper address handling

## Prerequisites

⚠️ **Docker Required**: Radar requires Docker to be installed and running.

**Windows users**: Must use a WSL terminal.

## Installation

### Option 1: Using the Install Script

\`\`\`bash
pnpm security:install
\`\`\`

### Option 2: Manual Installation

\`\`\`bash
curl -L https://raw.githubusercontent.com/auditware/radar/main/install-radar.sh | bash
\`\`\`

Or install from source:

\`\`\`bash
git clone https://github.com/auditware/radar.git
cd radar
bash install-radar.sh
\`\`\`

**After installation**, restart your terminal or run:

\`\`\`bash
source ~/.bashrc
\`\`\`

## Running Analysis

### Using the Script

\`\`\`bash
pnpm security:analyze
\`\`\`

### Manual Execution

From your project root:

\`\`\`bash
radar -p .
\`\`\`

## Understanding Output

### Console Output

Real-time findings with severity levels:

\`\`\`
[ Low ] Unchecked Arithmetics found at:
 * /path/to/your/contract/src/lib.rs:49:34-44

[i] radar completed successfully. json results were saved to disk.
[i] Results written to /path/to/output.json
\`\`\`

### Severity Levels

| Level | Description |
|-------|-------------|
| **High** | Critical vulnerabilities requiring immediate attention |
| **Medium** | Significant issues that should be addressed |
| **Low** | Minor concerns or best practice violations |

### JSON Report

The \`output.json\` file contains detailed information:

\`\`\`json
{
  "findings": [
    {
      "severity": "Low",
      "title": "Unchecked Arithmetics",
      "location": "/src/lib.rs:49:34-44",
      "certainty": "high",
      "description": "..."
    }
  ]
}
\`\`\`

## Best Practices

1. **Run before deployment** - Always analyze before deploying to mainnet
2. **Fix high severity first** - Prioritize critical vulnerabilities
3. **Review low severity** - Even minor issues can compound
4. **Re-run after changes** - Verify fixes don't introduce new issues

## Resources

- [Radar GitHub Repository](https://github.com/auditware/radar)
- [Auditware Documentation](https://auditware.io)

---

💡 **Tip**: The JSON output contains detailed information about each check, including severity, certainty, and locations of issues. Review it carefully to understand what needs to be fixed.
`;
}
