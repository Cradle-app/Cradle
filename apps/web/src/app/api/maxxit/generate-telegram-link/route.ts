import { NextResponse } from 'next/server';

const GENERATE_TELEGRAM_LINK_URL = 'https://maxxit.ai/api/lazy-trading/generate-telegram-link';

interface GenerateTelegramLinkRequest {
    userWallet: string;
}

interface GenerateTelegramLinkResponse {
    success: boolean;
    alreadyLinked: boolean;
    linkCode?: string;
    botUsername?: string;
    deepLink?: string;
    expiresIn?: number;
    telegramUser?: {
        id: string;
        telegram_user_id: string;
        telegram_username: string;
    };
}

export async function POST(request: Request) {
    let body: GenerateTelegramLinkRequest | null = null;

    try {
        body = (await request.json()) as GenerateTelegramLinkRequest;
    } catch {
        body = null;
    }

    const userWallet = body?.userWallet?.trim();

    if (!userWallet) {
        return NextResponse.json({ error: 'User wallet address is required.' }, { status: 400 });
    }

    try {
        const response = await fetch(GENERATE_TELEGRAM_LINK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userWallet }),
            cache: 'no-store',
        });

        const payload = await response.json().catch(() => null) as GenerateTelegramLinkResponse | null;

        if (!payload) {
            return NextResponse.json({ error: 'Invalid response from Maxxit.' }, { status: 502 });
        }

        return NextResponse.json(payload, { status: response.status });
    } catch {
        return NextResponse.json({ error: 'Failed to reach Maxxit.' }, { status: 502 });
    }
}
