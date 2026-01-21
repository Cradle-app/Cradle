import { z } from 'zod';
import {
    BasePlugin,
    type PluginMetadata,
    type PluginPort,
    type CodegenOutput,
    type BlueprintNode,
    type ExecutionContext,
    dedent,
} from '@dapp-forge/plugin-sdk';
import { TelegramWalletLinkConfig } from '@dapp-forge/blueprint-schema';

type Config = z.infer<typeof TelegramWalletLinkConfig>;

export class TelegramWalletLinkPlugin extends BasePlugin<Config> {
    readonly metadata: PluginMetadata = {
        id: 'telegram-wallet-link',
        name: 'Telegram Wallet Link',
        version: '0.1.0',
        description: 'Bind Telegram profiles with Web3 wallets via signatures',
        category: 'telegram',
        tags: ['telegram', 'web3', 'identity', 'auth'],
    };

    readonly configSchema = TelegramWalletLinkConfig as unknown as z.ZodType<Config>;

    readonly ports: PluginPort[] = [
        {
            id: 'wallet-link-out',
            name: 'Wallet Link',
            type: 'output',
            dataType: 'config',
        },
    ];

    async generate(
        node: BlueprintNode,
        context: ExecutionContext
    ): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        const libDir = 'src/lib/telegram';
        const componentsDir = 'src/components/telegram';
        const hooksDir = 'src/hooks';

        // Verification Logic (Server-side)
        this.addFile(output, `${libDir}/link-service.ts`, this.generateLinkService(config));

        // UI Components & Hooks
        this.addFile(output, `${componentsDir}/TelegramLinkButton.tsx`, this.generateLinkButton());
        this.addFile(output, `${hooksDir}/useTelegramLink.ts`, this.generateLinkHook());

        // Env Vars
        this.addEnvVar(output, 'NEXT_PUBLIC_TELEGRAM_BOT_USERNAME', 'Your bot username (without @)', { required: true });

        return output;
    }

    private generateLinkService(config: Config): string {
        return dedent(`
      import { verifyMessage } from 'viem';
      // Import your DB client (Prisma/Drizzle) based on ${config.persistenceType}

      /**
       * Link a Telegram ID to a wallet address
       */
      export async function linkWalletToTelegram(
        telegramId: string,
        address: \`0x\${string}\`,
        signature: \`0x\${string}\`,
        nonce: string
      ) {
        const message = \`Link Telegram profile \${telegramId} with nonce \${nonce}\`;
        
        const isValid = await verifyMessage({
          address,
          message,
          signature,
        });

        if (!isValid) throw new Error('Invalid signature');

        // Logic to save to ${config.persistenceType}
        // Example: await db.telegramUser.upsert(...)
        
        return { success: true };
      }
    `);
    }

    private generateLinkButton(): string {
        return dedent(`
      'use client';

      import { useTelegramLink } from '@/hooks/useTelegramLink';
      import { Button } from '@/components/ui/button';

      export function TelegramLinkButton() {
        const { link, isLoading, isLinked } = useTelegramLink();

        return (
          <Button 
            onClick={link} 
            disabled={isLoading || isLinked}
            variant={isLinked ? "outline" : "default"}
          >
            {isLinked ? "✓ Linked to Telegram" : "Link Telegram Profile"}
          </Button>
        );
      }
    `);
    }

    private generateLinkHook(): string {
        return dedent(`
      import { useState } from 'react';
      import { useAccount, useSignMessage } from 'wagmi';

      /**
       * Hook for the wallet linking flow
       */
      export function useTelegramLink() {
        const { address } = useAccount();
        const { signMessageAsync } = useSignMessage();
        const [isLoading, setIsLoading] = useState(false);
        const [isLinked, setIsLinked] = useState(false);

        const link = async () => {
          if (!address) return alert('Please connect wallet first');
          
          setIsLoading(true);
          try {
            // 1. Get auth parameters from Telegram (e.g., via Widget or deep link)
            const telegramId = 'USER_ID_FROM_CONTEXT'; 
            const nonce = Math.random().toString(36).substring(7);
            
            // 2. Sign message
            const message = \`Link Telegram profile \${telegramId} with nonce \${nonce}\`;
            const signature = await signMessageAsync({ message });

            // 3. Send to server
            const res = await fetch('/api/telegram/link', {
              method: 'POST',
              body: JSON.stringify({ telegramId, address, signature, nonce }),
            });

            if (res.ok) setIsLinked(true);
          } catch (error) {
            console.error('Linking failed:', error);
          } finally {
            setIsLoading(false);
          }
        };

        return { link, isLoading, isLinked };
      }
    `);
    }
}
