import { test, expect } from 'vitest';
import { hasPurchase, recordPurchase, getDb } from '@/lib/db';
import { GET } from '@/app/api/reels/[id]/frames/route';
import { createSession, sessionCookieHeader } from '@/lib/session';

test('Check 9: Entitlement scoped per reel', async () => {
  const wallet = '0xtest_reel_scope';
  
  // Pay for reel-a
  recordPurchase(wallet, 'reel-a', 'tx123', '0.001');

  // Create session
  const token = createSession(wallet);
  
  // Request reel-b (has not paid for this)
  const req = new Request('http://localhost/api/reels/reel-b/frames?index=1', {
    headers: {
      'cookie': sessionCookieHeader(token)
    }
  });

  const res = await GET(req, { params: Promise.resolve({ id: 'reel-b' }) });
  
  // Should demand payment for reel-b
  expect(res.status).toBe(402);

  // Clean up
  getDb().prepare('DELETE FROM purchases WHERE wallet_address = ?').run(wallet);
});
