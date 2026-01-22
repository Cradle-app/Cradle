import { NextResponse } from 'next/server';

const SEND_MESSAGE_URL = 'https://maxxit.ai/api/lazy-trading/programmatic/send-message';
const API_KEY_HEADER = 'x-api-key';
const MISSING_API_KEY = 'API key is required.';
const INVALID_BODY = 'Message is required.';

export async function POST(request: Request) {
  const apiKey = request.headers.get(API_KEY_HEADER);

  if (!apiKey) {
    return NextResponse.json({ error: MISSING_API_KEY }, { status: 400 });
  }

  let body: { message?: string } | null = null;
  try {
    body = (await request.json()) as { message?: string };
  } catch (error) {
    body = null;
  }

  const message = body?.message?.trim();
  if (!message) {
    return NextResponse.json({ error: INVALID_BODY }, { status: 400 });
  }

  try {
    const response = await fetch(SEND_MESSAGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [API_KEY_HEADER]: apiKey,
      },
      body: JSON.stringify({ message }),
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => null);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid response from Maxxit.' }, { status: 502 });
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reach Maxxit.' }, { status: 502 });
  }
}
