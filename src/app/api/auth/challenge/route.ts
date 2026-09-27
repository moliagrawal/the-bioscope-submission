import { NextResponse } from 'next/server';
import { createNonce } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    if (!address || typeof address !== 'string') {
      return new NextResponse('Missing address', { status: 400 });
    }

    // Generate a nonce with 5 min expiry and store it (Check 8)
    const { nonce, expiresAt } = createNonce(address, 300);

    return NextResponse.json({ nonce, expiresAt });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
