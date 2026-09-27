import { test, expect } from 'vitest';
import { hasPurchase, recordPurchase, getDb } from '@/lib/db';

test('Check 4: Server-side purchase record written', () => {
  const wallet = '0xtestwallet_4';
  const reelId = 'reel-a';
  
  recordPurchase(wallet, reelId, 'tx_hash_123', '0.001');
  expect(hasPurchase(wallet, reelId)).toBe(true);

  // Clean up
  getDb().prepare('DELETE FROM purchases WHERE wallet_address = ?').run(wallet);
});
