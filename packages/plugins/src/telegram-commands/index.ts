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
        const composerDir = 'src/lib/telegram/composers';
        const apiDir = 'src/api/telegram';

        // Core Bot Client (shared gateway)
        this.addFile(output, `${libDir}/bot-client.ts`, this.generateBotClient(config));

        // Commands Composer
        this.addFile(output, `${composerDir}/commands.ts`, this.generateCommandsComposer(config));

        // Webhook Handler
        if (config.deliveryMethod === 'webhook') {
            this.addFile(output, `${apiDir}/webhook/route.ts`, this.generateWebhookHandler(config));
            this.addEnvVar(output, 'TELEGRAM_WEBHOOK_SECRET', 'Secret for webhook verification', { required: true, secret: true });
        }

        // Polling Script
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
      import { commandsComposer } from './composers/commands';
      /* @ts-ignore - AI composer might not exist yet */
      import { aiComposer } from './composers/ai-agent';

      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not defined');

      export const telegramBot = new Bot(token);

      // Register feature-specific composers
      telegramBot.use(commandsComposer);
      
      // AI Agent integration (if present)
      try {
        telegramBot.use(aiComposer);
      } catch (e) {
        // AI component missing, skipping
      }
    `);
    }

    private generateCommandsComposer(config: Config): string {
        const commandHandlers = config.commands.map(cmd => `
commandsComposer.command('${cmd}', async (ctx) => {
  await ctx.reply('Handled /${cmd} command!');
});
`).join('\n');

        const chatFlowLogic = config.chatFlowEnabled ? `
// Standard Chat Flow - Traditional message handling
commandsComposer.on('message:text', async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith('/')) return; // Ignore commands
  
  await ctx.reply(\`You said: \${text}. This is a standard chat response foundation.\`);
});
` : '';

        return dedent(`
      import { Composer } from 'grammy';

      export const commandsComposer = new Composer();

      ${commandHandlers}
      ${chatFlowLogic}
    `);
    }

    private generateWebhookHandler(config: Config): string {
        return dedent(`
      import { NextRequest, NextResponse } from 'next/server';
      import { webhookCallback } from 'grammy';
      import { telegramBot } from '@/lib/telegram/bot-client';

      const handleUpdate = webhookCallback(telegramBot, 'std/http');

      export async function POST(req: NextRequest) {
        try {
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

      async function main() {
        console.log('🤖 Starting Telegram bot in polling mode...');
        await telegramBot.start();
        console.log('✅ Bot is running!');
      }

      main().catch(console.error);
    `);
    }
}
