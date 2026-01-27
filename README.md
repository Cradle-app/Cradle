# 🌱 Cradle

**Build your Web3 foundation. Then vibe.**

Cradle is a visual foundation builder for Web3 projects. Instead of starting from a blank slate or vibecoding your entire architecture, define your project structure visually, generate structured, organized code, then fine-tune with AI tools like Cursor or Copilot.

## 🎯 The Vision

**Problem**: Starting a Web3 project often means either:
- Vibecoding from scratch with AI (chaotic, inconsistent architecture)
- Copy-pasting boilerplate and hoping for the best
- Spending days on scaffolding before writing actual logic

**Solution**: Cradle gives you the **structured foundation** your project needs:

1. **Design visually** - Drag components, connect dependencies, configure settings
2. **Generate foundation** - Get clean, structured and organized code
3. **Vibe from there** - Use Cursor/Copilot to add features on a solid base

```
┌─────────────────────────────────────────────────────────────┐
│  🎨 Visual Design  →  📦 Generate Code  →  ✨ AI Enhance    │
│                                                             │
│  "I want Stylus      "Here's your        "Now let's add    │
│   contracts with      organized           that custom       │
│   ZK proofs and       codebase with       feature with      │
│   wallet auth"        proper structure"   Cursor..."        │
└─────────────────────────────────────────────────────────────┘
```

## 🧩 Components

Build your foundation with Web3 building blocks:

### Smart Contracts (Arbitrum Stylus)
- **[@cradle/erc20-stylus](./packages/components/erc20-stylus)** - ERC-20 token with mintable, burnable, and pausable features.
- **[@cradle/erc721-stylus](./packages/components/erc721-stylus)** - ERC-721 NFT collection with enumerable, metadata, and batch minting support.
- **[@cradle/erc1155-stylus](./packages/components/erc1155-stylus)** - ERC-1155 multi-token standard with batch operations and supply tracking.

### AI & Trading
- **[@cradle/erc8004-agent](./packages/components/erc8004-agent)** - On-chain AI agent registry with ERC-8004 standard. Includes OpenRouter LLM integration and staking mechanism.
- **[@cradle/maxxit-lazy-trader](./packages/components/maxxit-lazy-trader)** - Wallet-based Telegram bot setup for automated trading. 4-step flow with Ostium agent generation.

### Infrastructure & Auth
- **Frontend Scaffold** - Complete Next.js Web3 app generator with wagmi + viem, RainbowKit wallet UI, Tailwind CSS,etc.
- **[@cradle/wallet-auth](./packages/components/wallet-auth)** - RainbowKit + wagmi wallet authentication with multi-chain support and WalletConnect v2 ready.
- **[@cradle/ostium-onect](./packages/components/ostium-onect)** - Trading setup for Ostium DEX. Handles delegation and USDC approvals seamlessly.

### Data & Analytics
- **[@cradle/onchain-activity](./packages/components/onchain-activity)** - Fetch wallet transaction history with category filtering (ERC-20/721/1155, contract interactions). Powered by Alchemy.

#### Dune Analytics - Blockchain Data Queries
Access blockchain data with 9 specialized plugins powered by Dune's data warehouse:
- **Dune Execute SQL** - Run custom SQL queries on blockchain data with performance optimization and React hooks.
- **Dune Token Price** - Real-time token prices across multiple chains.
- **Dune Wallet Balances** - Portfolio balances with USD valuations and NFT support.
- **Dune DEX Volume** - Trading volume and statistics with time-range filtering.
- **Dune NFT Floor** - NFT collection floor prices and marketplace statistics.
- **Dune Address Labels** - Human-readable labels for addresses (ENS, known wallets, protocols).
- **Dune Transaction History** - Comprehensive wallet transaction history with configurable limits.
- **Dune Gas Price** - Gas price analytics and statistics across networks.
- **Dune Protocol TVL** - Total Value Locked calculations for DeFi protocols.

### Market Intelligence
#### AIXBT Intelligence - AI-Powered Market Research
Integrate AI-driven market intelligence with 4 specialized plugins:
- **AIXBT Momentum** - Track social momentum and cluster convergence for crypto projects.
- **AIXBT Signals** - Real-time event signals and alerts for project activity.
- **AIXBT Indigo** - Conversational AI for market research and analysis.
- **AIXBT Observer** - Correlate on-chain activity with social signals for comprehensive insights.

### Superposition L3 Chain Blocks
Build on Superposition with specialized L3 integrations:

- **[@cradle/superposition-bridge](./packages/components/superposition-bridge)** - Bridge assets to Superposition L3 via Li.Fi cross-chain routing. Support for ETH, USDC, USDT from Arbitrum/Ethereum/Optimism/Base.
- **[@cradle/superposition-longtail](./packages/components/superposition-longtail)** - Longtail AMM DEX integration. 4x cheaper than Uniswap V3, built with Stylus. Includes utility mining rewards.
- **[@cradle/superposition-super-assets](./packages/components/superposition-super-assets)** - Yield-bearing wrapped tokens (sUSDC, sETH). Earn passive yield from holding + active rewards from using.
- **Superposition Thirdweb** - Deploy and interact with contracts using Thirdweb SDK. NFT drops, prebuilt contracts, gasless transactions.
- **Superposition Utility Mining** - Track and claim transaction-based rewards. Earn tokens by using the network.
- **Superposition Faucet** - Testnet token faucet for SPN, wSPN, CAT, and fUSDC with cooldown management.
- **Superposition Meow Domains** - .meow domain name resolution and metadata. Twitter, URL, avatar integration.

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/Cradle-app/Cradle.git
cd Cradle

# Install
pnpm install

# Build
pnpm build

# Run
pnpm dev
```

Open http://localhost:3001 and start building!

## 🔐 Authentication Flow

Cradle uses a dual authentication system to secure your workspace and enable code deployment:

1. **Wallet Authentication** - Connect your Web3 wallet (MetaMask, WalletConnect, etc.) to access the Cradle platform
2. **GitHub Authentication** - Connect your GitHub account to push generated code directly to your repositories

This ensures that:
- Your blueprints are securely tied to your wallet identity
- Generated code can be automatically pushed to your GitHub repos
- You maintain full ownership and control over your projects

## 🏗️ Architecture

```
cradle/
├── apps/
│   ├── web/                  # Next.js visual editor
│   └── orchestrator/         # Fastify code generation engine
├── packages/
│   ├── blueprint-schema/     # Zod schemas for blueprints
│   ├── plugin-sdk/           # Plugin development kit
│   └── plugins/              # All component plugins
└── examples/                 # Example blueprints
```

## 💡 How It Works

### Visual Builder
1. **Design** - Drag components from the palette onto the canvas
2. **Configure** - Click nodes to set properties (contract names, auth methods, etc.)
3. **Connect** - Link components to define dependencies
4. **Generate** - Click "Generate" to create your codebase
5. **Develop** - Open in Cursor/VS Code and build your features

### AI-Powered Workflow
- **💬 Chat with AI** - Describe your app in natural language and let AI suggest the right component architecture
- **🤖 Smart Generation** - AI analyzes your requirements and creates a complete blueprint with properly connected components
- **🎯 Iterative Refinement** - Continue the conversation to refine and adjust your architecture

### Import & Export
- **📥 Import JSON** - Load existing blueprints from JSON files to continue working or share with team
- **📤 Export JSON** - Save your blueprints as JSON for version control, backup, or collaboration

### Generated Code Structure
Cradle uses an intelligent path resolver to organize generated code into a clean repository structure:

```
your-project/
├── apps/
│   ├── web/                    # Frontend application (Next.js)
│   │   ├── src/
│   │   │   ├── app/           # Next.js app router pages
│   │   │   ├── components/    # React components
│   │   │   ├── hooks/         # React hooks (useTokenPrice, useWalletAuth, etc.)
│   │   │   ├── lib/           # Utilities & config (wagmi, chains, API clients)
│   │   │   └── types/         # TypeScript type definitions
│   │   ├── public/            # Static assets
│   │   └── package.json
│   └── api/                    # Backend application (optional)
│       └── src/
│           ├── routes/        # API route handlers
│           ├── services/      # Business logic
│           └── middleware/    # Express/Fastify middleware
├── contracts/                  # Smart contracts
│   ├── erc20-token/           # Individual contract folders
│       ├── src/              # Stylus Rust source
│       └── tests/            # Contract tests
├── docs/                       # Auto-generated documentation
└── shared/                     # Shared types across frontend/backend
```

**Intelligent Routing:**
- Frontend files automatically go to `apps/web/src/` with proper subdirectories
- Backend routes fallback to `apps/web/src/app/api/` if no backend scaffold
- Each plugin categorizes its outputs (hooks, components, lib, etc.)
- Contracts stay organized in individual folders under `contracts/`

## 🔧 What You Get

Each Cradle component is ready to use and includes:

- 🦀 **Rust/Stylus Contracts** - Smart contracts built with the Stylus Rust SDK and modern security patterns
- ⚛️ **React Hooks** - `useERC20Interactions`, `useAgentRegistry`, `useWalletAuth` and more
- � **TypeScript SDK** - Type-safe functions for all contract interactions
- 📝 **Comprehensive Docs** - Installation, deployment, API reference, and examples
- 🧪 **Testing Ready** - Integration examples for frontend
- � **Multi-Chain** - Arbitrum mainnet and Sepolia testnet support out of the box
- 📦 **NPM Ready** - Organized as publishable packages with proper dependencies

## 🎨 Design Philosophy

**Structure enables creativity.** 

The best AI-assisted development happens when you have:
- Clear file organization
- Consistent patterns
- Type safety
- Proper abstractions

Cradle gives you this foundation so your vibing sessions are productive, not chaotic.

## 🔒 Security

- Secrets are isolated and never committed
- Template injection is prevented
- Rate limiting on all endpoints
- Audit logging for compliance

---

**Cradle** - *Build your Web3 foundation. Then vibe.* ✨
