import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { TelegramCommandsConfig } from '@dapp-forge/blueprint-schema';

type Config = z.infer<typeof TelegramCommandsConfig>;

/**
 * Telegram Commands Plugin
 * 
 * This plugin copies the pre-built @cradle/telegram-commands component to the generated project
 * and sets up the necessary environment variables for bot configuration.
 */
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

  /**
   * Path to the pre-built component package (relative to project root)
   * The orchestrator will copy this entire directory to the output
   */
  readonly componentPath = 'packages/components/telegram-commands';

  /**
   * Package name for the component
   */
  readonly componentPackage = '@cradle/telegram-commands';

  readonly ports: PluginPort[] = [
    {
      id: 'commands-out',
      name: 'Commands',
      type: 'output',
      dataType: 'config',
    },
  ];

  getDefaultConfig(): Partial<Config> {
    return {
      framework: 'grammy',
      deliveryMethod: 'webhook',
      commands: ['start', 'help'],
      rateLimitEnabled: true,
      chatFlowEnabled: false,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    // Environment Variables
    this.addEnvVar(output, 'TELEGRAM_BOT_TOKEN', 'Bot token from @BotFather', {
      required: true,
      secret: true
    });

    if (config.deliveryMethod === 'webhook') {
      this.addEnvVar(output, 'TELEGRAM_WEBHOOK_SECRET', 'Secret for webhook verification', {
        required: true,
        secret: true
      });
    }

    // Add helpful scripts
    if (config.deliveryMethod === 'polling') {
      this.addScript(
        output,
        'telegram:bot',
        'npx tsx scripts/telegram-bot.ts',
        'Start Telegram bot in polling mode'
      );
    }

    this.addScript(
      output,
      'telegram:setup',
      'echo "See packages/telegram-commands/README.md for setup instructions"',
      'Telegram bot setup instructions'
    );

    context.logger.info(`Generated Telegram commands setup`, {
      nodeId: node.id,
      deliveryMethod: config.deliveryMethod,
      commands: config.commands,
      framework: config.framework,
      componentPackage: this.componentPackage,
    });

    return output;
  }
}
