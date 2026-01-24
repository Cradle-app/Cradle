import { NextResponse } from 'next/server';

const CREATE_AGENT_URL = 'https://maxxit.ai/api/lazy-trading/create-agent';

interface TradingPreferences {
    risk_tolerance: number;
    trade_frequency: number;
    social_sentiment_weight: number;
    price_momentum_focus: number;
    market_rank_priority: number;
}

interface CreateAgentRequest {
    userWallet: string;
    telegramAlphaUserId: string;
    tradingPreferences: TradingPreferences;
}

interface CreateAgentResponse {
    success: boolean;
    agent?: {
        id: string;
        name: string;
        venue: string;
    };
    deployment?: {
        id: string;
        status: string;
    };
    ostiumAgentAddress?: string;
    error?: string;
}

export async function POST(request: Request) {
    let body: CreateAgentRequest | null = null;

    try {
        body = (await request.json()) as CreateAgentRequest;
    } catch {
        body = null;
    }

    const userWallet = body?.userWallet?.trim();
    const telegramAlphaUserId = body?.telegramAlphaUserId?.trim();
    const tradingPreferences = body?.tradingPreferences;

    if (!userWallet) {
        return NextResponse.json({ error: 'User wallet address is required.' }, { status: 400 });
    }

    if (!telegramAlphaUserId) {
        return NextResponse.json({ error: 'Telegram user ID is required.' }, { status: 400 });
    }

    if (!tradingPreferences) {
        return NextResponse.json({ error: 'Trading preferences are required.' }, { status: 400 });
    }

    try {
        const response = await fetch(CREATE_AGENT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userWallet,
                telegramAlphaUserId,
                tradingPreferences,
            }),
            cache: 'no-store',
        });

        const payload = await response.json().catch(() => null) as CreateAgentResponse | null;

        if (!payload) {
            return NextResponse.json({ error: 'Invalid response from Maxxit.' }, { status: 502 });
        }

        return NextResponse.json(payload, { status: response.status });
    } catch {
        return NextResponse.json({ error: 'Failed to reach Maxxit.' }, { status: 502 });
    }
}
