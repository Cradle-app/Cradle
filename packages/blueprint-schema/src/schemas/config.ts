import { z } from 'zod';

/**
 * Target blockchain network
 */
export const NetworkConfig = z.object({
  chainId: z.number().int().positive(),
  name: z.string(),
  rpcUrl: z.string().url().optional(),
  explorerUrl: z.string().url().optional(),
  isTestnet: z.boolean().default(false),
});
export type NetworkConfig = z.infer<typeof NetworkConfig>;

/**
 * Predefined networks
 */
export const PredefinedNetworks = {
  arbitrumOne: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    isTestnet: false,
  },
  arbitrumSepolia: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    isTestnet: true,
  },
  arbitrumStylus: {
    chainId: 23011913,
    name: 'Arbitrum Stylus Testnet',
    isTestnet: true,
  },
} as const;

/**
 * GitHub repository configuration
 */
export const GitHubConfig = z.object({
  owner: z.string().regex(/^[a-zA-Z0-9\-]+$/),
  repoName: z.string().regex(/^[a-zA-Z0-9\-_.]+$/),
  visibility: z.enum(['public', 'private']).default('private'),
  defaultBranch: z.string().default('main'),
  createPR: z.boolean().default(false),
  prTitle: z.string().max(100).optional(),
  prBody: z.string().max(5000).optional(),
});
export type GitHubConfig = z.infer<typeof GitHubConfig>;

/**
 * Project metadata
 */
export const ProjectMetadata = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).default('0.1.0'),
  author: z.string().max(100).optional(),
  license: z.enum(['MIT', 'Apache-2.0', 'GPL-3.0', 'UNLICENSED']).default('MIT'),
  keywords: z.array(z.string()).max(10).default([]),
});
export type ProjectMetadata = z.infer<typeof ProjectMetadata>;

/**
 * Blueprint-level configuration
 */
export const BlueprintConfig = z.object({
  project: ProjectMetadata,
  network: NetworkConfig,
  github: GitHubConfig.optional(),
  deployOnGenerate: z.boolean().default(false),
  generateDocs: z.boolean().default(true),
});
export type BlueprintConfig = z.infer<typeof BlueprintConfig>;

