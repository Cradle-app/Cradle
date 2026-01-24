import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { X402PaywallConfig } from '@dapp-forge/blueprint-schema';
import {
  generateServerCode,
  generatePaymentMiddleware,
  generateOpenAPISpec,
  generatePaymentTypes,
} from './templates';

/**
 * x402 Paywall API Plugin
 * Generates HTTP 402 payment flow endpoints with OpenAPI schema
 */
export class X402PaywallPlugin extends BasePlugin<z.infer<typeof X402PaywallConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'x402-paywall-api',
    name: 'x402 Paywall API',
    version: '0.1.0',
    description: 'Generate HTTP 402 payment endpoints with x402 protocol support',
    category: 'payments',
    tags: ['x402', 'http-402', 'payments', 'paywall', 'api'],
  };

  readonly configSchema = X402PaywallConfig as unknown as z.ZodType<z.infer<typeof X402PaywallConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'contract-in',
      name: 'Payment Contract',
      type: 'input',
      dataType: 'contract',
      required: false,
    },
    {
      id: 'api-out',
      name: 'API Endpoint',
      type: 'output',
      dataType: 'api',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof X402PaywallConfig>> {
    return {
      resourcePath: '/api/premium/resource',
      priceInWei: '1000000000000000', // 0.001 ETH
      currency: 'ETH',
      paymentTimeout: 300,
      receiptValidation: true,
      openApiSpec: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    // Generate payment types
    this.addFile(output, 'payment-types.ts', generatePaymentTypes(config), 'backend-types');

    // Generate payment middleware
    this.addFile(output, 'payment-middleware.ts', generatePaymentMiddleware(config), 'backend-middleware');

    // Generate API server code
    this.addFile(output, 'payment-server.ts', generateServerCode(config, context.config), 'backend-routes');

    // Generate OpenAPI spec if enabled
    if (config.openApiSpec) {
      const openApiContent = generateOpenAPISpec(config, context.config);
      this.addFile(output, 'x402-payment.yaml', openApiContent, 'docs');

      output.interfaces.push({
        name: 'X402PaymentAPI',
        type: 'openapi',
        content: openApiContent,
      });
    }

    // Add environment variables
    this.addEnvVar(output, 'PAYMENT_RECEIVER_ADDRESS', 'Ethereum address to receive payments', {
      required: true,
    });
    this.addEnvVar(output, 'PAYMENT_PRIVATE_KEY', 'Private key for signing receipts', {
      required: true,
      secret: true,
    });
    if (config.currency === 'CUSTOM' && config.customTokenAddress) {
      this.addEnvVar(output, 'PAYMENT_TOKEN_ADDRESS', 'Custom ERC-20 token address', {
        required: true,
        defaultValue: config.customTokenAddress,
      });
    }
    if (config.webhookUrl) {
      this.addEnvVar(output, 'PAYMENT_WEBHOOK_URL', 'Webhook URL for payment notifications', {
        required: false,
        defaultValue: config.webhookUrl,
      });
    }

    // Add scripts
    this.addScript(output, 'dev:api', 'tsx watch src/api/payments/server.ts', 'Start payment API in dev mode');
    this.addScript(output, 'build:api', 'tsc -p tsconfig.api.json', 'Build payment API');

    // Add documentation
    this.addDoc(
      output,
      'docs/payments/x402-integration.md',
      'x402 Payment Integration',
      generatePaymentDocs(config)
    );

    context.logger.info(`Generated x402 paywall API for ${config.resourcePath}`, {
      nodeId: node.id,
      currency: config.currency,
    });

    return output;
  }
}

function generatePaymentDocs(config: z.infer<typeof X402PaywallConfig>): string {
  return `# x402 Payment Integration

This document describes how to use the x402 payment protocol with your API.

## Overview

The x402 protocol enables HTTP-native payments using the \`402 Payment Required\` status code.

## Endpoint

- **Path**: \`${config.resourcePath}\`
- **Price**: ${BigInt(config.priceInWei).toString()} wei (${config.currency})
- **Timeout**: ${config.paymentTimeout} seconds

## Payment Flow

1. **Request Resource**: Client sends a request to the protected endpoint
2. **402 Response**: Server responds with payment requirements in headers
3. **Payment**: Client submits payment transaction on-chain
4. **Receipt**: Client sends receipt in \`X-Payment-Receipt\` header
5. **Verification**: Server verifies receipt and grants access

## Headers

### Request Headers

\`\`\`
X-Payment-Receipt: <base64-encoded-receipt>
\`\`\`

### Response Headers (402)

\`\`\`
X-Payment-Address: <receiver-address>
X-Payment-Amount: ${config.priceInWei}
X-Payment-Currency: ${config.currency}
X-Payment-Chain-ID: <chain-id>
X-Payment-Timeout: ${config.paymentTimeout}
\`\`\`

## Example Usage

\`\`\`typescript
import { createX402Client } from './sdk/x402-client';

const client = createX402Client({
  baseUrl: 'https://api.example.com',
  wallet: yourWallet,
});

// Automatically handles 402 responses
const response = await client.get('${config.resourcePath}');
\`\`\`

## Receipt Format

\`\`\`json
{
  "txHash": "0x...",
  "blockNumber": 12345678,
  "from": "0x...",
  "to": "0x...",
  "amount": "${config.priceInWei}",
  "timestamp": 1234567890
}
\`\`\`

${config.receiptValidation ? `
## Receipt Validation

Receipts are validated on-chain to ensure:
- Transaction exists and is confirmed
- Payment amount matches required amount
- Payment was sent to the correct address
- Transaction is within the timeout window
` : ''}

${config.webhookUrl ? `
## Webhooks

Payment events are sent to: \`${config.webhookUrl}\`

Webhook payload:
\`\`\`json
{
  "event": "payment.received",
  "receipt": { ... },
  "resource": "${config.resourcePath}",
  "timestamp": "2024-01-01T00:00:00Z"
}
\`\`\`
` : ''}
`;
}

