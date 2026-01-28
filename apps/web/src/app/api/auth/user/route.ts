import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Create or update user
export async function POST(request: NextRequest) {
  // Check if Prisma client is available
  if (!prisma) {
    console.error('Prisma client is not initialized');
    return NextResponse.json(
      { 
        error: 'Database client not initialized',
        details: 'Prisma client has not been generated or initialized. Please run: npx prisma generate',
        hint: 'Make sure you have run "npx prisma generate" in the apps/web directory'
      },
      { status: 500 }
    );
  }

  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not configured');
    return NextResponse.json(
      { 
        error: 'Database not configured',
        details: 'DATABASE_URL environment variable is not set. Please configure your database connection.',
        hint: 'See .env.example for reference'
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { walletAddress, githubId, githubUsername, githubAvatar } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Normalize wallet address to lowercase
    const normalizedAddress = walletAddress.toLowerCase();

    // Upsert user - create if not exists, update if exists
    const user = await prisma.user.upsert({
      where: {
        wallet_address: normalizedAddress,
      },
      update: {
        // Only update GitHub fields if provided
        ...(githubId && { github_id: githubId }),
        ...(githubUsername && { github_username: githubUsername }),
        ...(githubAvatar && { github_avatar: githubAvatar }),
      },
      create: {
        wallet_address: normalizedAddress,
        github_id: githubId || null,
        github_username: githubUsername || null,
        github_avatar: githubAvatar || null,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        githubId: user.github_id,
        githubUsername: user.github_username,
      },
    });
  } catch (error: any) {
    console.error('Error saving user:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error name:', error?.name);
    console.error('Error code:', error?.code);
    
    // Provide more detailed error information
    const errorMessage = error?.message || 'Failed to save user';
    const isPrismaError = error?.code?.startsWith('P') || error?.name?.includes('Prisma');
    
    // Check for module not found errors (Prisma client not generated)
    if (error?.code === 'MODULE_NOT_FOUND' || errorMessage?.includes('Cannot find module')) {
      return NextResponse.json(
        { 
          error: 'Prisma client not found',
          details: 'Prisma client has not been generated. Please run: npx prisma generate',
          code: 'PRISMA_CLIENT_NOT_FOUND',
        },
        { status: 500 }
      );
    }
    
    // Check for specific Prisma error codes
    if (error?.code === 'P1001' || error?.code === 'P1017') {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: 'Unable to connect to the database. Please check your DATABASE_URL and ensure the database is running.',
          code: error.code,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to save user',
        details: isPrismaError ? 'Database error occurred. Please check your database configuration.' : errorMessage,
        code: error?.code,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Get user by wallet address
export async function GET(request: NextRequest) {
  // Check if Prisma client is available
  if (!prisma) {
    console.error('Prisma client is not initialized');
    return NextResponse.json(
      { 
        error: 'Database client not initialized',
        details: 'Prisma client has not been generated or initialized. Please run: npx prisma generate',
        hint: 'Make sure you have run "npx prisma generate" in the apps/web directory'
      },
      { status: 500 }
    );
  }

  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not configured');
    return NextResponse.json(
      { 
        error: 'Database not configured',
        details: 'DATABASE_URL environment variable is not set. Please configure your database connection.',
        hint: 'See .env.example for reference'
      },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        wallet_address: normalizedAddress,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        githubId: user.github_id,
        githubUsername: user.github_username,
        githubAvatar: user.github_avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error name:', error?.name);
    console.error('Error code:', error?.code);
    
    // Provide more detailed error information
    const errorMessage = error?.message || 'Failed to fetch user';
    const isPrismaError = error?.code?.startsWith('P') || error?.name?.includes('Prisma');
    
    // Check for module not found errors (Prisma client not generated)
    if (error?.code === 'MODULE_NOT_FOUND' || errorMessage?.includes('Cannot find module')) {
      return NextResponse.json(
        { 
          error: 'Prisma client not found',
          details: 'Prisma client has not been generated. Please run: npx prisma generate',
          code: 'PRISMA_CLIENT_NOT_FOUND',
        },
        { status: 500 }
      );
    }
    
    // Check for specific Prisma error codes
    if (error?.code === 'P1001' || error?.code === 'P1017') {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: 'Unable to connect to the database. Please check your DATABASE_URL and ensure the database is running.',
          code: error.code,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch user',
        details: isPrismaError ? 'Database error occurred. Please check your database configuration.' : errorMessage,
        code: error?.code,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
