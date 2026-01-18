import { NextResponse } from 'next/server';
import { validateBlueprint } from '@dapp-forge/blueprint-schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = validateBlueprint(body.blueprint);
    
    return NextResponse.json(result, {
      status: result.valid ? 200 : 400,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        valid: false, 
        errors: [{ 
          path: '', 
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'PARSE_ERROR',
        }],
        warnings: [],
      },
      { status: 400 }
    );
  }
}

