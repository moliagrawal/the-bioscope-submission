import { NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { consumeNonce } from '@/lib/db';
import { createSession, sessionCookieHeader } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { address, signature, message } = await request.json();

    if (!address || !signature || !message) {
      return new NextResponse('Missing parameters', { status: 400 });
    }

    // SIWE message parsing (basic)
    // Extract nonce from message (Expected format has "Nonce: <nonce>")
    const nonceMatch = message.match(/Nonce: ([a-zA-Z0-9]+)/);
    if (!nonceMatch) {
      return new NextResponse('Invalid message format', { status: 400 });
    }
    const nonce = nonceMatch[1];

    // Verify cryptographic signature recovers to address (Check #7)
    let isValidSignature = false;
    try {
      isValidSignature = await verifyMessage({
        address: address as any,
        message,
        signature: signature as any,
      });
    } catch (e) {
      isValidSignature = false;
    }

    if (!isValidSignature) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    // Enforce nonce single-use and expiry (Check #8)
    const { valid, reason } = consumeNonce(nonce, address);
    if (!valid) {
      return new NextResponse(`Challenge failed: ${reason}`, { status: 401 });
    }

    // Issue session cookie
    const token = createSession(address);

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': sessionCookieHeader(token),
      },
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
