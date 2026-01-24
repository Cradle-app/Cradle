/**
 * OpenRouter Client for ERC-8004 Agent
 *
 * A simple client for making LLM API calls via OpenRouter.
 * OpenRouter provides unified access to various LLM providers.
 *
 * @example
 * ```typescript
 * import { OpenRouterClient } from '@cradle/erc8004-agent';
 *
 * const client = new OpenRouterClient({
 *   apiKey: process.env.OPENROUTER_API_KEY!,
 *   model: 'openai/gpt-4o',
 * });
 *
 * const response = await client.chat([
 *   { role: 'user', content: 'Hello, world!' }
 * ]);
 * console.log(response.content);
 * ```
 *
 * You can use any model available on OpenRouter by specifying the model name.
 * See available models at: https://openrouter.ai/models
 *
 * Environment variables:
 * - OPENROUTER_API_KEY: Your OpenRouter API key (required)
 * - OPENROUTER_MODEL: Model to use (optional, defaults to config)
 */

export interface OpenRouterConfig {
    apiKey: string;
    model: string;
    baseUrl?: string;
    siteUrl?: string;
    siteName?: string;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatOptions {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stop?: string[];
}

export interface ChatResponse {
    content: string;
    model: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    id: string;
}

export interface OpenRouterError {
    code: string;
    message: string;
}

export class OpenRouterClient {
    private config: Required<Pick<OpenRouterConfig, 'apiKey' | 'model' | 'baseUrl'>>;
    private siteUrl?: string;
    private siteName?: string;

    constructor(config: OpenRouterConfig) {
        this.config = {
            apiKey: config.apiKey,
            model: config.model,
            baseUrl: config.baseUrl ?? 'https://openrouter.ai/api/v1',
        };
        this.siteUrl = config.siteUrl;
        this.siteName = config.siteName;
    }

    async chat(
        messages: ChatMessage[],
        options: ChatOptions = {}
    ): Promise<ChatResponse> {
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
                ...(this.siteUrl && { 'HTTP-Referer': this.siteUrl }),
                ...(this.siteName && { 'X-Title': this.siteName }),
            },
            body: JSON.stringify({
                model: this.config.model,
                messages,
                max_tokens: options.maxTokens,
                temperature: options.temperature,
                top_p: options.topP,
                stop: options.stop,
            }),
        });

        if (!response.ok) {
            const error = await response.json() as { error?: OpenRouterError };
            throw new Error(
                error.error?.message ?? `OpenRouter API error: ${response.status}`
            );
        }

        const data = await response.json() as {
            id: string;
            model: string;
            choices: Array<{ message: { content: string } }>;
            usage: {
                prompt_tokens: number;
                completion_tokens: number;
                total_tokens: number;
            };
        };

        return {
            content: data.choices[0]?.message?.content ?? '',
            model: data.model,
            usage: {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
            },
            id: data.id,
        };
    }

    /**
     * Simple text completion helper
     */
    async complete(
        prompt: string,
        systemPrompt?: string,
        options?: ChatOptions
    ): Promise<string> {
        const messages: ChatMessage[] = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.chat(messages, options);
        return response.content;
    }

    /**
     * Get the current model
     */
    getModel(): string {
        return this.config.model;
    }

    /**
     * Set a new model
     */
    setModel(model: string): void {
        this.config.model = model;
    }
}

/**
 * Create an OpenRouter client from environment variables
 *
 * Required env vars:
 * - OPENROUTER_API_KEY
 *
 * Optional env vars:
 * - OPENROUTER_MODEL (defaults to 'openai/gpt-4o')
 * - OPENROUTER_BASE_URL
 */
export function createOpenRouterClient(
    overrides?: Partial<OpenRouterConfig>
): OpenRouterClient {
    const apiKey = overrides?.apiKey ?? process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    return new OpenRouterClient({
        apiKey,
        model: overrides?.model ?? process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o',
        baseUrl: overrides?.baseUrl ?? process.env.OPENROUTER_BASE_URL,
        siteUrl: overrides?.siteUrl,
        siteName: overrides?.siteName,
    });
}
