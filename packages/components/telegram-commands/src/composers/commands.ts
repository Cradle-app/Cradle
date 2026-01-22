/**
 * @cradle/telegram-commands
 * 
 * Base commands composer with default command handlers
 */

import { Composer, Context } from 'grammy';
import { DEFAULT_RESPONSES, type DefaultCommand } from '../constants';
import type { CommandHandler } from '../types';

/**
 * Create a commands composer with the specified commands enabled
 * 
 * @param enabledCommands - Array of command names to enable
 * @param customHandlers - Optional custom handlers to override defaults
 * @returns Configured Composer instance
 * 
 * @example
 * ```ts
 * const composer = createCommandsComposer(['start', 'help', 'balance']);
 * bot.use(composer);
 * ```
 */
export function createCommandsComposer(
    enabledCommands: DefaultCommand[],
    customHandlers?: Partial<Record<DefaultCommand, CommandHandler>>
): Composer<Context> {
    const composer = new Composer<Context>();

    for (const cmd of enabledCommands) {
        const handler = customHandlers?.[cmd] ?? getDefaultHandler(cmd);
        composer.command(cmd, handler);
    }

    return composer;
}

/**
 * Get the default handler for a command
 */
function getDefaultHandler(command: DefaultCommand): CommandHandler {
    return async (ctx) => {
        const response = DEFAULT_RESPONSES[command];
        await ctx.reply(response);
    };
}

/**
 * Create a start command handler with custom welcome message
 */
export function createStartHandler(welcomeMessage?: string): CommandHandler {
    return async (ctx) => {
        const message = welcomeMessage ?? DEFAULT_RESPONSES.start;
        await ctx.reply(message);
    };
}

/**
 * Create a help command handler with command list
 */
export function createHelpHandler(commands: DefaultCommand[]): CommandHandler {
    return async (ctx) => {
        const commandList = commands
            .map(cmd => `/${cmd}`)
            .join('\n');

        await ctx.reply(`📋 Available commands:\n\n${commandList}`);
    };
}

/**
 * Create a status command handler
 */
export function createStatusHandler(): CommandHandler {
    return async (ctx) => {
        const status = [
            '✅ Bot Status: Online',
            `📅 Time: ${new Date().toISOString()}`,
            `👤 User ID: ${ctx.from?.id ?? 'Unknown'}`,
        ].join('\n');

        await ctx.reply(status);
    };
}

/**
 * Pre-built composer with all default commands
 */
export const defaultCommandsComposer = createCommandsComposer([
    'start',
    'help',
    'status',
]);
