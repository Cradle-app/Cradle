import { NextResponse } from 'next/server';

const CLUB_DETAILS_URL = 'https://maxxit.ai/api/lazy-trading/programmatic/club-details';
const API_KEY_HEADER = 'x-api-key';
const MISSING_API_KEY = 'API key is required.';

export async function GET(request: Request) {
  const apiKey = request.headers.get(API_KEY_HEADER);

  if (!apiKey) {
    return NextResponse.json({ error: MISSING_API_KEY }, { status: 400 });
  }

  try {
    const response = await fetch(CLUB_DETAILS_URL, {
      method: 'GET',
      headers: {
        [API_KEY_HEADER]: apiKey,
      },
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
