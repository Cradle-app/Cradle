import { NextResponse } from 'next/server';

const GENERATE_AGENT_URL = 'https://maxxit.ai/api/ostium/generate-agent';

interface GenerateAgentRequest {
    userWallet: string;
}

interface GenerateAgentResponse {
    agentAddress: string;
    isNew: boolean;
}

export async function POST(request: Request) {
    let body: GenerateAgentRequest | null = null;

    try {
        body = (await request.json()) as GenerateAgentRequest;
    } catch {
        body = null;
    }

    const userWallet = body?.userWallet?.trim();

    if (!userWallet) {
        return NextResponse.json({ error: 'User wallet address is required.' }, { status: 400 });
    }

    try {
        const response = await fetch(GENERATE_AGENT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userWallet }),
            cache: 'no-store',
        });

        const payload = await response.json().catch(() => null) as GenerateAgentResponse | null;

        if (!payload) {
            return NextResponse.json({ error: 'Invalid response from Maxxit.' }, { status: 502 });
        }

        return NextResponse.json(payload, { status: response.status });
    } catch {
        return NextResponse.json({ error: 'Failed to reach Maxxit.' }, { status: 502 });
    }
}
