import { NextRequest, NextResponse } from 'next/server';
import { getAvailableNodeTypesContext } from '@/lib/ai-workflow-converter';

export const runtime = 'nodejs';

// System prompt for the AI
const SYSTEM_PROMPT = `You are a friendly Web3 application architect assistant for Cradle, a visual blueprint builder for Arbitrum dApps.

Your job is to help users design application architectures OR have helpful conversations.

IMPORTANT: First, determine the user's intent:

1. **CONVERSATIONAL** - If the user says hello, greetings, asks questions about you, asks for help, or isn't clearly describing something to build, respond conversationally with a JSON like:
{
  "type": "message",
  "content": "Your friendly response here. Ask what they'd like to build."
}

2. **BUILD REQUEST** - If the user describes an app, project, or system they want to create, design an architecture using the available components.

${getAvailableNodeTypesContext()}

For BUILD REQUESTS, respond with:
{
  "type": "workflow",
  "tools": [
    {
      "id": "tool_1",
      "type": "component_type_in_snake_case",
      "name": "Human Readable Name",
      "next_tools": ["tool_2"]
    }
  ],
  "description": "Brief description of the architecture",
  "has_sequential_execution": true
}

RULES FOR WORKFLOWS:
- Only use component types from the available list
- Use snake_case for type names (e.g., "wallet_auth", "stylus_contract")
- Keep architectures practical (3-8 components)
- Each tool needs a unique id

Examples of CONVERSATIONAL intents:
- "hello", "hi", "hey"
- "what can you do?"
- "help me"
- "how does this work?"

Examples of BUILD REQUEST intents:
- "NFT marketplace with wallet auth"
- "Market momentum dashboard with AIXBT"
- "Smart trading bot with Indigo research"
- "Project alert system using AIXBT signals"

For Intelligence-related requests, prioritize these components:
- aixbt_momentum: Use for market heat, trending projects, and cluster data.
- aixbt_signals: Use for real-time alerts (partnerships, whale activity).
- aixbt_indigo: Use for deep AI research and automated reporting.
- aixbt_observer: Use for correlating on-chain wallet activity with market sentiment.`;

interface AITool {
  id: string;
  type: string;
  name: string;
  next_tools: string[];
}

interface AIWorkflowResponse {
  type?: 'workflow';
  tools: AITool[];
  description: string;
  has_sequential_execution: boolean;
}

interface AIMessageResponse {
  type: 'message';
  content: string;
}

type AIResponse = AIWorkflowResponse | AIMessageResponse;

// Parse AI response to extract JSON
function parseAIResponse(content: string): AIResponse | null {
  try {
    // Try to parse the entire content as JSON first
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // Continue to next attempt
      }
    }

    // Try to find JSON object in the content
    const jsonObjectMatch = content.match(/\{[\s\S]*("type"|"tools")[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        return JSON.parse(jsonObjectMatch[0]);
      } catch {
        // Continue to next attempt
      }
    }

    return null;
  }
}

// Check if query is conversational (greeting, help, etc.)
function isConversationalQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase().trim();

  // Common greetings
  const greetings = ['hello', 'hi', 'hey', 'hola', 'howdy', 'greetings', 'good morning', 'good afternoon', 'good evening', 'sup', 'yo', 'hii', 'hiii', 'heya', 'heyo'];
  if (greetings.some(g => lowerQuery === g || lowerQuery.startsWith(g + ' ') || lowerQuery.startsWith(g + '!'))) {
    return true;
  }

  // Help/question patterns
  const helpPatterns = [
    'what can you do',
    'how do you work',
    'how does this work',
    'help me',
    'what is this',
    'who are you',
    'what are you',
    'can you help',
    'i need help',
    'how to use',
    'what should i',
    'thanks',
    'thank you',
    'okay',
    'ok',
    'cool',
    'nice',
    'great',
    'awesome',
    'got it',
  ];

  if (helpPatterns.some(p => lowerQuery.includes(p))) {
    return true;
  }

  // Very short queries that aren't build commands
  if (lowerQuery.length < 10 && !lowerQuery.includes('build') && !lowerQuery.includes('create') && !lowerQuery.includes('make')) {
    return true;
  }

  return false;
}

// Generate conversational response
function generateConversationalResponse(query: string): AIMessageResponse {
  const lowerQuery = query.toLowerCase().trim();

  // Greetings
  if (['hello', 'hi', 'hey', 'hola', 'howdy', 'sup', 'yo', 'hii', 'hiii', 'heya', 'heyo'].some(g => lowerQuery.startsWith(g))) {
    const responses = [
      "Hey! 👋 I'm here to help you design Web3 apps on Arbitrum. What would you like to build today?",
      "Hi there! Ready to architect something awesome? Tell me what kind of dApp you want to create.",
      "Hello! I can help you design NFT marketplaces, DeFi dashboards, Telegram bots, and more. What's on your mind?",
    ];
    return { type: 'message', content: responses[Math.floor(Math.random() * responses.length)] };
  }

  // Help requests
  if (lowerQuery.includes('help') || lowerQuery.includes('what can you do') || lowerQuery.includes('how')) {
    return {
      type: 'message',
      content: "I can help you design Web3 application architectures! Just describe what you want to build, like:\n\n• \"NFT marketplace with wallet auth\"\n• \"DeFi dashboard with bridging\"\n• \"Telegram bot for crypto alerts\"\n• \"Trading agent on Ostium\"\n\nI'll suggest the right components and you can add them to your canvas.",
    };
  }

  // Thanks
  if (lowerQuery.includes('thank') || lowerQuery.includes('thanks')) {
    return { type: 'message', content: "You're welcome! Let me know if you need help with anything else. 🙂" };
  }

  // Affirmations
  if (['okay', 'ok', 'cool', 'nice', 'great', 'awesome', 'got it'].some(a => lowerQuery.includes(a))) {
    return { type: 'message', content: "Great! Feel free to describe any Web3 app you'd like to build and I'll design an architecture for it." };
  }

  // Default
  return {
    type: 'message',
    content: "I'm not sure what you'd like to build. Could you describe your project? For example: \"I want to build an NFT marketplace\" or \"Create a DeFi dashboard with bridging\".",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_query } = body;

    if (!user_query || typeof user_query !== 'string') {
      return NextResponse.json(
        { error: 'user_query is required' },
        { status: 400 }
      );
    }

    // Check if it's a conversational query first
    if (isConversationalQuery(user_query)) {
      return NextResponse.json(generateConversationalResponse(user_query));
    }

    // Check for OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      // Return a mock response for demo purposes when no API key is configured
      console.log('[AI-Generate] No OpenAI API key configured, returning mock response');
      return NextResponse.json(generateMockWorkflowResponse(user_query));
    }

    try {
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: user_query },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AI-Generate] OpenAI API error:', errorData);
        // Fall back to mock response
        return NextResponse.json(generateMockWorkflowResponse(user_query));
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return NextResponse.json(generateMockWorkflowResponse(user_query));
      }

      const parsedResponse = parseAIResponse(content);

      if (!parsedResponse) {
        console.error('[AI-Generate] Failed to parse AI response:', content);
        return NextResponse.json(generateMockWorkflowResponse(user_query));
      }

      // Check if it's a message response
      if ('type' in parsedResponse && parsedResponse.type === 'message') {
        return NextResponse.json(parsedResponse);
      }

      // It's a workflow response - validate it has tools
      const workflowResponse = parsedResponse as AIWorkflowResponse;
      if (!workflowResponse.tools || workflowResponse.tools.length === 0) {
        return NextResponse.json(generateMockWorkflowResponse(user_query));
      }

      return NextResponse.json(workflowResponse);
    } catch (aiError) {
      console.error('[AI-Generate] AI API error:', aiError);
      return NextResponse.json(generateMockWorkflowResponse(user_query));
    }
  } catch (error) {
    console.error('[AI-Generate] Request error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Generate a smart mock workflow response based on keywords in the query
function generateMockWorkflowResponse(query: string): AIWorkflowResponse {
  const lowerQuery = query.toLowerCase();
  const tools: AITool[] = [];
  let description = '';

  // Detect patterns and build appropriate architecture
  const hasNFT = lowerQuery.includes('nft') || lowerQuery.includes('erc721') || lowerQuery.includes('collectible');
  const hasToken = lowerQuery.includes('token') || lowerQuery.includes('erc20');
  const hasDeFi = lowerQuery.includes('defi') || lowerQuery.includes('trading') || lowerQuery.includes('swap') || lowerQuery.includes('yield');
  const hasAI = lowerQuery.includes('ai') || lowerQuery.includes('agent') || lowerQuery.includes('bot');
  const hasTelegram = lowerQuery.includes('telegram') || lowerQuery.includes('notification') || lowerQuery.includes('alert');
  const hasBridge = lowerQuery.includes('bridge') || lowerQuery.includes('l1') || lowerQuery.includes('l2') || lowerQuery.includes('cross-chain');
  const hasIPFS = lowerQuery.includes('ipfs') || lowerQuery.includes('storage') || lowerQuery.includes('metadata');
  const hasZK = lowerQuery.includes('zk') || lowerQuery.includes('privacy') || lowerQuery.includes('private');
  const hasWallet = lowerQuery.includes('wallet') || lowerQuery.includes('login') || lowerQuery.includes('auth');
  const hasFrontend = lowerQuery.includes('frontend') || lowerQuery.includes('ui') || lowerQuery.includes('dashboard') || lowerQuery.includes('app');
  const hasOstium = lowerQuery.includes('ostium') || lowerQuery.includes('perpetual') || lowerQuery.includes('leverage');
  const hasMarketplace = lowerQuery.includes('marketplace') || lowerQuery.includes('buy') || lowerQuery.includes('sell');
  const hasPaywall = lowerQuery.includes('paywall') || lowerQuery.includes('payment') || lowerQuery.includes('monetize') || lowerQuery.includes('premium');
  const hasAnalytics = lowerQuery.includes('analytics') || lowerQuery.includes('activity') || lowerQuery.includes('transaction') || lowerQuery.includes('history');

  let toolId = 1;
  const getToolId = () => `tool_${toolId++}`;

  // Always add wallet auth if building an app
  if (hasWallet || hasFrontend || hasNFT || hasDeFi || hasMarketplace) {
    tools.push({
      id: getToolId(),
      type: 'wallet_auth',
      name: 'Wallet Authentication',
      next_tools: [],
    });
  }

  // Add RPC provider for data-heavy apps
  if (hasDeFi || hasNFT || hasBridge || hasMarketplace || hasAnalytics) {
    tools.push({
      id: getToolId(),
      type: 'rpc_provider',
      name: 'RPC Provider',
      next_tools: [],
    });
  }

  // Onchain activity/analytics
  if (hasAnalytics) {
    tools.push({
      id: getToolId(),
      type: 'onchain_activity',
      name: 'Onchain Activity',
      next_tools: [],
    });
  }

  // Contract types
  if (hasNFT) {
    tools.push({
      id: getToolId(),
      type: hasZK ? 'stylus_zk_contract' : 'stylus_contract',
      name: hasZK ? 'Private NFT Contract' : 'NFT Smart Contract',
      next_tools: [],
    });

    if (hasIPFS || hasMarketplace) {
      tools.push({
        id: getToolId(),
        type: 'ipfs_storage',
        name: 'IPFS Metadata Storage',
        next_tools: [],
      });
    }
  }

  if (hasToken && !hasNFT) {
    tools.push({
      id: getToolId(),
      type: 'stylus_contract',
      name: 'Token Contract',
      next_tools: [],
    });
  }

  if (hasZK && !hasNFT) {
    tools.push({
      id: getToolId(),
      type: 'zk_primitives',
      name: 'ZK Privacy Proofs',
      next_tools: [],
    });
  }

  // DeFi features
  if (hasOstium) {
    tools.push({
      id: getToolId(),
      type: 'ostium_trading',
      name: 'Ostium Trading',
      next_tools: [],
    });
  }

  if (hasBridge) {
    tools.push({
      id: getToolId(),
      type: 'arbitrum_bridge',
      name: 'Arbitrum Bridge',
      next_tools: [],
    });
  }

  if (hasDeFi && !hasOstium && !hasAnalytics) {
    tools.push({
      id: getToolId(),
      type: 'chain_data',
      name: 'On-Chain Data',
      next_tools: [],
    });
  }

  // AI/Agent features
  if (hasAI) {
    if (hasTelegram) {
      tools.push({
        id: getToolId(),
        type: 'telegram_ai_agent',
        name: 'Telegram AI Agent',
        next_tools: [],
      });
    } else {
      tools.push({
        id: getToolId(),
        type: 'erc8004_agent',
        name: 'ERC-8004 AI Agent',
        next_tools: [],
      });
    }
  }

  // Telegram features
  if (hasTelegram && !hasAI) {
    tools.push({
      id: getToolId(),
      type: 'telegram_notifications',
      name: 'Telegram Alerts',
      next_tools: [],
    });
    tools.push({
      id: getToolId(),
      type: 'telegram_wallet_link',
      name: 'Wallet Link',
      next_tools: [],
    });
  }

  // Paywall
  if (hasPaywall) {
    tools.push({
      id: getToolId(),
      type: 'x402_paywall',
      name: 'Payment Paywall',
      next_tools: [],
    });
  }

  // Frontend
  if (hasFrontend || hasMarketplace || hasDeFi) {
    tools.push({
      id: getToolId(),
      type: 'frontend_scaffold',
      name: 'Next.js Frontend',
      next_tools: [],
    });
  }

  // SDK Generator for complex apps
  if (tools.length > 4) {
    tools.push({
      id: getToolId(),
      type: 'sdk_generator',
      name: 'TypeScript SDK',
      next_tools: [],
    });
  }

  // Quality gates for production apps
  if (tools.length > 3) {
    tools.push({
      id: getToolId(),
      type: 'quality_gates',
      name: 'Quality Gates',
      next_tools: [],
    });
  }

  // Default fallback if no specific patterns matched
  if (tools.length === 0) {
    tools.push(
      { id: 'tool_1', type: 'wallet_auth', name: 'Wallet Authentication', next_tools: ['tool_2'] },
      { id: 'tool_2', type: 'stylus_contract', name: 'Smart Contract', next_tools: ['tool_3'] },
      { id: 'tool_3', type: 'frontend_scaffold', name: 'Next.js Frontend', next_tools: [] }
    );
    description = 'A basic dApp architecture with wallet authentication, smart contract, and frontend.';
  }

  // Create connections (linear flow for simplicity)
  for (let i = 0; i < tools.length - 1; i++) {
    tools[i].next_tools = [tools[i + 1].id];
  }

  // Generate description based on components
  if (!description) {
    const componentNames = tools.map(t => t.name).join(', ');
    if (hasNFT && hasMarketplace) {
      description = `NFT marketplace architecture with ${componentNames}. This setup enables minting, trading, and displaying NFTs with proper metadata storage.`;
    } else if (hasDeFi) {
      description = `DeFi application architecture with ${componentNames}. This enables trading, data analysis, and user interactions on Arbitrum.`;
    } else if (hasAI && hasTelegram) {
      description = `AI-powered Telegram bot architecture with ${componentNames}. This enables conversational AI with Web3 wallet integration.`;
    } else if (hasTelegram) {
      description = `Telegram integration architecture with ${componentNames}. This enables crypto alerts and wallet linking via Telegram.`;
    } else if (hasAnalytics) {
      description = `Wallet analytics architecture with ${componentNames}. This enables tracking and displaying onchain activity.`;
    } else {
      description = `Web3 application architecture with ${componentNames}. Built for Arbitrum with modern development practices.`;
    }
  }

  return {
    tools,
    description,
    has_sequential_execution: true,
  };
}
