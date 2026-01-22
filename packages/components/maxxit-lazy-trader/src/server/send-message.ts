import { NextRequest, NextResponse } from 'next/server';

const MAXXIT_API_BASE = process.env.MAXXIT_API_BASE_URL || 'http://localhost:5000';
const SEND_MESSAGE_URL = `${MAXXIT_API_BASE}/api/lazy-trading/programmatic/send-message`;

/**
 * Next.js API route handler for sending messages to Lazy Trader
 * This proxies requests to the Maxxit API to avoid CORS issues
 */
export async function sendMessageHandler(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await fetch(SEND_MESSAGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ message: message.trim() }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Maxxit] Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
