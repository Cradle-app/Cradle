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
import { TelegramNotifyConfig } from '@dapp-forge/blueprint-schema';

type Config = z.infer<typeof TelegramNotifyConfig>;

export class TelegramNotificationsPlugin extends BasePlugin<Config> {
    readonly metadata: PluginMetadata = {
        id: 'telegram-notifications',
        name: 'Telegram Notifications',
        version: '0.1.0',
        description: 'Send-only Telegram integration for alerts and updates',
        category: 'telegram',
        tags: ['telegram', 'notifications', 'alerts'],
    };

    readonly configSchema = TelegramNotifyConfig as unknown as z.ZodType<Config>;

    readonly ports: PluginPort[] = [
        {
            id: 'notify-out',
            name: 'Notifications',
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

        // Notify Service
        this.addFile(output, `${libDir}/notify-service.ts`, this.generateNotifyService(config));

        // Message Templates
        this.addFile(output, `${libDir}/templates.ts`, this.generateTemplates(config));

        // Core Bot Client (send-only setup)
        this.addFile(output, `${libDir}/bot-client.ts`, this.generateBotClient());

        // Types
        this.addFile(output, `${libDir}/types.ts`, this.generateTypes());

        // Env Vars
        this.addEnvVar(output, 'TELEGRAM_BOT_TOKEN', 'Bot token from @BotFather', {
            required: true,
            secret: true,
        });

        return output;
    }

    private generateNotifyService(config: Config): string {
        return dedent(`
      import { telegramBot } from './bot-client';
      import { getTemplate } from './templates';
      import type { NotificationPayload } from './types';

      /**
       * Send a notification to a specific Telegram chat
       */
      export async function sendNotification(
        chatId: string | number,
        payload: NotificationPayload
      ) {
        const text = getTemplate(payload.type, payload.data);
        
        try {
          await telegramBot.api.sendMessage(chatId, text, {
            parse_mode: '${config.templateFormat}',
          });
          return { success: true };
        } catch (error) {
          console.error('Failed to send Telegram notification:', error);
          return { success: false, error };
        }
      }
    `);
    }

    private generateTemplates(config: Config): string {
        return dedent(`
      import type { NotificationType } from './types';

      /**
       * Get formatted message template
       */
      export function getTemplate(type: NotificationType, data: any): string {
        switch (type) {
          case 'transaction':
            return \`💸 <b>New Transaction</b>\\n\\nHash: \${data.hash}\\nValue: \${data.value} ETH\`;
          case 'price-alert':
            return \`📊 <b>Price Alert</b>\\n\\nAsset: \${data.symbol}\\nPrice: \${data.price}\`;
          default:
            return data.message || 'New notification';
        }
      }
    `);
    }

    private generateBotClient(): string {
        return dedent(`
      import { Bot } from 'grammy';

      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not defined');

      export const telegramBot = new Bot(token);
    `);
    }

    private generateTypes(): string {
        return dedent(`
      export type NotificationType = 
        | 'transaction' 
        | 'price-alert' 
        | 'whale-alert'
        | 'nft-activity'
        | 'defi-position'
        | 'governance'
        | 'contract-event'
        | 'custom';

      export interface NotificationPayload {
        type: NotificationType;
        data: any;
      }
    `);
    }
}
