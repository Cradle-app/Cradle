# 🌱 Cradle

**Build your Web3 foundation. Then vibe.**

Cradle is a visual foundation builder for Web3 projects. Instead of starting from a blank slate or vibecoding your entire architecture, define your project structure visually, generate production-ready code, then fine-tune with AI tools like Cursor or Copilot.

![Cradle](https://via.placeholder.com/800x400/050508/00d4ff?text=Cradle+-+Web3+Foundation+Builder)

## 🎯 The Vision

**Problem**: Starting a Web3 project often means either:
- Vibecoding from scratch with AI (chaotic, inconsistent architecture)
- Copy-pasting boilerplate and hoping for the best
- Spending days on scaffolding before writing actual logic

**Solution**: Cradle gives you the **structured foundation** your project needs:

1. **Design visually** - Drag components, connect dependencies, configure settings
2. **Generate foundation** - Get clean, organized, production-ready code
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

Build your foundation with Web3-native building blocks:

### Contracts
- **Stylus Contract** - Rust/WASM smart contracts for Arbitrum
- **Stylus ZK Contract** - Privacy-preserving contracts with Zero-Knowledge proofs
- **EIP-7702 Smart EOA** - Delegate EOA capabilities for batching and sponsorship
- **ZK Primitives** - Membership proofs, range proofs, Semaphore integration

### Infrastructure
- **Wallet Auth** - WalletConnect v2, social login, SIWE, passkeys
- **RPC Provider** - Multi-provider configuration with failover
- **Arbitrum Bridge** - L1↔L2 bridging with retryable tickets
- **Chain Abstraction** - Unified multi-chain UX

### Data & Storage
- **Chain Data** - Token/NFT data via Alchemy, Moralis, or custom indexers
- **IPFS Storage** - Decentralized storage with Pinata or Web3.Storage

### AI & Payments
- **ERC-8004 Agent** - AI agents with on-chain registry integration
- **x402 Paywall** - HTTP 402 payment flow endpoints

### Quality
- **Quality Gates** - CI/CD, testing, linting, formatting, all configured

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/yourusername/cradle.git
cd cradle

# Install
pnpm install

# Build
pnpm build

# Run
pnpm dev
```

Open http://localhost:3001 and start building!

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

1. **Design** - Drag components from the palette onto the canvas
2. **Configure** - Click nodes to set properties (contract names, auth methods, etc.)
3. **Connect** - Link components to define dependencies
4. **Generate** - Click "Generate" to create your codebase
5. **Develop** - Open in Cursor/VS Code and build your features

## 🔧 What You Get

When you generate from Cradle, you receive:

- 📁 **Organized monorepo** with pnpm workspaces
- 🦀 **Stylus contracts** with proper Rust setup
- 🔐 **Auth configuration** ready to use
- 🌐 **API scaffolding** with types and schemas
- 🧪 **Test setup** with coverage
- 📝 **Documentation** based on your design
- 🚀 **CI/CD workflows** for GitHub Actions
- 📦 **Type-safe SDKs** generated from your contracts

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

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](./CONTRIBUTING.md).

## 📄 License

MIT License - build freely!

---

**Cradle** - *Structure first, then vibe* ✨
