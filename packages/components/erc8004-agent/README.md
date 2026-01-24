# @cradle/erc8004-agent

ERC-8004 Agent Registry integration package for Cradle. Provides utilities for on-chain agent registration and management.

## Features

- 🔗 On-chain agent registration via ERC-8004 standard
- ⚛️ React hooks for easy integration
- 🔐 Wallet connection support (viem/wagmi)
- 📊 Registration status tracking
- 💰 Staking management
- 🔄 Capability updates

## Installation

```bash
pnpm add @cradle/erc8004-agent
```

## Usage

### With React Hooks

```tsx
import { useAgentRegistry, CHAIN_IDS } from '@cradle/erc8004-agent';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';

function AgentRegistration() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: CHAIN_IDS['arbitrum'] });
  const { data: walletClient } = useWalletClient({ chainId: CHAIN_IDS['arbitrum'] });

  const registry = useAgentRegistry({
    publicClient,
    walletClient,
    network: 'arbitrum',
    userAddress: address,
  });

  const handleRegister = async () => {
    await registry.register({
      name: 'MyAgent',
      version: '0.1.0',
      capabilities: ['text-generation'],
    });
  };

  if (registry.status?.isRegistered) {
    const agent = registry.status.agentInfo;
    return (
      <div>
        <h3>Agent Registered ✓</h3>
        <p>Name: {agent?.name}</p>
        <p>Version: {agent?.version}</p>
        <p>Capabilities: {agent?.capabilities.join(', ')}</p>
        <p>Stake: {agent?.stake.toString()} wei</p>
      </div>
    );
  }

  return (
    <button 
      onClick={handleRegister}
      disabled={registry.txState.status === 'pending'}
    >
      {registry.txState.status === 'pending' ? 'Registering...' : 'Register Agent'}
    </button>
  );
}
```

### Core Functions

```typescript
import { 
  checkRegistration, 
  registerAgent,
  updateAgentCapabilities 
} from '@cradle/erc8004-agent';

// Check if an agent is registered
const status = await checkRegistration(publicClient, 'arbitrum', ownerAddress);

// Register a new agent
const result = await registerAgent(
  publicClient,
  walletClient,
  'arbitrum',
  {
    name: 'MyAgent',
    version: '0.1.0',
    capabilities: ['text-generation'],
  },
  parseEther('0.01') // Optional stake
);
```

## API Reference

### `useAgentRegistry(options)`

React hook for ERC-8004 registry interactions.

**Options:**
- `publicClient` - Viem PublicClient
- `walletClient` - Viem WalletClient (optional)
- `network` - 'arbitrum' or 'arbitrum-sepolia'
- `userAddress` - User's wallet address
- `registryAddress` - Optional custom registry address

**Returns:**
- `status` - Registration status and agent info
- `isLoading` - Loading state
- `error` - Error if any
- `txState` - Transaction state ('idle' | 'pending' | 'success' | 'error')
- `register(metadata, stakeAmount?)` - Register a new agent
- `updateCapabilities(capabilities)` - Update agent capabilities
- `addStake(amount)` - Add stake to agent
- `withdrawStake(amount)` - Withdraw stake
- `deactivate()` - Deactivate agent
- `reactivate()` - Reactivate agent
- `refetch()` - Refresh status

### Constants

```typescript
import { 
  CHAIN_IDS,           // { 'arbitrum': 42161, 'arbitrum-sepolia': 421614 }
  REGISTRY_CONTRACTS,  // Contract addresses per network
  REGISTRY_ABI,        // ERC-8004 registry ABI
  AGENT_CAPABILITIES,  // Available capabilities
  OPENROUTER_MODELS,   // Pre-configured OpenRouter models
  DEFAULT_MODEL,       // Default model ('openai/gpt-4o')
  DEFAULT_STAKE_AMOUNT // 0.01 ETH in wei
} from '@cradle/erc8004-agent';
```

## LLM Configuration (OpenRouter)

This package uses [OpenRouter](https://openrouter.ai) for LLM access, providing unified access to 100+ models from various providers.

### Setup

1. Get your API key from [openrouter.ai/keys](https://openrouter.ai/keys)
2. Set the environment variable:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

### Using the OpenRouter Client

```typescript
import { OpenRouterClient, createOpenRouterClient } from '@cradle/erc8004-agent';

// Option 1: Create from environment variables
const client = createOpenRouterClient();

// Option 2: Create with explicit config
const client = new OpenRouterClient({
  apiKey: process.env.OPENROUTER_API_KEY!,
  model: 'openai/gpt-4o',
});

// Make a chat completion
const response = await client.chat([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' },
]);
console.log(response.content);

// Simple completion helper
const answer = await client.complete('What is 2+2?');
```

### Configuring a Custom Model

You can use **any model** available on OpenRouter. Browse models at [openrouter.ai/models](https://openrouter.ai/models).

**Environment variable:**
```bash
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

**Or specify in code:**
```typescript
const client = new OpenRouterClient({
  apiKey: process.env.OPENROUTER_API_KEY!,
  model: 'meta-llama/llama-3.1-70b-instruct',
});
```

### Pre-configured Models

The following models are pre-configured in the dropdown:

| Model ID | Display Name |
|----------|--------------|
| `openai/gpt-4o` | GPT-4o |
| `openai/gpt-4o-mini` | GPT-4o Mini |
| `anthropic/claude-3.5-sonnet` | Claude 3.5 Sonnet |
| `anthropic/claude-3-haiku` | Claude 3 Haiku |
| `google/gemini-pro-1.5` | Gemini Pro 1.5 |
| `meta-llama/llama-3.1-70b-instruct` | Llama 3.1 70B |

## ERC-8004 Standard

This package implements the ERC-8004 standard for on-chain AI agent registration. Key features:

- **Agent Registration**: Register AI agents with metadata (name, version, capabilities)
- **Capability Attestation**: On-chain record of agent capabilities
- **Staking**: Stake ETH as commitment/collateral
- **Reputation Tracking**: Build reputation through successful interactions
- **Discoverability**: Other agents and applications can discover your agent