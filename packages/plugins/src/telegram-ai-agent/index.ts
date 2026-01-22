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
import { TelegramAIAgentConfig } from '@dapp-forge/blueprint-schema';

type Config = z.infer<typeof TelegramAIAgentConfig>;

export class TelegramAIAgentPlugin extends BasePlugin<Config> {
    readonly metadata: PluginMetadata = {
        id: 'telegram-ai-agent',
        name: 'Telegram AI Agent',
        version: '0.1.0',
        description: 'Conversational AI capabilities for Telegram via LLMs',
        category: 'telegram',
        tags: ['telegram', 'ai', 'agent', 'openai', 'anthropic'],
    };

    readonly configSchema = TelegramAIAgentConfig as unknown as z.ZodType<Config>;

    readonly ports: PluginPort[] = [
        {
            id: 'ai-out',
            name: 'AI Response',
            type: 'output',
            dataType: 'any',
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

        // AI Service - handles LLM provider logic
        this.addFile(output, `${libDir}/ai-service.ts`, this.generateAIService(config));

        // AI Composer - grammY middleware
        this.addFile(output, `${composerDir}/ai-agent.ts`, this.generateAIComposer(config));

        // Default Webhook Handler (if no commands node is present)
        this.addFile(output, `${apiDir}/webhook/route.ts`, this.generateWebhookHandler());

        // Env Vars
        this.addEnvVar(output, 'TELEGRAM_BOT_TOKEN', 'Bot token from @BotFather', { required: true, secret: true });

        // Add necessary dependencies (assumed to be handled by the user or an app-level plugin)
        if (config.provider === 'openai') {
            this.addEnvVar(output, 'OPENAI_API_KEY', 'API key for OpenAI', { secret: true });
        } else if (config.provider === 'anthropic') {
            this.addEnvVar(output, 'ANTHROPIC_API_KEY', 'API key for Anthropic', { secret: true });
        }

        return output;
    }

    private generateAIService(config: Config): string {
        return dedent(`
      import OpenAI from 'openai';

      export class AIAgentService {
        private openai: OpenAI;
        
        constructor() {
          this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });
        }

        async generateResponse(userMessage: string, history: any[] = []) {
          const response = await this.openai.chat.completions.create({
            model: '${config.model}',
            messages: [
              { role: 'system', content: \`${config.systemPrompt}\` },
              ...history,
              { role: 'user', content: userMessage }
            ],
            temperature: ${config.temperature},
          });

          return response.choices[0].message.content;
        }
      }

      export const aiAgentService = new AIAgentService();
    `);
    }

    private generateAIComposer(config: Config): string {
        return dedent(`
      import { Composer } from 'grammy';
      import { aiAgentService } from '../ai-service';

      export const aiComposer = new Composer();

      aiComposer.on('message:text', async (ctx) => {
        // Only handle if not a command (handled by command composer)
        if (ctx.message.text.startsWith('/')) return;

        await ctx.replyWithChatAction('typing');
        
        try {
          const response = await aiAgentService.generateResponse(ctx.message.text);
          await ctx.reply(response || "I'm not sure how to respond to that.");
        } catch (error) {
          console.error('AI generation error:', error);
          await ctx.reply('Sorry, I encountered an error while processing your request.');
        }
      });
    `);
    }

    private generateBotClient(config: Config): string {
        return dedent(`
      import { Bot } from 'grammy';
      /* @ts-ignore - Composer might not exist yet */
      import { commandsComposer } from './composers/commands';
      /* @ts-ignore - Composer might not exist yet */
      import { aiComposer } from './composers/ai-agent';

      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not defined');

      export const telegramBot = new Bot(token);

      // Safe registration of composers
      try {
        telegramBot.use(commandsComposer);
      } catch (e) {}

      try {
        telegramBot.use(aiComposer);
      } catch (e) {}
    `);
    }

    private generateWebhookHandler(): string {
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
}
