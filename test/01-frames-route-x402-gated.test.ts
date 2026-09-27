import { test, expect } from 'vitest';
import { GET } from '@/app/api/reels/[id]/frames/route';

test('Check 1: Paid frames route returns 402 when unpaid', async () => {
  const req = new Request('http://localhost/api/reels/reel-a/frames?index=1');
  const res = await GET(req, { params: { id: 'reel-a' } });
  
  expect(res.status).toBe(402);
  const data = await res.json();
  expect(data.error).toBe('Payment Required');
  expect(data.requirements).toBeDefined();
});
