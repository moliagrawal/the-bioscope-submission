import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/session';
import { getReel, hasPurchase, recordPurchase } from '@/lib/db';
import { readPaidFrame } from '@/lib/frames';
import { NETWORK, PAY_TO_ADDRESS, facilitatorClient } from '@/lib/x402';
import { createOfferEIP712, createReceiptEIP712 } from '@x402/extensions/offer-receipt';
import { privateKeyToAccount } from 'viem/accounts';

const DUMMY_KEY = '0x1111111111111111111111111111111111111111111111111111111111111111';
const signer = privateKeyToAccount((process.env.EVM_PRIVATE_KEY || DUMMY_KEY) as `0x${string}`);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const indexStr = url.searchParams.get('index');
    const index = parseInt(indexStr || '1', 10);

    const reel = getReel(id);
    if (!reel) {
      return new NextResponse('Reel not found', { status: 404 });
    }

    // 1. Check for valid SIWx Session (Check #7)
    const walletAddress = getSessionFromCookies(request.headers.get('cookie'));

    // 2. Check for Repeat Access via Wallet Lookup (Check #6, #9)
    let hasAccess = false;
    if (walletAddress) {
      hasAccess = hasPurchase(walletAddress, id);
    }

    // 3. Process Payment if they are attempting to pay
    // (Check #4: Server-side purchase record after payment)
    const paymentHeader = request.headers.get('x402-payment');
    if (!hasAccess && paymentHeader && walletAddress) {
      try {
        const payload = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
        const requirements = {
          price: reel.price_usd,
          asset: 'USDC',
          network: NETWORK,
          payTo: PAY_TO_ADDRESS,
          resourceId: id,
        };
        
        const result = await facilitatorClient.verify(payload, requirements);
        
        if (result.isValid && payload.resourceId === id) {
          recordPurchase(walletAddress, id, payload.txRef || 'tx_mock', reel.price_usd);
          hasAccess = true;
        }
      } catch (e) {
        console.error('Payment verification failed', e);
      }
    }

    // 4. Deny access if unpaid (Check #1)
    if (!hasAccess) {
      const { parseEther } = await import('viem');
      const offer = await createOfferEIP712(
        request.url,
        {
          acceptIndex: 0,
          scheme: 'exact',
          asset: 'USDC',
          network: NETWORK,
          amount: parseEther(reel.price_usd).toString(),
          payTo: PAY_TO_ADDRESS,
        }, 
        signer.signTypedData
      );

      // Manual 402 Response returning x402 payment requirements scoped to this reel
      return new NextResponse(
        JSON.stringify({
          error: 'Payment Required',
          requirements: {
            price: reel.price_usd,
            asset: 'USDC',
            network: NETWORK,
            payTo: PAY_TO_ADDRESS,
            resourceId: id,
          },
          extensions: {
            'offer-receipt': { offers: [offer] }
          }
        }),
        { 
          status: 402,
          headers: {
            'Content-Type': 'application/json',
            'X402-Payment-Required': 'true'
          }
        }
      );
    }

    // 5. Serve Paid Frames OUTSIDE public/ (Check #5)
    const frame = readPaidFrame(id, index);
    if (!frame) {
      return new NextResponse('Frame not found', { status: 404 });
    }

    const responseHeaders: Record<string, string> = {
      'Content-Type': frame.mimeType,
      'Cache-Control': 'private, no-cache',
    };

    if (walletAddress) {
      const receipt = await createReceiptEIP712(
        {
          resourceUrl: request.url,
          payer: walletAddress,
          network: NETWORK,
        },
        signer.signTypedData
      );
      responseHeaders['X402-Payment-Response'] = Buffer.from(
        JSON.stringify({ extensions: { 'offer-receipt': { receipts: [receipt] } } })
      ).toString('base64');
    }

    return new NextResponse(new Uint8Array(frame.buffer), {
      headers: responseHeaders,
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
