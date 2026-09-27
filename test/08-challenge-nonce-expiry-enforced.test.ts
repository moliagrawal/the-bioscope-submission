import { test, expect } from 'vitest';
import { createNonce, consumeNonce, getDb } from '@/lib/db';

test('Check 8: Sign-in challenges cannot be replayed', () => {
  const address = '0xtest_nonce';
  
  // 1. Create
  const { nonce } = createNonce(address, 300);
  
  // 2. Consume first time (success)
  const result1 = consumeNonce(nonce, address);
  expect(result1.valid).toBe(true);

  // 3. Replay (fail)
  const result2 = consumeNonce(nonce, address);
  expect(result2.valid).toBe(false);
  expect(result2.reason).toBe('Nonce already consumed');

  // Clean up
  getDb().prepare('DELETE FROM auth_nonces WHERE address = ?').run(address);
});
