/**
 * AIXBT Intelligence Code Templates
 */

export const generateAIXBTClient = () => `
import axios from 'axios';

/**
 * AIXBT Intelligence Client
 * Powers market-aware dApps with social momentum and signal extraction.
 */
export class AIXBTClient {
  private client;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.aixbt.tech/v2',
      headers: {
        'x-api-key': apiKey,
      },
    });
  }

  /**
   * Fetch projects with high social momentum
   */
  async getTrendingProjects(limit = 10) {
    const response = await this.client.get('/projects', {
      params: { limit, sort: 'momentum_score:desc' },
    });
    return response.data.data;
  }

  /**
   * Fetch latest market signals
   */
  async getLatestSignals(categories?: string[]) {
    const response = await this.client.get('/signals', {
      params: { categories: categories?.join(',') },
    });
    return response.data.data;
  }

  /**
   * Get specific project details and signals
   */
  async getProjectDetails(projectId: string) {
    const response = await this.client.get(\`/projects/\${projectId}\`);
    return response.data.data;
  }
}
`;

export const generateIndigoIntegration = (config: any) => `
import { AIXBTClient } from './aixbt-client';

/**
 * AIXBT Indigo AI Research Assistant
 * Model: ${config.model}
 */
export async function generateResearchReport(topic: string, apiKey: string) {
  // Indigo uses agentic endpoints. If using x402, this would handle H-402 headers.
  // For basic REST access (if arranged):
  const response = await fetch('https://api.aixbt.tech/v2/indigo/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      query: topic,
      model: '${config.model}',
      systemPrompt: '${config.systemPrompt}',
    }),
  });

  if (response.status === 402) {
    throw new Error('AIXBT Indigo requires x402 payment. Please use the x402 client.');
  }

  const data = await response.json();
  return data.data.content;
}
`;

export const generateObserverLogic = (config: any) => `
import { AIXBTClient } from './aixbt-client';

/**
 * AIXBT Market Observer
 * Correlates on-chain wallet activity with AIXBT social signals.
 */
export async function observeMarket(wallets: string[], apiKey: string) {
  const client = new AIXBTClient(apiKey);
  
  // 1. Fetch latest signals
  const signals = await client.getLatestSignals();
  
  // 2. Filter for high-impact signals related to watched projects
  const alerts = signals.filter((s: any) => 
    s.minConvictionScore >= 0.8 && 
    (s.category === 'RISK_ALERT' || s.category === 'SOCIAL_CONVERGENCE')
  );

  return alerts;
}
`;

export const generateDocs = () => `
# AIXBT Intelligence Integration

This module provides access to AIXBT's market intelligence layer.

## Setup

1. Get your API Key from [aixbt.tech](https://aixbt.tech/settings/api-keys).
2. Add \`AIXBT_API_KEY\` to your \`.env\` file.

## Usage

### Fetching Trending Projects

\`\`\`typescript
import { AIXBTClient } from './src/intelligence/aixbt-client';

const client = new AIXBTClient(process.env.AIXBT_API_KEY);
const trending = await client.getTrendingProjects(5);
console.log('Top projects by momentum:', trending);
\`\`\`

### AI Research with Indigo

\`\`\`typescript
import { generateResearchReport } from './src/intelligence/indigo';

const report = await generateResearchReport(
  'Summarize the current sentiment for Arbitrum Stylus',
  process.env.AIXBT_API_KEY
);
console.log(report);
\`\`\`
`;
