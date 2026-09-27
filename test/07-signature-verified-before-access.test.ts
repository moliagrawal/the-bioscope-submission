import { test, expect, vi } from 'vitest';
import { POST } from '@/app/api/auth/verify/route';

test('Check 7: Wallet claim verified by signature', async () => {
  // Try passing an invalid signature for a valid wallet address
  const req = new Request('http://localhost/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({
      address: '0xValidLookingAddressThatIsntSigned',
      signature: '0xBadSignature',
      message: 'Sign in to access your purchased content\nNonce: 1234'
    })
  });

  const res = await POST(req);
  expect(res.status).toBe(401);
  const data = await res.text();
  expect(data).toContain('Invalid signature');
});
