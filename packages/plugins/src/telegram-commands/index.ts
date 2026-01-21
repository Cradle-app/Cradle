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
import { TelegramCommandsConfig } from '@dapp-forge/blueprint-schema';

type Config = z.infer<typeof TelegramCommandsConfig>;

export class TelegramCommandsPlugin extends BasePlugin<Config> {
    readonly metadata: PluginMetadata = {
        id: 'telegram-commands',
        name: 'Telegram Commands',
        version: '0.1.0',
        description: 'Interactive Telegram command handling via webhooks or polling',
        category: 'telegram',
        tags: ['telegram', 'commands', 'webhooks', 'grammy'],
    };

    readonly configSchema = TelegramCommandsConfig as unknown as z.ZodType<Config>;

    readonly ports: PluginPort[] = [
        {
            id: 'commands-out',
            name: 'Commands',
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
        const apiDir = 'src/api/telegram';

        // Bot Client & Router
        this.addFile(output, `${libDir}/bot-client.ts`, this.generateBotClient(config));
        this.addFile(output, `${libDir}/command-router.ts`, this.generateCommandRouter(config));

        // Webhook Handler (if applicable)
        if (config.deliveryMethod === 'webhook') {
            this.addFile(output, `${apiDir}/webhook/route.ts`, this.generateWebhookHandler(config));
            this.addEnvVar(output, 'TELEGRAM_WEBHOOK_SECRET', 'Secret for webhook verification', { required: true, secret: true });
        }

        // Polling Script (if applicable)
        if (config.deliveryMethod === 'polling') {
            this.addFile(output, 'scripts/telegram-bot.ts', this.generatePollingScript(config));
        }

        // Env Vars
        this.addEnvVar(output, 'TELEGRAM_BOT_TOKEN', 'Bot token from @BotFather', { required: true, secret: true });

        return output;
    }

    private generateBotClient(config: Config): string {
        return dedent(`
      import { Bot } from 'grammy';

      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not defined');

      export const telegramBot = new Bot(token);
    `);
    }

    private generateCommandRouter(config: Config): string {
        const commandHandlers = config.commands.map(cmd => `
      bot.command('${cmd}', async (ctx) => {
        await ctx.reply('Handled /${cmd} command!');
      });
    `).join('\n');

        return dedent(`
      import { telegramBot as bot } from './bot-client';

      export function setupCommands() {
        ${commandHandlers}
        
        // Default message handler
        bot.on('message', async (ctx) => {
          await ctx.reply('I received your message!');
        });
      }
    `);
    }

    private generateWebhookHandler(config: Config): string {
        return dedent(`
      import { NextRequest, NextResponse } from 'next/server';
      import { webhookCallback } from 'grammy';
      import { telegramBot } from '@/lib/telegram/bot-client';
      import { setupCommands } from '@/lib/telegram/command-router';

      setupCommands();
      const handleUpdate = webhookCallback(telegramBot, 'std/http');

      export async function POST(req: NextRequest) {
        try {
          // Optional: Verify webhook secret header
          return await handleUpdate(req);
        } catch (error) {
          console.error('Webhook error:', error);
          return NextResponse.json({ error: 'Internal error' }, { status: 500 });
        }
      }
    `);
    }

    private generatePollingScript(config: Config): string {
        return dedent(`
      import { telegramBot } from '../src/lib/telegram/bot-client';
      import { setupCommands } from '../src/lib/telegram/command-router';

      async function main() {
        console.log('🤖 Starting Telegram bot in polling mode...');
        setupCommands();
        await telegramBot.start();
        console.log('✅ Bot is running!');
      }

      main().catch(console.error);
    `);
    }
}
