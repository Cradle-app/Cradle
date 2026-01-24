import { NextResponse } from 'next/server';

const CHECK_STATUS_URL = 'https://maxxit.ai/api/lazy-trading/check-telegram-status';

interface CheckTelegramStatusResponse {
    success: boolean;
    connected: boolean;
    telegramUser?: {
        id: string;
        telegram_user_id: string;
        telegram_username: string;
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userWallet = searchParams.get('userWallet');
    const linkCode = searchParams.get('linkCode');

    if (!userWallet) {
        return NextResponse.json({ error: 'User wallet address is required.' }, { status: 400 });
    }

    if (!linkCode) {
        return NextResponse.json({ error: 'Link code is required.' }, { status: 400 });
    }

    try {
        const url = new URL(CHECK_STATUS_URL);
        url.searchParams.set('userWallet', userWallet);
        url.searchParams.set('linkCode', linkCode);

        const response = await fetch(url.toString(), {
            method: 'GET',
            cache: 'no-store',
        });

        const payload = await response.json().catch(() => null) as CheckTelegramStatusResponse | null;

        if (!payload) {
            return NextResponse.json({ error: 'Invalid response from Maxxit.' }, { status: 502 });
        }

        return NextResponse.json(payload, { status: response.status });
    } catch {
        return NextResponse.json({ error: 'Failed to reach Maxxit.' }, { status: 502 });
    }
}
