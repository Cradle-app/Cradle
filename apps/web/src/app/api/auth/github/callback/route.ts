import { NextRequest, NextResponse } from 'next/server';

// GitHub OAuth - Step 2: Handle callback from GitHub
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Check for errors from GitHub
  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=github_auth_failed&message=${error}`, request.url)
    );
  }

  // Verify state (CSRF protection)
  const storedState = request.cookies.get('github_oauth_state')?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(
      new URL('/?error=invalid_state', request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/?error=no_code', request.url)
    );
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/?error=oauth_not_configured', request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.redirect(
        new URL(`/?error=token_exchange_failed&message=${tokenData.error}`, request.url)
      );
    }

    const accessToken = tokenData.access_token;

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    const userData = await userResponse.json();

    // Create a session token (in production, use proper JWT/session management)
    const sessionData = {
      githubToken: accessToken,
      githubId: userData.id.toString(),
      githubUser: userData.login,
      githubAvatar: userData.avatar_url,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    // Store in encrypted cookie (simplified - use proper encryption in production)
    const response = NextResponse.redirect(new URL('/?github=connected', request.url));
    
    response.cookies.set('cradle_session', Buffer.from(JSON.stringify(sessionData)).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // Clear the OAuth state cookie
    response.cookies.delete('github_oauth_state');

    return response;
  } catch (err) {
    console.error('GitHub OAuth error:', err);
    return NextResponse.redirect(
      new URL('/?error=oauth_failed', request.url)
    );
  }
}

