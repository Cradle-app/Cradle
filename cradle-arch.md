# 🔄 Complete Flow: Node Selection → GitHub Push

## Step 1: User Designs on Canvas (Frontend)

File: apps/web/src/store/blueprint.ts

- User drags nodes from the Palette onto the ReactFlow Canvas
- Each node drop calls addNode() which creates a BlueprintNode with unique ID
- User configures node properties in the Config Panel → updates stored in Zustand
- User connects nodes with edges to define dependencies

## Step 2: User Clicks Generate (Frontend)

File: apps/web/src/components/dialogs/generate-dialog.tsx

- User opens Generate Dialog, optionally enables GitHub repo creation
- handleGenerate() is called → first validates via /api/blueprints/validate
- Then calls /api/blueprints/generate/sync with blueprint JSON + GitHub token

## Step 3: API Route Proxies to Orchestrator

File: apps/web/src/app/api/blueprints/generate/sync/route.ts

- Extracts GitHub token from cradle_session cookie
- Forwards request to Orchestrator at ORCHESTRATOR_URL/blueprints/generate/sync
- Passes GitHub token in X-GitHub-Token header

## Step 4: Orchestrator Executes Blueprint

File: apps/orchestrator/src/engine/execution.ts

1. Validates blueprint against Zod schema
2. Creates in-memory filesystem (memfs)
3. Performs topological sort on nodes (respecting dependencies)
4. For each node, looks up its plugin from the registry
5. Calls plugin.generate() which returns files, envVars, and scripts
6. Writes generated files to in-memory filesystem

## Step 5: Plugin Generates Code

File: packages/plugins/src/stylus-contract/index.ts

Each plugin extends BasePlugin and implements generate(). For Stylus Contract:

- Generates contracts/{name}/Cargo.toml
- Generates contracts/{name}/src/lib.rs (main contract code)
- Generates contracts/{name}/tests/integration.rs
- Adds environment variables (STYLUS_RPC_URL, DEPLOYER_PRIVATE_KEY)
- Adds scripts (build:contract, test:contract, deploy:contract)

## Step 6: Generate Root Project Files

File: apps/orchestrator/src/engine/execution.ts (generateRootFiles function)

After all plugins run, the engine generates common project files:

- package.json - Monorepo config with all collected scripts
- README.md - Documentation with setup instructions
- .env.example - All collected environment variables
- .gitignore - Standard ignore patterns
- turbo.json - Turborepo configuration
- pnpm-workspace.yaml - Workspace configuration

## Step 7: Push to GitHub

File: apps/orchestrator/src/engine/github.ts

1. createRepo() - Creates repository via GitHub API (/user/repos)
2. commitFiles() - Uses Git Data API to push all files:
- Create blob for each file (POST /repos/{owner}/{repo}/git/blobs)
- Create tree from all blobs (POST /repos/{owner}/{repo}/git/trees)
- Create commit with tree (POST /repos/{owner}/{repo}/git/commits)
- Update branch reference (POST /repos/{owner}/{repo}/git/refs)
1. Returns repository URL to frontend

# 🔌 Available Plugins

- stylus-contract - Rust/WASM smart contracts for Arbitrum
- stylus-zk-contract - Zero-Knowledge proof contracts
- wallet-auth - WalletConnect, SIWE, social login
- x402-paywall - HTTP 402 payment endpoints
- erc8004-agent - AI agent registry integration
- eip7702-smart-eoa - Delegate EOA capabilities
- zk-primitives - Semaphore, range proofs, membership proofs
- arbitrum-bridge - L1-L2 bridging
- ipfs-storage - Decentralized storage
- repo-quality-gates - CI/CD, testing, linting

# 🔑 Key Files Reference

- Blueprint Store: apps/web/src/store/blueprint.ts
- Generate Dialog: apps/web/src/components/dialogs/generate-dialog.tsx
- API Route: apps/web/src/app/api/blueprints/generate/sync/route.ts
- Execution Engine: apps/orchestrator/src/engine/execution.ts
- GitHub Integration: apps/orchestrator/src/engine/github.ts
- Plugin SDK: packages/plugin-sdk/
- All Plugins: packages/plugins/src/

## How Fastify is Used in Cradle

File: apps/orchestrator/src/index.ts

```tsx
// Fastify initialization in Cradle
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

const fastify = Fastify({ logger: true });

// Register plugins
await fastify.register(cors, { origin: '*' });
await fastify.register(rateLimit, { max: 100, timeWindow: '1 minute' });

// Register routes with prefixes
await fastify.register(healthRoutes, { prefix: '/' });
await fastify.register(blueprintRoutes, { prefix: '/blueprints' });
await fastify.register(runsRoutes, { prefix: '/runs' });

// Start server
await fastify.listen({ port: 3000, host: '0.0.0.0' });
```