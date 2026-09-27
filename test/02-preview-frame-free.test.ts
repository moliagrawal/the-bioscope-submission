import { test, expect } from 'vitest';
import { GET } from '@/app/api/reels/[id]/preview/route';

test('Check 2: First frame is free via distinct path', async () => {
  const req = new Request('http://localhost/api/reels/reel-a/preview');
  const res = await GET(req, { params: Promise.resolve({ id: 'reel-a' }) });
  
  expect(res.status).toBe(200);
  expect(res.headers.get('Content-Type')).toContain('image/jpeg');
});
