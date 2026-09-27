import { test, expect } from 'vitest';
import { GET } from '@/app/api/reels/[id]/frames/route';

test('Check 6: Access decided by wallet lookup, not flag', async () => {
  // Try passing a fabricated paid=true cookie or header
  const req = new Request('http://localhost/api/reels/reel-a/frames?index=1', {
    headers: {
      'cookie': 'paid=true; hasPaid=true',
      'wallet': '0xfabricated'
    }
  });

  const res = await GET(req, { params: { id: 'reel-a' } });
  
  // Should still demand payment
  expect(res.status).toBe(402);
});
