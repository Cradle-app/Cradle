import { NextRequest, NextResponse } from 'next/server';

const MAXXIT_API_BASE = process.env.MAXXIT_API_BASE_URL || 'http://localhost:5000';
const CLUB_DETAILS_URL = `${MAXXIT_API_BASE}/api/lazy-trading/programmatic/club-details`;

/**
 * Next.js API route handler for fetching Lazy Trader club details
 * This proxies requests to the Maxxit API to avoid CORS issues
 */
export async function clubDetailsHandler(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    const response = await fetch(CLUB_DETAILS_URL, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Maxxit] Club details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch club details' },
      { status: 500 }
    );
  }
}
