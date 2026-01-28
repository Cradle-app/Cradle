import { NextRequest, NextResponse } from 'next/server';

// Get current session info
export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('cradle_session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({
      authenticated: false,
      github: null,
    });
  }

  try {
    const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      const response = NextResponse.json({
        authenticated: false,
        github: null,
      });
      response.cookies.delete('cradle_session');
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      github: {
        id: sessionData.githubId,
        username: sessionData.githubUser,
        avatar: sessionData.githubAvatar,
      },
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
      github: null,
    });
  }
}

// Logout / disconnect GitHub
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('cradle_session');
  return response;
}

