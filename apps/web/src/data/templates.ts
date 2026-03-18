/**
 * Blueprint template definitions.
 *
 * Each template describes a pre-configured canvas layout with core nodes,
 * edges, and (in a future commit) ghost nodes that users can click to activate.
 *
 * Node positions follow a left-to-right DAG layout:
 *   - Source/contract blocks on the left   (x: 100–250)
 *   - Middleware blocks in the centre       (x: 350–550)
 *   - Frontend / output blocks on the right (x: 650–850)
 *   - Vertical spacing ~130 px between rows
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateNode {
  type: string;
  position: { x: number; y: number };
  config?: Record<string, any>;
}

export interface TemplateEdge {
  /** Index into the nodes array (core edges) or combined [nodes...ghostNodes] array (ghost edges). */
  source: number;
  target: number;
}

export type TemplateCategory =
  | "contracts"
  | "defi"
  | "nft"
  | "ai"
  | "telegram"
  | "analytics"
  | "superposition"
  | "robinhood"
  | "payments"
  | "infrastructure";

export interface Template {
  id: string;
  name: string;
  description: string;
  /** Lucide icon name — mapped to a component in the modal. */
  icon: string;
  colorClass: string;
  category: TemplateCategory;
  tags: string[];
  /**
   * Mental-model explainer — a short paragraph explaining *why* the blocks are
   * connected the way they are and how a developer should think about
   * configuring each piece. Shown in the template modal and on the canvas.
   */
  explainer: string;
  /** Core blocks — always placed on canvas. */
  nodes: TemplateNode[];
  /** Core edges — indices reference nodes[]. */
  edges: TemplateEdge[];
  /** Ghost blocks — rendered as shimmer nodes the user can click to activate. */
  ghostNodes: TemplateNode[];
  /** Ghost edges — indices reference combined [...nodes, ...ghostNodes]. */
  ghostEdges: TemplateEdge[];
}

// ---------------------------------------------------------------------------
// Category metadata (used by the modal for filter tabs)
// ---------------------------------------------------------------------------

export const TEMPLATE_CATEGORIES: {
  id: TemplateCategory | "all";
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "contracts", label: "Contracts" },
  { id: "defi", label: "DeFi" },
  { id: "nft", label: "NFT" },
  { id: "ai", label: "AI / Agents" },
  { id: "telegram", label: "Telegram" },
  { id: "analytics", label: "Analytics" },
  { id: "superposition", label: "Superposition" },
  { id: "robinhood", label: "Robinhood" },
  { id: "payments", label: "Payments" },
  { id: "infrastructure", label: "Infra" },
];

// ---------------------------------------------------------------------------
// Templates
//
// Design principles:
//   1. Superposition = Stylus-native chain → Superposition templates include
//      stylus-contract + smartcache-caching + auditware-analyzing.
//   2. Every custom Stylus contract (stylus-contract, stylus-rust-contract,
//      stylus-zk-contract) is paired with smartcache-caching (cache warming)
//      and auditware-analyzing (Radar vulnerability scanner) as **core** blocks.
//   3. Pre-deployed Stylus contracts (erc20-stylus, erc721-stylus,
//      erc1155-stylus) can be used directly. smartcache + auditware are
//      offered as **ghost** suggestions for these unless a custom
//      stylus-contract is also present (in which case they are core).
//   4. Most templates include erc8004-agent-runtime + x402-paywall-api as
//      core or ghost blocks — current industry trend.
//   5. SmartCache reduces latency + gas costs by warming Stylus contract
//      caches. Auditware (Radar) finds vulnerabilities in written contracts.
//
// Layout: every template uses a topological left-to-right DAG layout.
//   - Nodes are assigned to tiers (columns) based on longest-path depth
//     from any root node in the edge graph.
//   - Column spacing: 300 px   (200 px node width + 100 px gap)
//   - Row spacing:    150 px   ( 90 px node height +  60 px gap)
//   - Ghost nodes are placed one tier after the last core tier.
//   - All edges flow strictly left-to-right.
// ---------------------------------------------------------------------------

export const TEMPLATES: Template[] = [
  // ── 1. Full Stack dApp ──────────────────────────────────────────────────
  // Flow: {contract, chainlink, erc1155} → {smartcache, auditware, frontend} → {wallet, rpc, dune}
  {
    id: "full-stack-dapp",
    name: "Full Stack dApp",
    description:
      "Stylus contract + Chainlink + ERC-1155 + SmartCache + Radar + Frontend + Dune Analytics — ERC tokens, agent + paywall ready via suggestions",
    icon: "Layout",
    colorClass: "success",
    category: "contracts",
    tags: ["Full Stack", "Stylus", "Chainlink", "Dune", "ERC-1155"],
    explainer:
      "A comprehensive startup stack: a Stylus contract core supported by Chainlink oracles and an ERC-1155 token. SmartCache optimizes performance, and Auditware (Radar) ensures security. The frontend provides the interface, while Dune Analytics tracks transactions. Wallet Auth and RPC Provider handle blockchain interactions. Ghost blocks suggest additional tokens, IPFS storage, or an AI agent.",
    nodes: [
      { type: "stylus-rust-contract", position: { x: 0, y: 150 } }, // 0  T0
      { type: "smartcache-caching", position: { x: 300, y: 0 } }, // 1  T1
      { type: "auditware-analyzing", position: { x: 300, y: 150 } }, // 2  T1
      { type: "frontend-scaffold", position: { x: 300, y: 300 } }, // 3  T1
      { type: "wallet-auth", position: { x: 600, y: 0 } }, // 4  T2
      { type: "rpc-provider", position: { x: 600, y: 150 } }, // 5  T2
      { type: "dune-transaction-history", position: { x: 600, y: 300 } }, // 6  T2
      {
        type: "chainlink-price-feed",
        position: { x: 0, y: 0 },
        config: { feedAddress: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612" },
      }, // 7  T0
      { type: "erc1155-stylus", position: { x: 0, y: 300 } }, // 8  T0
      { type: "openclaw-agent", position: { x: 900, y: 300 } }, // 9  T3
    ],
    edges: [
      { source: 3, target: 9 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 1 },
      { source: 0, target: 2 },
      { source: 0, target: 3 },
      { source: 1, target: 2 },
      { source: 3, target: 4 },
      { source: 3, target: 5 },
      { source: 3, target: 6 },
      { source: 0, target: 7 }, // contract -> chainlink
      { source: 8, target: 1 }, // erc1155 -> smartcache
    ],
    ghostNodes: [
      { type: "onchain-activity", position: { x: 900, y: 0 } }, // g0 (idx 10)
      { type: "ipfs-storage", position: { x: 900, y: 150 } }, // g1 (idx 11)
      {
        type: "pyth-oracle",
        position: { x: 900, y: 300 },
        config: {
          priceFeedId:
            "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
        },
      }, // g2 (idx 12)
      { type: "erc20-stylus", position: { x: 0, y: 450 } }, // g3 (idx 13)
      { type: "erc721-stylus", position: { x: 0, y: 600 } }, // g4 (idx 14)
    ],
    ghostEdges: [
      { source: 4, target: 10 }, // wallet-auth → onchain-activity
      { source: 0, target: 11 }, // contract → ipfs-storage
      { source: 0, target: 12 }, // contract → pyth-oracle
      { source: 13, target: 1 }, // erc20 → smartcache
      { source: 14, target: 1 }, // erc721 → smartcache
    ],
  },

  // ── Maxxit DAPP Starter ────────────────────────────────────────────────
  // Flow: wallet-auth → maxxit → frontend-scaffold
  //       Ghost: ostium-trading, telegram-ai-agent, telegram-commands, telegram-wallet-link, telegram-notifications, onchain-activity, dune-transaction-history
  {
    id: "maxxit-dapp-starter",
    name: "Maxxit dApp Starter",
    description:
      "Wallet-auth + Maxxit Lazy Trader + frontend scaffold + Telegram alerts — Ostium trading, bot blocks, onchain activity, and Dune analytics as suggestions",
    icon: "Coins",
    colorClass: "info",
    category: "defi",
    tags: ["Maxxit", "API", "Trading", "Starter"],
    explainer:
      "A focused starter stack for building apps around Maxxit Lazy Trader APIs. Wallet Auth provides a connected wallet identity, which feeds into the Maxxit block for agent setup and messaging. The frontend scaffold renders a Next.js dashboard wired to the Maxxit hooks and API routes. Telegram Notifications is included by default so your app can push user-facing alerts immediately. Ghost blocks suggest adding Ostium Trading for execution, a full Telegram bot suite (AI Agent, Commands, Wallet Link), Onchain Activity for audit trails, and Dune Transaction History for analytics.",
    nodes: [
      { type: "wallet-auth", position: { x: 0, y: 150 } }, // 0  T0
      { type: "maxxit", position: { x: 300, y: 150 } }, // 1  T1
      { type: "frontend-scaffold", position: { x: 600, y: 150 } }, // 2  T2
      { type: "telegram-notifications", position: { x: 900, y: 150 } }, // 3  T3
    ],
    edges: [
      { source: 0, target: 1 }, // wallet-auth → maxxit
      { source: 1, target: 2 }, // maxxit → frontend-scaffold
      { source: 2, target: 3 }, // frontend-scaffold → telegram-notifications
    ],
    ghostNodes: [
      { type: "telegram-wallet-link", position: { x: 0, y: 300 } }, // g0 (idx 4)
      { type: "onchain-activity", position: { x: 0, y: 450 } }, // g1 (idx 5)
      { type: "ostium-trading", position: { x: 1200, y: 150 } }, // g2 (idx 6)
      { type: "telegram-ai-agent", position: { x: 600, y: 300 } }, // g3 (idx 7)
      { type: "telegram-commands", position: { x: 900, y: 300 } }, // g4 (idx 8)
      { type: "dune-transaction-history", position: { x: 1200, y: 0 } }, // g5 (idx 9)
    ],
    ghostEdges: [
      { source: 0, target: 4 }, // wallet-auth → telegram-wallet-link
      { source: 0, target: 5 }, // wallet-auth → onchain-activity
      { source: 1, target: 6 }, // maxxit → ostium-trading
      { source: 2, target: 7 }, // frontend-scaffold → telegram-ai-agent
      { source: 7, target: 8 }, // telegram-ai-agent → telegram-commands
      { source: 7, target: 3 }, // telegram-ai-agent → telegram-notifications
      { source: 2, target: 9 }, // frontend-scaffold → dune-transaction-history
    ],
  },

  // ── 5. Agentic Trading Platform ─────────────────────────────────────────
  // Flow: wallet-auth → maxxit → ostium-trading → frontend-scaffold (with pyth/chainlink)
  {
    id: "agentic-trading-platform",
    name: "Agentic Trading Platform",
    description:
      "Ostium + Maxxit + Uniswap + AIXBT Signals + Oracles + On-chain Activity + frontend — Dune, IPFS, and Telegram as suggestions",
    icon: "Coins",
    colorClass: "warning",
    category: "defi",
    tags: ["Trading", "AI", "Oracles", "Uniswap", "Dune"],
    explainer:
      "An agentic trading platform that connects wallet authentication to automated trading strategies and on-chain activity tracking. Wallet-auth feeds into Maxxit for automation, which orchestrates trades through Ostium for leveraged perps and Uniswap for AMM swaps. AIXBT Signals provides intelligence. The frontend integrates with Pyth and Chainlink oracles. Ghost blocks suggest Dune DEX volume and Protocol TVL analytics for Ostium, IPFS for storage, and Telegram for notifications.",
    nodes: [
      { type: "wallet-auth", position: { x: 0, y: 150 } }, // 0  T0
      { type: "onchain-activity", position: { x: 0, y: 300 } }, // 1  T0
      { type: "maxxit", position: { x: 300, y: 150 } }, // 2  T1
      { type: "ostium-trading", position: { x: 600, y: 150 } }, // 3  T2
      { type: "uniswap-swap", position: { x: 600, y: 300 } }, // 4  T2
      { type: "frontend-scaffold", position: { x: 900, y: 150 } }, // 5  T3
      {
        type: "pyth-oracle",
        position: { x: 900, y: 0 },
        config: {
          priceFeedId:
            "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
        },
      }, // 6  T3
      {
        type: "chainlink-price-feed",
        position: { x: 900, y: 300 },
        config: { feedAddress: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612" },
      }, // 7  T3
      { type: "openclaw-agent", position: { x: 1200, y: 150 } }, // 8  T4
    ],
    edges: [
      { source: 5, target: 8 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 2 }, // wallet-auth → maxxit
      { source: 0, target: 1 }, // wallet-auth → onchain-activity
      { source: 2, target: 3 }, // maxxit → ostium-trading
      { source: 3, target: 5 }, // ostium-trading → frontend-scaffold
      { source: 3, target: 4 }, // ostium-trading → uniswap-swap
      { source: 6, target: 5 }, // pyth-oracle → frontend-scaffold
      { source: 7, target: 5 }, // chainlink-price-feed → frontend-scaffold
    ],
    ghostNodes: [
      { type: "ipfs-storage", position: { x: 300, y: 300 } }, // g0 (idx 9)
      { type: "telegram-notifications", position: { x: 900, y: 450 } }, // g1 (idx 10)
      { type: "dune-dex-volume", position: { x: 1200, y: 0 } }, // g2 (idx 11)
      { type: "dune-protocol-tvl", position: { x: 1200, y: 150 } }, // g3 (idx 12)
    ],
    ghostEdges: [
      { source: 2, target: 9 }, // maxxit → ipfs-storage
      { source: 5, target: 10 }, // frontend-scaffold → telegram-notifications
      { source: 3, target: 11 }, // ostium-trading → dune-dex-volume
      { source: 3, target: 12 }, // ostium-trading → dune-protocol-tvl
    ],
  },

  // ── 7. NFT Marketplace ─────────────────────────────────────────────────
  // Flow: {stylus, erc721, erc1155} → {smartcache, auditware, ipfs, frontend, dune-nft, sdk} → {wallet, chain-data}
  {
    id: "nft-marketplace",
    name: "NFT Marketplace",
    description:
      "Custom Stylus marketplace contract + ERC-721/1155 + SmartCache + Radar + IPFS + analytics + history — agent + paywall as suggestions",
    icon: "Image",
    colorClass: "accent-secondary",
    category: "nft",
    tags: ["NFT", "Stylus", "Marketplace", "Caching", "Radar"],
    explainer:
      "A custom Stylus marketplace contract handles listings, bids, and royalty splits — SmartCache reduces latency and gas costs by warming the marketplace contract cache, and Auditware (Radar) scans it for vulnerabilities. Pre-deployed ERC-721 and ERC-1155 (usable directly) handle NFT minting, with metadata pinned to IPFS. The frontend renders the marketplace UI with wallet auth, Dune NFT Floor tracks collection prices, chain-data indexes events, and Transaction History provides a full audit trail of activity.",
    nodes: [
      // { type: 'stylus-rust-contract', position: { x: 0, y: 0 } },            // 0  T0
      { type: "erc721-stylus", position: { x: 0, y: 340 } }, // 0  T0
      // { type: 'erc1155-stylus', position: { x: 0, y: 160 } },           // 2  T0
      { type: "smartcache-caching", position: { x: 360, y: -160 } }, // 1  T1
      { type: "auditware-analyzing", position: { x: 650, y: -160 } }, // 2  T1
      { type: "ipfs-storage", position: { x: 360, y: 320 } }, // 3  T1
      { type: "frontend-scaffold", position: { x: 360, y: 140 } }, // 4  T1
      { type: "dune-nft-floor", position: { x: 360, y: 600 } }, // 5  T1
      { type: "dune-transaction-history", position: { x: 360, y: 450 } }, // 6  T1
      { type: "wallet-auth", position: { x: 680, y: 40 } }, // 7  T2
      { type: "chain-data", position: { x: 700, y: 220 } }, // 8 T2
      { type: "openclaw-agent", position: { x: 960, y: 140 } }, // 9  T2
    ],
    edges: [
      { source: 4, target: 9 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 0, target: 3 },
      { source: 0, target: 4 },
      { source: 0, target: 5 },
      { source: 0, target: 6 },
      { source: 4, target: 7 },
      { source: 4, target: 8 },
    ],
    ghostNodes: [
      { type: "x402-paywall-api", position: { x: 900, y: 0 } }, // g0 (idx 10)
      { type: "erc8004-agent-runtime", position: { x: 900, y: 150 } }, // g1 (idx 11)
      { type: "repo-quality-gates", position: { x: 900, y: 300 } }, // g2 (idx 12)
    ],
    ghostEdges: [
      { source: 4, target: 10 }, // frontend → paywall
      { source: 4, target: 11 }, // frontend → agent
      { source: 0, target: 12 }, // stylus → quality-gates
    ],
  },

  // ── 14. Superposition Full Stack ────────────────────────────────────────
  // Flow: network → {frontend, bridge, longtail} | stylus → {auditware, frontend} | erc20 → {auditware, frontend} | frontend → {analytics, wallet, ipfs, onchain}
  {
    id: "superposition-full-stack",
    name: "Superposition Full Stack",
    description:
      "Superposition L3 + Stylus contract + ERC-20 + Radar + bridge + AMM + frontend + analytics — faucet, storage, onchain activity, and Meow domains as suggestions",
    icon: "Rocket",
    colorClass: "accent-secondary",
    category: "superposition",
    tags: ["Superposition", "Stylus", "L3", "Analytics"],
    explainer:
      "Superposition Network is the L3 chain — the Superposition Bridge handles L2↔L3 asset movement and Longtail AMM provides on-chain liquidity. The Stylus contract deploys natively on the network with an ERC-20 token alongside. Auditware (Radar) scans both the contract and the token for vulnerabilities. The frontend orchestrates interactions through wallet auth and integrates with Dune transaction history. Ghost blocks suggest Meow Domains for identity, a faucet for development, IPFS for storage, and on-chain activity tracking.",
    nodes: [
      { type: "superposition-network", position: { x: 0, y: 75 } }, // 0  T0
      { type: "stylus-rust-contract", position: { x: 300, y: 225 } }, // 1  T1
      { type: "erc20-stylus", position: { x: 600, y: 0 } }, // 2  T2
      { type: "auditware-analyzing", position: { x: 600, y: 150 } }, // 3  T2
      { type: "superposition-bridge", position: { x: 600, y: 300 } }, // 4  T2
      { type: "superposition-longtail", position: { x: 600, y: 450 } }, // 5  T2
      { type: "frontend-scaffold", position: { x: 900, y: 225 } }, // 6  T3
      { type: "dune-transaction-history", position: { x: 1200, y: 75 } }, // 7  T4
      { type: "wallet-auth", position: { x: 1200, y: 375 } }, // 8  T4
      { type: "openclaw-agent", position: { x: 1500, y: 225 } }, // 9  T5
    ],
    edges: [
      { source: 6, target: 9 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 4 },
      { source: 0, target: 5 },
      { source: 0, target: 6 },
      { source: 1, target: 3 },
      { source: 1, target: 6 },
      { source: 2, target: 3 },
      { source: 2, target: 6 },
      { source: 4, target: 6 },
      { source: 5, target: 6 },
      { source: 6, target: 7 },
      { source: 6, target: 8 },
    ],
    ghostNodes: [
      { type: "superposition-faucet", position: { x: 1500, y: 150 } }, // g0 (idx 10)
      { type: "superposition-meow-domains", position: { x: 1500, y: 300 } }, // g1 (idx 11)
      { type: "ipfs-storage", position: { x: 1200, y: 225 } }, // g2 (idx 12)
      { type: "onchain-activity", position: { x: 1200, y: 525 } }, // g3 (idx 13)
    ],
    ghostEdges: [
      { source: 0, target: 10 }, // network → faucet
      { source: 0, target: 11 }, // network → meow-domains
      { source: 6, target: 12 }, // frontend → ipfs
      { source: 6, target: 13 }, // frontend → onchain-activity
    ],
  },

  // ── 15. Superposition DeFi + AI ─────────────────────────────────────────
  // Flow: {network, stylus, agent} → {auditware, smartcache, longtail, bridge} → {dune-dex, frontend} → wallet
  {
    id: "superposition-defi-ai",
    name: "Superposition DeFi + AI",
    description:
      "Superposition L3 + Stylus contract + SmartCache + Radar + AMM + bridge + ERC-8004 agent + Dune DEX + RPC + chain data — faucet, super-assets, utility-mining as suggestions",
    icon: "Zap",
    colorClass: "warning",
    category: "superposition",
    tags: ["Superposition", "Stylus", "Caching", "Radar", "Agent"],
    explainer:
      "Superposition Network hosts both the Stylus contract and DeFi primitives. SmartCache reduces latency and gas costs by warming the contract cache for optimised reads, and Auditware (Radar) scans the contract for vulnerabilities. Longtail AMM and Bridge provide on-chain liquidity and cross-chain movement. The ERC-8004 agent automates DeFi strategies across these components, including interaction with Longtail. Dune DEX Volume, RPC, and chain-data feed analytics and connectivity. Ghost suggestions include the Super Assets yield layer and Utility Mining rewards.",
    nodes: [
      { type: "superposition-network", position: { x: 0, y: 0 } }, // 0  T0
      { type: "stylus-rust-contract", position: { x: 300, y: 150 } }, // 1  T1
      { type: "erc8004-agent-runtime", position: { x: 0, y: 300 } }, // 2  T0
      { type: "auditware-analyzing", position: { x: 600, y: 0 } }, // 3  T2
      { type: "smartcache-caching", position: { x: 600, y: 150 } }, // 4  T2
      { type: "superposition-longtail", position: { x: 600, y: 300 } }, // 5  T2
      { type: "superposition-bridge", position: { x: 600, y: 450 } }, // 6  T2
      { type: "dune-dex-volume", position: { x: 900, y: 0 } }, // 7  T3
      { type: "rpc-provider", position: { x: 900, y: 150 } }, // 8  T3
      { type: "chain-data", position: { x: 900, y: 300 } }, // 9  T3
      { type: "frontend-scaffold", position: { x: 900, y: 450 } }, // 10 T3
      { type: "wallet-auth", position: { x: 1200, y: 225 } }, // 11 T4
      { type: "openclaw-agent", position: { x: 1500, y: 450 } }, // 12 T5
    ],
    edges: [
      { source: 10, target: 12 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 1 },
      { source: 0, target: 6 },
      { source: 1, target: 3 },
      { source: 1, target: 4 },
      { source: 1, target: 10 },
      { source: 2, target: 5 },
      { source: 2, target: 10 },
      { source: 5, target: 7 },
      { source: 5, target: 10 },
      { source: 6, target: 10 },
      { source: 10, target: 8 },
      { source: 10, target: 9 },
      { source: 10, target: 11 },
    ],
    ghostNodes: [
      { type: "superposition-faucet", position: { x: 1500, y: 0 } }, // g0 (idx 13)
      { type: "superposition-super-assets", position: { x: 1500, y: 150 } }, // g1 (idx 14)
      { type: "superposition-utility-mining", position: { x: 1500, y: 300 } }, // g2 (idx 15)
    ],
    ghostEdges: [
      { source: 0, target: 13 }, // network → faucet
      { source: 5, target: 14 }, // longtail → super-assets
      { source: 10, target: 15 }, // frontend → utility-mining
    ],
  },

  // ── 9. AI Agent + Telegram Suite ────────────────────────────────────────
  // Flow: {agent, paywall, stylus} → {telegram-ai, commands, smartcache, auditware} → {notifications, wallet, frontend}
  {
    id: "ai-agent-telegram-suite",
    name: "AI Agent + Telegram Suite",
    description:
      "ERC-8004 agent + x402 paywall + Stylus contract + SmartCache + Radar + full Telegram bot suite + frontend — chain data + analytics as suggestions",
    icon: "Bot",
    colorClass: "accent-primary",
    category: "ai",
    tags: ["AI", "Agent", "Stylus", "Caching", "Radar"],
    explainer:
      "The ERC-8004 agent is the brain — the Stylus contract gives it direct on-chain execution power for triggering transactions and state changes. SmartCache reduces latency and gas costs by warming the contract cache for agent queries, and Auditware (Radar) scans the contract for vulnerabilities. Telegram AI Agent handles conversational interactions, Commands handles structured actions, and Notifications relay outputs. Wallet Link connects on-chain identity for execution. The x402 paywall gates premium features.",
    nodes: [
      { type: "erc8004-agent-runtime", position: { x: 0, y: 0 } }, // 0  T0
      // { type: 'x402-paywall-api', position: { x: 0, y: 150 } },         // 1  T0
      { type: "stylus-rust-contract", position: { x: 0, y: 300 } }, // 1  T0
      { type: "telegram-ai-agent", position: { x: 380, y: -160 } }, // 2  T1
      { type: "telegram-commands", position: { x: 380, y: 20 } }, // 3  T1
      { type: "smartcache-caching", position: { x: 380, y: 320 } }, // 4  T1
      { type: "auditware-analyzing", position: { x: 380, y: 460 } }, // 5  T1
      { type: "telegram-wallet-link", position: { x: 680, y: -220 } }, // 6  T1
      { type: "telegram-notifications", position: { x: 380, y: -280 } }, // 7  T2
      { type: "wallet-auth", position: { x: 380, y: 160 } }, // 8  T2
      { type: "frontend-scaffold", position: { x: 680, y: -80 } }, // 9  T2
      { type: "openclaw-agent", position: { x: 980, y: -80 } }, // 10 T3
    ],
    edges: [
      { source: 9, target: 10 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 2 },
      { source: 0, target: 3 },
      { source: 0, target: 7 },
      { source: 0, target: 8 },
      // { source: 1, target: 9 },
      { source: 1, target: 4 },
      { source: 1, target: 5 },
      { source: 1, target: 8 },
      { source: 2, target: 6 },
      { source: 2, target: 9 },
    ],
    ghostNodes: [
      { type: "chain-data", position: { x: 680, y: 150 } }, // g0 (idx 11)
      { type: "dune-wallet-balances", position: { x: 900, y: 0 } }, // g1 (idx 12)
      { type: "repo-quality-gates", position: { x: 900, y: 300 } }, // g2 (idx 13)
    ],
    ghostEdges: [
      { source: 9, target: 11 }, // frontend → chain-data
      { source: 9, target: 12 }, // frontend → dune-wallet-balances
      { source: 1, target: 13 }, // stylus → quality-gates
    ],
  },

  // ── 11. Trading Bot ─────────────────────────────────────────────────────
  // Flow: {stylus, ostium, maxxit, agent} → {smartcache, auditware, dune-dex, chain-data} → {telegram, frontend, wallet}
  {
    id: "trading-bot",
    name: "Trading Bot",
    description:
      "Custom Stylus vault contract + Ostium + Maxxit + SmartCache + Radar + ERC-8004 agent + Dune DEX + Telegram + RPC — paywall + token price as suggestions",
    icon: "CandlestickChart",
    colorClass: "warning",
    category: "ai",
    tags: ["Trading", "Stylus", "Caching", "Radar", "Agent"],
    explainer:
      "A custom Stylus vault contract holds funds and executes trades on-chain — SmartCache reduces latency and gas costs by warming the vault contract cache, and Auditware (Radar) scans it for vulnerabilities. Ostium executes leveraged perps, while Maxxit and the ERC-8004 agent orchestrate automated trade logic and direct contract interactions. Dune DEX Volume, RPC, and chain-data provide market depth and connectivity. Telegram AI Agent relays signals and accepts user commands.",
    nodes: [
      { type: "stylus-rust-contract", position: { x: 60, y: 0 } }, // 0  T0
      { type: "ostium-trading", position: { x: 80, y: 140 } }, // 1  T0
      { type: "maxxit", position: { x: -300, y: 300 } }, // 2  T0
      { type: "erc8004-agent-runtime", position: { x: -280, y: 540 } }, // 3  T1
      { type: "smartcache-caching", position: { x: 600, y: 0 } }, // 4  T2
      { type: "auditware-analyzing", position: { x: 600, y: 150 } }, // 5  T2
      { type: "dune-dex-volume", position: { x: 600, y: 300 } }, // 6  T2
      { type: "chain-data", position: { x: 600, y: 450 } }, // 7  T2
      { type: "frontend-scaffold", position: { x: 900, y: 150 } }, // 8  T3
      { type: "wallet-auth", position: { x: 1200, y: 0 } }, // 9  T4
      { type: "rpc-provider", position: { x: 1200, y: 150 } }, // 10 T4
      { type: "telegram-ai-agent", position: { x: 1200, y: 300 } }, // 11 T4
      { type: "openclaw-agent", position: { x: 1500, y: 150 } }, // 12 T5
    ],
    edges: [
      { source: 8, target: 12 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 4 },
      { source: 0, target: 5 },
      { source: 3, target: 0 },
      { source: 3, target: 1 },
      { source: 2, target: 1 },
      { source: 3, target: 11 },
      { source: 8, target: 9 },
      { source: 8, target: 10 },
      { source: 0, target: 8 },
      { source: 1, target: 8 },
      { source: 4, target: 8 },
      { source: 5, target: 8 },
      { source: 6, target: 8 },
      { source: 7, target: 8 },
      { source: 3, target: 8 },
    ],
    ghostNodes: [
      { type: "x402-paywall-api", position: { x: 1500, y: 0 } }, // g0 (idx 12)
      { type: "dune-token-price", position: { x: 1500, y: 150 } }, // g1 (idx 13)
      { type: "telegram-notifications", position: { x: 1500, y: 300 } }, // g2 (idx 14)
    ],
    ghostEdges: [
      { source: 8, target: 12 }, // frontend → paywall
      { source: 8, target: 13 }, // frontend → dune-token-price
      { source: 11, target: 14 }, // telegram-ai-agent → notifications
    ],
  },

  // ── 2. Multi-Token Platform ─────────────────────────────────────────────
  // Flow: {stylus, erc20, erc721, erc1155} → {smartcache, auditware, frontend, ipfs} → {wallet, chain-data}
  {
    id: "multi-token-platform",
    name: "Multi-Token Platform",
    description:
      "Custom Stylus governance contract + ERC-20/721/1155 pre-deployed tokens + SmartCache + Radar + IPFS — agent + paywall as suggestions",
    icon: "Layers",
    colorClass: "accent-secondary",
    category: "contracts",
    tags: ["Multi-Token", "Stylus", "Caching", "Radar", "Agent-Ready"],
    explainer:
      "A custom Stylus contract handles token governance and management logic alongside three pre-deployed token standards (ERC-20 fungible, ERC-721 NFT, ERC-1155 multi-token) that can be used directly without deployment. SmartCache reduces latency and gas costs by warming the custom contract cache, and Auditware (Radar) scans it for vulnerabilities. NFT metadata is pinned to IPFS. The frontend renders a unified token UI with wallet auth and chain-data indexing.",
    nodes: [
      { type: "stylus-rust-contract", position: { x: 0, y: 0 } }, // 0  T0
      { type: "erc20-stylus", position: { x: 0, y: 150 } }, // 1  T0
      { type: "erc721-stylus", position: { x: 0, y: 300 } }, // 2  T0
      { type: "erc1155-stylus", position: { x: 0, y: 450 } }, // 3  T0
      { type: "smartcache-caching", position: { x: 300, y: 0 } }, // 4  T1
      { type: "auditware-analyzing", position: { x: 300, y: 150 } }, // 5  T1
      { type: "frontend-scaffold", position: { x: 300, y: 300 } }, // 6  T1
      { type: "ipfs-storage", position: { x: 300, y: 450 } }, // 7  T1
      { type: "wallet-auth", position: { x: 600, y: 150 } }, // 8  T2
      { type: "chain-data", position: { x: 600, y: 300 } }, // 9  T2
      { type: "openclaw-agent", position: { x: 900, y: 300 } }, // 10 T3
    ],
    edges: [
      { source: 6, target: 10 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 4 },
      { source: 0, target: 5 },
      { source: 0, target: 6 },
      { source: 1, target: 6 },
      { source: 2, target: 6 },
      { source: 3, target: 6 },
      { source: 2, target: 7 },
      { source: 3, target: 7 },
      { source: 6, target: 8 },
      { source: 6, target: 9 },
    ],
    ghostNodes: [
      { type: "erc8004-agent-runtime", position: { x: 900, y: 0 } }, // g0 (idx 11)
      { type: "x402-paywall-api", position: { x: 900, y: 150 } }, // g1 (idx 12)
      { type: "repo-quality-gates", position: { x: 900, y: 300 } }, // g2 (idx 13)
    ],
    ghostEdges: [
      { source: 6, target: 11 }, // frontend → agent
      { source: 6, target: 12 }, // frontend → paywall
      { source: 0, target: 13 }, // stylus → quality-gates
    ],
  },

  // ── Robinhood Dapp ────────────────────────────────────────────────────────
  // Flow: {erc20, erc721, erc1155} → {auditware, frontend, robinhood-*} → {wallet, dune-tx}
  //       Ghost: onchain-activity, pyth, chainlink
  {
    id: "robinhood-dapp",
    name: "Robinhood Dapp",
    description:
      "Pre-deployed ERC-20/721/1155 Stylus tokens on Robinhood Chain wired into Auditware Radar and a frontend, with Robinhood network, deployment, and contracts plugins plus Dune transaction analytics. On-chain activity, Pyth, and Chainlink appear as ghost suggestions.",
    icon: "Banknote",
    colorClass: "accent-secondary",
    category: "robinhood",
    tags: ["Robinhood", "Tokens", "Analytics"],
    explainer:
      "Three pre-deployed Stylus token standards (ERC-20, ERC-721, and ERC-1155) represent the core assets on Robinhood Chain. Auditware (Radar) scans all token interactions for vulnerabilities, while the frontend orchestrates user flows. Robinhood Network wires RPC and chain config, Robinhood Contracts exposes typed addresses, and Robinhood Deployment generates deployment guides and scripts. Dune Transaction History powers analytics, while ghost nodes suggest adding on-chain activity tracking and Pyth/Chainlink price feeds.",
    nodes: [
      // Token layer
      { type: "erc20-stylus", position: { x: 0, y: 0 } }, // 0  T0
      { type: "erc721-stylus", position: { x: 0, y: 150 } }, // 1  T0
      { type: "erc1155-stylus", position: { x: 0, y: 300 } }, // 2  T0
      // Core infra + frontend
      { type: "auditware-analyzing", position: { x: 300, y: 75 } }, // 3  T1
      { type: "frontend-scaffold", position: { x: 300, y: 275 } }, // 4  T1
      // Robinhood plugins
      { type: "robinhood-network", position: { x: 300, y: 450 } }, // 5  T1
      { type: "robinhood-contracts", position: { x: 600, y: 450 } }, // 6  T2
      { type: "robinhood-deployment", position: { x: 900, y: 450 } }, // 7  T3
      // Analytics + auth
      { type: "wallet-auth", position: { x: 600, y: 150 } }, // 8  T2
      { type: "dune-transaction-history", position: { x: 600, y: 275 } }, // 9  T2
      { type: "openclaw-agent", position: { x: 900, y: 275 } }, // 10 T3
    ],
    edges: [
      { source: 4, target: 10 }, // frontend-scaffold → openclaw-agent
      // Tokens → Auditware and frontend
      { source: 0, target: 3 },
      { source: 1, target: 3 },
      { source: 2, target: 3 },
      { source: 0, target: 4 },
      { source: 1, target: 4 },
      { source: 2, target: 4 },
      // Robinhood plugins → frontend / contracts / deployment
      { source: 5, target: 4 }, // network → frontend
      { source: 6, target: 4 }, // contracts → frontend
      { source: 5, target: 6 }, // network → contracts
      { source: 6, target: 7 }, // contracts → deployment guide
      // Frontend → auth + analytics
      { source: 4, target: 8 },
      { source: 4, target: 9 },
    ],
    ghostNodes: [
      { type: "onchain-activity", position: { x: 900, y: 150 } }, // g0 (idx 11)
      { type: "pyth-oracle", position: { x: 900, y: 0 } }, // g1 (idx 12)
      { type: "chainlink-price-feed", position: { x: 900, y: 300 } }, // g2 (idx 13)
    ],
    ghostEdges: [
      { source: 8, target: 11 }, // wallet-auth → onchain-activity
      { source: 4, target: 12 }, // frontend → pyth-oracle
      { source: 4, target: 13 }, // frontend → chainlink-price-feed
    ],
  },

  // ── 3. ZK Privacy dApp ──────────────────────────────────────────────────
  // Flow: zk-contract → {zk-primitives, auditware, smartcache, frontend} → {wallet, chain-data}
  {
    id: "zk-privacy-dapp",
    name: "ZK Privacy dApp",
    description:
      "ZK Stylus contract + primitives + SmartCache + Radar audit, frontend, wallet, chain data — agent + paywall as suggestions",
    icon: "ShieldCheck",
    colorClass: "accent-primary",
    category: "contracts",
    tags: ["ZK", "Privacy", "Stylus", "Caching", "Radar"],
    explainer:
      "The ZK Stylus contract handles private state transitions — ZK Primitives provide the proof generation and verification logic it depends on. SmartCache reduces latency and gas costs by warming the contract cache so repeated proof verifications are cheaper. Auditware (Radar) scans the ZK contract for vulnerabilities before deployment. The frontend surfaces proof status and lets users interact through wallet auth, while chain-data indexes on-chain verification events.",
    nodes: [
      { type: "stylus-zk-contract", position: { x: 0, y: 225 } }, // 0  T0
      { type: "zk-primitives", position: { x: 300, y: 0 } }, // 1  T1
      { type: "auditware-analyzing", position: { x: 300, y: 150 } }, // 2  T1
      { type: "smartcache-caching", position: { x: 300, y: 300 } }, // 3  T1
      { type: "frontend-scaffold", position: { x: 300, y: 450 } }, // 4  T1
      { type: "wallet-auth", position: { x: 600, y: 150 } }, // 5  T2
      { type: "chain-data", position: { x: 600, y: 300 } }, // 6  T2
      { type: "openclaw-agent", position: { x: 900, y: 450 } }, // 7  T3
    ],
    edges: [
      { source: 4, target: 7 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 1 },
      { source: 0, target: 2 },
      { source: 0, target: 3 },
      { source: 0, target: 4 },
      { source: 4, target: 5 },
      { source: 4, target: 6 },
    ],
    ghostNodes: [
      { type: "erc8004-agent-runtime", position: { x: 900, y: 0 } }, // g0 (idx 8)
      { type: "x402-paywall-api", position: { x: 900, y: 150 } }, // g1 (idx 9)
      { type: "repo-quality-gates", position: { x: 900, y: 300 } }, // g2 (idx 10)
    ],
    ghostEdges: [
      { source: 4, target: 8 }, // frontend → agent
      { source: 4, target: 9 }, // frontend → paywall
      { source: 0, target: 10 }, // zk-contract → quality-gates
    ],
  },

  // ── 4. DeFi Dashboard ──────────────────────────────────────────────────
  // Flow: {aave, compound, uniswap} → {chainlink, pyth, frontend} → {wallet, rpc, chain-data}
  {
    id: "defi-dashboard",
    name: "DeFi Dashboard",
    description:
      "Aave, Compound, Uniswap + Chainlink/Pyth oracles, full frontend — agent + paywall ready for monetization",
    icon: "TrendingUp",
    colorClass: "success",
    category: "defi",
    tags: ["Aave", "Compound", "Uniswap", "Oracles", "Agent-Ready"],
    explainer:
      "Aave and Compound supply lending/borrowing data; Uniswap provides swap and liquidity data. Chainlink feeds reliable price data for Aave/Compound positions, while Pyth gives low-latency prices for Uniswap pairs. The frontend aggregates everything into a unified dashboard. Wallet auth, RPC, and chain-data handle connectivity and event indexing. Ghost blocks suggest an AI agent for automated position management or a paywall to monetise the dashboard.",
    nodes: [
      { type: "aave-lending", position: { x: 0, y: 0 } }, // 0  T0
      { type: "compound-lending", position: { x: 0, y: 150 } }, // 1  T0
      { type: "uniswap-swap", position: { x: 0, y: 300 } }, // 2  T0
      {
        type: "chainlink-price-feed",
        position: { x: 300, y: 0 },
        config: { feedAddress: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612" },
      }, // 3  T1 - ETH/USD on Arbitrum
      {
        type: "pyth-oracle",
        position: { x: 300, y: 150 },
        config: {
          priceFeedId:
            "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
        },
      }, // 4  T1 - ETH/USD on Arbitrum Sepolia
      { type: "frontend-scaffold", position: { x: 300, y: 300 } }, // 5  T1
      { type: "wallet-auth", position: { x: 600, y: 0 } }, // 6  T2
      { type: "rpc-provider", position: { x: 600, y: 150 } }, // 7  T2
      { type: "chain-data", position: { x: 600, y: 300 } }, // 8  T2
      { type: "openclaw-agent", position: { x: 900, y: 300 } }, // 9  T3
    ],
    edges: [
      { source: 5, target: 9 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 3 },
      { source: 1, target: 3 },
      { source: 2, target: 4 },
      { source: 0, target: 5 },
      { source: 1, target: 5 },
      { source: 2, target: 5 },
      { source: 5, target: 6 },
      { source: 5, target: 7 },
      { source: 5, target: 8 },
    ],
    ghostNodes: [
      { type: "erc8004-agent-runtime", position: { x: 900, y: 0 } }, // g0 (idx 10)
      { type: "x402-paywall-api", position: { x: 900, y: 150 } }, // g1 (idx 11)
      { type: "dune-dex-volume", position: { x: 900, y: 300 } }, // g2 (idx 12)
    ],
    ghostEdges: [
      { source: 5, target: 10 }, // frontend → agent
      { source: 5, target: 11 }, // frontend → paywall
      { source: 5, target: 12 }, // frontend → dune-dex-volume
    ],
  },

  // ── 6. Cross-Chain Bridge dApp ──────────────────────────────────────────
  // Flow: {bridge, chain-abstraction} → {frontend, wallet, rpc} → chain-data
  {
    id: "cross-chain-bridge",
    name: "Cross-Chain Bridge dApp",
    description:
      "Arbitrum bridge + chain abstraction, full frontend — agent + paywall + smart EOA as suggestions",
    icon: "ArrowLeftRight",
    colorClass: "accent-primary",
    category: "defi",
    tags: ["Bridge", "Cross-Chain", "Arbitrum", "Agent-Ready"],
    explainer:
      "The Arbitrum Bridge handles L1↔L2 asset transfers. Chain Abstraction wraps multi-chain complexity so the frontend presents a single unified bridging UI. Both connect to wallet auth and RPC for transaction signing. Chain-data indexes bridge events for status tracking. Ghost blocks suggest EIP-7702 smart EOA for gasless approvals and an AI agent for automated bridging strategies.",
    nodes: [
      { type: "arbitrum-bridge", position: { x: 0, y: 75 } }, // 0  T0
      { type: "chain-abstraction", position: { x: 0, y: 225 } }, // 1  T0
      { type: "frontend-scaffold", position: { x: 300, y: 0 } }, // 2  T1
      { type: "wallet-auth", position: { x: 300, y: 150 } }, // 3  T1
      { type: "rpc-provider", position: { x: 300, y: 300 } }, // 4  T1
      { type: "chain-data", position: { x: 600, y: 150 } }, // 5  T2
      { type: "openclaw-agent", position: { x: 900, y: 0 } }, // 6  T3
    ],
    edges: [
      { source: 2, target: 6 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 2 },
      { source: 0, target: 3 },
      { source: 0, target: 4 },
      { source: 1, target: 2 },
      { source: 1, target: 3 },
      { source: 2, target: 5 },
    ],
    ghostNodes: [
      { type: "erc8004-agent-runtime", position: { x: 900, y: 0 } }, // g0 (idx 7)
      { type: "x402-paywall-api", position: { x: 900, y: 150 } }, // g1 (idx 8)
      { type: "eip7702-smart-eoa", position: { x: 900, y: 300 } }, // g2 (idx 9)
    ],
    ghostEdges: [
      { source: 2, target: 7 }, // frontend → agent
      { source: 2, target: 8 }, // frontend → paywall
      { source: 1, target: 9 }, // chain-abstraction → eip7702
    ],
  },

  // ── 8. Intelligence-Driven NFT Platform ─────────────────────────────────
  // Flow: {stylus, erc721, aixbt-momentum, dune-wallet} → {smartcache, auditware, ipfs, signals, nft-floor} → {telegram, frontend} → wallet
  {
    id: "intelligence-nft-platform",
    name: "Intelligence-Driven NFT Platform",
    description:
      "Custom Stylus pricing contract + ERC-721 + SmartCache + Radar + IPFS + AIXBT intelligence + Dune analytics + Telegram — agent + paywall as suggestions",
    icon: "Activity",
    colorClass: "success",
    category: "nft",
    tags: ["NFT", "Stylus", "AIXBT", "Caching", "Radar"],
    explainer:
      "A custom Stylus contract handles dynamic NFT pricing and rarity scoring on-chain — SmartCache reduces latency and gas costs by warming the pricing contract cache, and Auditware (Radar) scans it for vulnerabilities. Pre-deployed ERC-721 (usable directly) mints NFTs with metadata on IPFS. AIXBT Momentum detects market trends feeding into Signals, which triggers Telegram alerts. Dune NFT Floor and Wallet Balances provide portfolio analytics. The frontend aggregates everything with wallet auth.",
    nodes: [
      { type: "stylus-rust-contract", position: { x: 0, y: 0 } }, // 0  T0
      { type: "erc721-stylus", position: { x: 0, y: 150 } }, // 1  T0
      { type: "aixbt-momentum", position: { x: 0, y: 300 } }, // 2  T0
      { type: "dune-wallet-balances", position: { x: 0, y: 450 } }, // 3  T0
      { type: "smartcache-caching", position: { x: 300, y: 0 } }, // 4  T1
      { type: "auditware-analyzing", position: { x: 300, y: 150 } }, // 5  T1
      { type: "ipfs-storage", position: { x: 300, y: 300 } }, // 6  T1
      { type: "aixbt-signals", position: { x: 300, y: 450 } }, // 7  T1
      { type: "dune-nft-floor", position: { x: 300, y: 600 } }, // 8  T1
      { type: "telegram-notifications", position: { x: 600, y: 0 } }, // 9  T2
      { type: "frontend-scaffold", position: { x: 600, y: 300 } }, // 10 T2
      { type: "wallet-auth", position: { x: 900, y: 300 } }, // 11 T3
      { type: "openclaw-agent", position: { x: 1200, y: 300 } }, // 12 T4
    ],
    edges: [
      { source: 10, target: 12 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 4 },
      { source: 0, target: 5 },
      { source: 0, target: 10 },
      { source: 1, target: 6 },
      { source: 1, target: 10 },
      { source: 1, target: 8 },
      { source: 2, target: 7 },
      { source: 7, target: 9 },
      { source: 8, target: 10 },
      { source: 3, target: 10 },
      { source: 2, target: 10 },
      { source: 10, target: 11 },
    ],
    ghostNodes: [
      { type: "erc8004-agent-runtime", position: { x: 1200, y: 0 } }, // g0 (idx 13)
      { type: "x402-paywall-api", position: { x: 1200, y: 150 } }, // g1 (idx 14)
      { type: "repo-quality-gates", position: { x: 1200, y: 300 } }, // g2 (idx 15)
    ],
    ghostEdges: [
      { source: 10, target: 13 }, // frontend → agent
      { source: 10, target: 14 }, // frontend → paywall
      { source: 0, target: 15 }, // stylus → quality-gates
    ],
  },

  // ── 10. AI Intelligence Hub ─────────────────────────────────────────────
  // Flow: momentum → signals → {indigo, observer, telegram} → {agent, chain-data} → frontend
  {
    id: "ai-intelligence-hub",
    name: "AI Intelligence Hub",
    description:
      "Full AIXBT suite + ERC-8004 agent + Telegram alerts + chain data + frontend — paywall + analytics as suggestions",
    icon: "Brain",
    colorClass: "accent-secondary",
    category: "ai",
    tags: ["AIXBT", "Intelligence", "Agent", "Telegram"],
    explainer:
      "AIXBT Momentum detects trending tokens and feeds Signals, which branches into Indigo (deep analysis) and Observer (market-wide scanning). Indigo drives the ERC-8004 agent for automated responses; Observer feeds chain-data for historical context. Signals also triggers Telegram alerts. Everything converges in the frontend dashboard. Ghost blocks suggest a paywall for premium signal access and Dune analytics for wallet-level insights.",
    nodes: [
      { type: "aixbt-momentum", position: { x: 0, y: 150 } }, // 0  T0
      { type: "aixbt-signals", position: { x: 250, y: 150 } }, // 1  T1
      { type: "aixbt-indigo", position: { x: 500, y: 0 } }, // 2  T2
      { type: "aixbt-observer", position: { x: 500, y: 150 } }, // 3  T2
      { type: "erc8004-agent-runtime", position: { x: 750, y: 0 } }, // 4  T3
      { type: "telegram-notifications", position: { x: 500, y: 300 } }, // 5  T2
      { type: "chain-data", position: { x: 750, y: 150 } }, // 6  T3
      { type: "frontend-scaffold", position: { x: 1000, y: 75 } }, // 7  T4
      { type: "openclaw-agent", position: { x: 1300, y: 75 } }, // 8  T5
    ],
    edges: [
      { source: 7, target: 8 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 1, target: 3 },
      { source: 2, target: 4 },
      { source: 1, target: 5 },
      { source: 3, target: 6 },
      { source: 0, target: 7 },
      { source: 4, target: 7 },
      { source: 6, target: 7 },
    ],
    ghostNodes: [
      { type: "x402-paywall-api", position: { x: 1300, y: 0 } }, // g0 (idx 9)
      { type: "dune-wallet-balances", position: { x: 1300, y: 150 } }, // g1 (idx 10)
      { type: "wallet-auth", position: { x: 1300, y: 300 } }, // g2 (idx 11)
    ],
    ghostEdges: [
      { source: 7, target: 9 }, // frontend → paywall
      { source: 7, target: 10 }, // frontend → dune-wallet-balances
      { source: 7, target: 11 }, // frontend → wallet-auth
    ],
  },

  // ── 12. Telegram-First dApp ─────────────────────────────────────────────
  // Flow: {tg-ai, erc20, dune-wallet, stylus} → {commands, notifs, wallet-link, agent, smartcache, auditware} → frontend → wallet
  {
    id: "telegram-first-dapp",
    name: "Telegram-First dApp",
    description:
      "Full Telegram bot + ERC-8004 agent + Custom Stylus contract + SmartCache + Radar + ERC-20 token + Dune analytics + RPC + Chain Data — paywall + quality gates as suggestions",
    icon: "MessageSquare",
    colorClass: "info",
    category: "telegram",
    tags: ["Telegram", "Stylus", "Caching", "Radar", "Agent"],
    explainer:
      "The Telegram AI Agent is the primary interface — feeding structured actions into the ERC-8004 brain. A custom Stylus contract handles on-chain logic, triggered by both AI decisions and manual Telegram commands. SmartCache and Radar ensure optimized performance and contract security. Chain-data indexes the outcomes of bot interactions, while the RPC provider handles transaction relay. Ghost blocks suggest gating features with a paywall or adding repo quality gates.",
    nodes: [
      { type: "telegram-ai-agent", position: { x: 0, y: 0 } }, // 0  T0
      { type: "erc20-stylus", position: { x: 0, y: 150 } }, // 1  T0
      { type: "dune-wallet-balances", position: { x: 0, y: 300 } }, // 2  T0
      { type: "stylus-rust-contract", position: { x: 0, y: 450 } }, // 3  T0
      { type: "telegram-commands", position: { x: 300, y: 0 } }, // 4  T1
      { type: "telegram-notifications", position: { x: 300, y: 150 } }, // 5  T1
      { type: "telegram-wallet-link", position: { x: 300, y: 300 } }, // 6  T1
      { type: "erc8004-agent-runtime", position: { x: 300, y: 450 } }, // 7  T1
      { type: "smartcache-caching", position: { x: 300, y: 600 } }, // 8  T1
      { type: "auditware-analyzing", position: { x: 300, y: 750 } }, // 9  T1
      { type: "frontend-scaffold", position: { x: 600, y: 300 } }, // 10 T2
      { type: "wallet-auth", position: { x: 900, y: 150 } }, // 11 T3
      { type: "rpc-provider", position: { x: 900, y: 300 } }, // 12 T3
      { type: "chain-data", position: { x: 900, y: 450 } }, // 13 T3
      { type: "openclaw-agent", position: { x: 1200, y: 300 } }, // 14 T4
    ],
    edges: [
      { source: 10, target: 14 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 4 },
      { source: 0, target: 5 },
      { source: 0, target: 6 },
      { source: 0, target: 7 },
      { source: 1, target: 10 },
      { source: 2, target: 10 },
      { source: 3, target: 8 },
      { source: 3, target: 9 },
      { source: 3, target: 10 },
      { source: 7, target: 3 },
      { source: 4, target: 3 },
      { source: 7, target: 10 },
      { source: 10, target: 11 },
      { source: 10, target: 12 },
      { source: 10, target: 13 },
      { source: 6, target: 11 },
    ],
    ghostNodes: [
      { type: "x402-paywall-api", position: { x: 1200, y: 0 } }, // g0 (idx 15)
      { type: "repo-quality-gates", position: { x: 1200, y: 300 } }, // g1 (idx 16)
    ],
    ghostEdges: [
      { source: 10, target: 15 }, // frontend → paywall
      { source: 3, target: 16 }, // stylus → quality-gates
    ],
  },

  // ── 13. Analytics Hub ──────────────────────────────────────────────────
  // Flow: {sql..labels} (2 cols of 4) → tx-history → frontend → wallet-auth
  //       Ghost: agent, paywall
  {
    id: "analytics-hub",
    name: "Analytics Hub",
    description:
      "All nine Dune analytics modules + frontend + wallet auth — agent and paywall as suggestions",
    icon: "BarChart3",
    colorClass: "accent-primary",
    category: "analytics",
    tags: ["Dune", "Analytics", "Full Suite", "Agent-Ready"],
    explainer:
      "Nine Dune modules cover every analytics angle: SQL for custom queries, Token Price and DEX Volume for market data, Wallet Balances and Address Labels for user profiling, NFT Floor for collections, Gas Price for cost estimation, Protocol TVL for DeFi health, and Transaction History for audit trails. Address Labels feeds into Transaction History for enriched data. Wallet Auth enables personalized analytics by connecting user wallets. Everything converges in the frontend. Ghost blocks suggest an agent for AI-powered query generation and automated reporting, and a paywall to monetise premium analytics tiers.",
    nodes: [
      { type: "dune-execute-sql", position: { x: 0, y: 0 } }, // 0  T0a
      { type: "dune-token-price", position: { x: 0, y: 150 } }, // 1  T0a
      { type: "dune-wallet-balances", position: { x: 0, y: 300 } }, // 2  T0a
      { type: "dune-dex-volume", position: { x: 0, y: 450 } }, // 3  T0a
      { type: "dune-nft-floor", position: { x: 300, y: 0 } }, // 4  T0b
      { type: "dune-gas-price", position: { x: 300, y: 150 } }, // 5  T0b
      { type: "dune-protocol-tvl", position: { x: 300, y: 300 } }, // 6  T0b
      { type: "dune-address-labels", position: { x: 300, y: 450 } }, // 7  T0b
      { type: "dune-transaction-history", position: { x: 600, y: 225 } }, // 8  T1
      { type: "frontend-scaffold", position: { x: 900, y: 225 } }, // 9  T2
      { type: "wallet-auth", position: { x: 1200, y: 225 } }, // 10 T3
      { type: "openclaw-agent", position: { x: 1500, y: 225 } }, // 11 T4
    ],
    edges: [
      { source: 9, target: 11 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 9 },
      { source: 1, target: 9 },
      { source: 2, target: 9 },
      { source: 3, target: 9 },
      { source: 4, target: 9 },
      { source: 5, target: 9 },
      { source: 6, target: 9 },
      { source: 7, target: 8 },
      { source: 8, target: 9 },
      { source: 9, target: 10 },
    ],
    ghostNodes: [
      { type: "erc8004-agent-runtime", position: { x: 1500, y: 75 } }, // g0 (idx 12)
      { type: "x402-paywall-api", position: { x: 1500, y: 225 } }, // g1 (idx 13)
    ],
    ghostEdges: [
      { source: 9, target: 12 }, // frontend → agent
      { source: 9, target: 13 }, // frontend → paywall
    ],
  },

  // ── 16. AI-Powered Paywall dApp ─────────────────────────────────────────
  // Flow: {paywall, erc20, agent, stylus} → {smartcache, auditware, frontend, dune-token} → {wallet, rpc}
  //       Ghost: telegram-ai, telegram-notifications, quality-gates, dune-sql
  {
    id: "ai-powered-paywall",
    name: "AI-Powered Paywall dApp",
    description:
      "x402 paywall + Custom Stylus subscription contract + SmartCache + Radar + ERC-20 + ERC-8004 agent + Dune token price — Telegram bot, quality gates, and custom analytics as suggestions",
    icon: "CreditCard",
    colorClass: "warning",
    category: "payments",
    tags: ["Paywall", "Stylus", "Caching", "Radar", "Agent"],
    explainer:
      "A custom Stylus subscription contract manages access tiers and payment streaming on-chain — SmartCache reduces latency and gas costs by warming the subscription contract cache, and Auditware (Radar) scans it for vulnerabilities. The x402 paywall gates API endpoints behind HTTP 402 micro-payments using the pre-deployed ERC-20 token. The ERC-8004 agent handles content decisions and payment verification. Dune Token Price monitors the payment token value. Ghost blocks suggest a Telegram bot for conversational AI and payment notifications, quality gates for CI/CD, and Dune SQL for custom revenue analytics.",
    nodes: [
      { type: "x402-paywall-api", position: { x: 0, y: 0 } }, // 0  T0
      { type: "erc20-stylus", position: { x: 0, y: 150 } }, // 1  T0
      { type: "erc8004-agent-runtime", position: { x: 0, y: 300 } }, // 2  T0
      { type: "stylus-rust-contract", position: { x: 0, y: 450 } }, // 3  T0
      { type: "smartcache-caching", position: { x: 300, y: 0 } }, // 4  T1
      { type: "auditware-analyzing", position: { x: 300, y: 150 } }, // 5  T1
      { type: "frontend-scaffold", position: { x: 300, y: 300 } }, // 6  T1
      { type: "dune-token-price", position: { x: 300, y: 450 } }, // 7  T1
      { type: "wallet-auth", position: { x: 600, y: 0 } }, // 8  T2
      { type: "rpc-provider", position: { x: 600, y: 150 } }, // 9  T2
      { type: "openclaw-agent", position: { x: 900, y: 300 } }, // 10 T3
    ],
    edges: [
      { source: 6, target: 10 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 6 },
      { source: 1, target: 6 },
      { source: 1, target: 7 },
      { source: 2, target: 6 },
      { source: 3, target: 4 },
      { source: 3, target: 5 },
      { source: 3, target: 6 },
      { source: 6, target: 8 },
      { source: 6, target: 9 },
    ],
    ghostNodes: [
      { type: "telegram-ai-agent", position: { x: 900, y: 0 } }, // g0 (idx 11)
      { type: "telegram-notifications", position: { x: 900, y: 150 } }, // g1 (idx 12)
      { type: "repo-quality-gates", position: { x: 900, y: 300 } }, // g2 (idx 13)
      { type: "dune-execute-sql", position: { x: 900, y: 450 } }, // g3 (idx 14)
    ],
    ghostEdges: [
      { source: 2, target: 11 }, // agent → telegram-ai
      { source: 11, target: 12 }, // telegram-ai → telegram-notifications
      { source: 3, target: 13 }, // stylus → quality-gates
      { source: 6, target: 14 }, // frontend → dune-execute-sql
    ],
  },

  // ── 17. EIP-7702 Smart Account ──────────────────────────────────────────
  // Flow: {eip7702, chain-abstraction} → {frontend, wallet} → rpc
  {
    id: "eip7702-smart-account",
    name: "EIP-7702 Smart Account",
    description:
      "Smart EOA + chain abstraction + frontend + wallet + RPC + Chain Data — agent, paywall, data insights and gas analytics as suggestions",
    icon: "KeyRound",
    colorClass: "info",
    category: "infrastructure",
    tags: ["EIP-7702", "Smart EOA", "Chain Abstraction", "Agent-Ready"],
    explainer:
      "The frontend serves as the primary gateway, orchestrating user interactions through wallet authentication, transaction relayers (RPC), and event indexing (Chain Data). Wallet authentication then upgrades the experience by leveraging EIP-7702 smart accounts and cross-chain abstraction protocols. Ghost blocks suggest extending the app with AI agents, monetization, or deep on-chain analytics.",
    nodes: [
      { type: "frontend-scaffold", position: { x: 0, y: 150 } }, // 0  T0
      { type: "wallet-auth", position: { x: 300, y: 0 } }, // 1  T1
      { type: "rpc-provider", position: { x: 300, y: 150 } }, // 2  T1
      { type: "chain-data", position: { x: 300, y: 300 } }, // 3  T1
      { type: "eip7702-smart-eoa", position: { x: 600, y: 50 } }, // 4  T2
      { type: "chain-abstraction", position: { x: 600, y: 150 } }, // 5  T2
      { type: "openclaw-agent", position: { x: 900, y: 150 } }, // 6  T3
    ],
    edges: [
      { source: 0, target: 6 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 1 },
      { source: 0, target: 2 },
      { source: 0, target: 3 },
      { source: 1, target: 4 },
      { source: 1, target: 5 },
    ],
    ghostNodes: [
      { type: "erc8004-agent-runtime", position: { x: 0, y: 450 } }, // g0 (idx 7)
      { type: "x402-paywall-api", position: { x: 300, y: 450 } }, // g1 (idx 8)
      { type: "dune-gas-price", position: { x: 600, y: 450 } }, // g2 (idx 9)
      { type: "onchain-activity", position: { x: 900, y: 100 } }, // g3 (idx 10)
      { type: "dune-wallet-balances", position: { x: 900, y: 250 } }, // g4 (idx 11)
    ],
    ghostEdges: [
      { source: 0, target: 7 }, // frontend → agent
      { source: 0, target: 8 }, // frontend → paywall
      { source: 0, target: 9 }, // frontend → dune-gas-price
      { source: 3, target: 10 }, // chain-data → onchain-activity
      { source: 3, target: 11 }, // chain-data → dune-wallet-balances
    ],
  },

  // ── 18. Web3 SaaS Starter ──────────────────────────────────────────────
  // Flow: {stylus, paywall} → {smartcache, auditware, frontend} → {wallet, rpc, dune-wallet}
  //       Ghost: agent, quality-gates, chain-data, tx-history, bridge, eip7702
  {
    id: "web3-saas-starter",
    name: "Web3 SaaS Starter",
    description:
      "Stylus contract + SmartCache + Radar + x402 paywall + Dune analytics + frontend — agent, quality gates, chain data, transaction history, bridge, and smart EOA as suggestions",
    icon: "Wrench",
    colorClass: "info",
    category: "contracts",
    tags: ["SaaS", "Stylus", "Paywall", "Radar", "Caching"],
    explainer:
      "The Stylus contract is your core business logic — SmartCache reduces latency and gas costs by warming the contract cache, and Auditware (Radar) scans it for vulnerabilities before deploy. The x402 paywall monetises API access to your contract. The frontend provides the SaaS dashboard with wallet auth, RPC for transactions, and Dune Wallet Balances for user analytics. Ghost blocks suggest an agent for automated workflows, quality gates for CI/CD, chain-data for on-chain event indexing, transaction history for payment audit trails, Arbitrum Bridge for asset onboarding, and EIP-7702 smart EOA for gasless user experience.",
    nodes: [
      { type: "stylus-rust-contract", position: { x: 0, y: 0 } }, // 0  T0
      { type: "smartcache-caching", position: { x: 300, y: 0 } }, // 1  T1
      { type: "auditware-analyzing", position: { x: 300, y: 150 } }, // 2  T1
      { type: "x402-paywall-api", position: { x: 0, y: 150 } }, // 3  T0
      { type: "frontend-scaffold", position: { x: 300, y: 300 } }, // 4  T1
      { type: "wallet-auth", position: { x: 600, y: 0 } }, // 5  T2
      { type: "rpc-provider", position: { x: 600, y: 150 } }, // 6  T2
      { type: "dune-wallet-balances", position: { x: 600, y: 300 } }, // 7  T2
      { type: "openclaw-agent", position: { x: 900, y: 300 } }, // 8  T3
    ],
    edges: [
      { source: 4, target: 8 }, // frontend-scaffold → openclaw-agent
      { source: 0, target: 1 },
      { source: 0, target: 2 },
      { source: 0, target: 4 },
      { source: 3, target: 4 },
      { source: 4, target: 5 },
      { source: 4, target: 6 },
      { source: 4, target: 7 },
    ],
    ghostNodes: [
      { type: "erc8004-agent-runtime", position: { x: 900, y: 0 } }, // g0 (idx 9)
      { type: "repo-quality-gates", position: { x: 900, y: 150 } }, // g1 (idx 10)
      { type: "chain-data", position: { x: 900, y: 300 } }, // g2 (idx 11)
      { type: "dune-transaction-history", position: { x: 1200, y: 0 } }, // g3 (idx 12)
      { type: "arbitrum-bridge", position: { x: 1200, y: 150 } }, // g4 (idx 13)
      { type: "eip7702-smart-eoa", position: { x: 1200, y: 300 } }, // g5 (idx 14)
    ],
    ghostEdges: [
      { source: 4, target: 9 }, // frontend → agent
      { source: 0, target: 10 }, // contract → quality-gates
      { source: 4, target: 11 }, // frontend → chain-data
      { source: 4, target: 12 }, // frontend → dune-transaction-history
      { source: 4, target: 13 }, // frontend → arbitrum-bridge
      { source: 5, target: 14 }, // wallet-auth → eip7702-smart-eoa
    ],
  },
];
