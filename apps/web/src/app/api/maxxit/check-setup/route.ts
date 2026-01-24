import { NextResponse } from 'next/server';

const CHECK_SETUP_URL = 'https://maxxit.ai/api/lazy-trading/check-setup';

interface LazyTraderSetupStatus {
    success: boolean;
    isSetupComplete: boolean;
    agent?: {
        id: string;
        name: string;
        venue: string;
    };
    deployment?: {
        id: string;
        status: string;
    };
    telegramUser?: {
        id: string;
        telegram_user_id: string;
        telegram_username: string;
    };
    ostiumAgentAddress?: string;
    tradingPreferences?: {
        risk_tolerance: number;
        trade_frequency: number;
        social_sentiment_weight: number;
        price_momentum_focus: number;
        market_rank_priority: number;
    };
    error?: string;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userWallet = searchParams.get('userWallet');

    if (!userWallet) {
        return NextResponse.json({ error: 'User wallet address is required.' }, { status: 400 });
    }

    try {
        const url = new URL(CHECK_SETUP_URL);
        url.searchParams.set('userWallet', userWallet);

        const response = await fetch(url.toString(), {
            method: 'GET',
            cache: 'no-store',
        });

        const payload = await response.json().catch(() => null) as LazyTraderSetupStatus | null;

        if (!payload) {
            return NextResponse.json({ error: 'Invalid response from Maxxit.' }, { status: 502 });
        }

        return NextResponse.json(payload, { status: response.status });
    } catch {
        return NextResponse.json({ error: 'Failed to reach Maxxit.' }, { status: 502 });
    }
}
