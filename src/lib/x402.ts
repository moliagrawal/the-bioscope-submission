import { getDb, createNonce, consumeNonce, recordPurchase } from './db';
import { createSession } from './session';
import {
  x402ResourceServer,
} from '@x402/core/server';
import { HTTPFacilitatorClient } from '@x402/core/http';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import {
  InMemorySIWxStorage,
  createSIWxResourceServerExtension,
} from '@x402/extensions/sign-in-with-x';

const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://x402.org/facilitator';
export const NETWORK = process.env.NETWORK || 'eip155:84532';
export const PAY_TO_ADDRESS = process.env.PAY_TO_ADDRESS || '0x0000000000000000000000000000000000000000';

export const facilitatorClient = new HTTPFacilitatorClient({
  url: FACILITATOR_URL,
});

/**
 * Custom SIWx Storage that wraps our SQLite DB for single-use nonces
 * and wallet tracking.
 */
class SQLiteSIWxStorage extends InMemorySIWxStorage {
  async getNonce(address: string, chainId?: string): Promise<string> {
    const { nonce } = createNonce(address, 300); // 5 min expiry
    return nonce;
  }

  async verifyNonce(nonce: string, address: string, chainId?: string): Promise<boolean> {
    const result = consumeNonce(nonce, address);
    return result.valid;
  }

  hasPaid(resource: string, address: string): boolean {
    const db = getDb();
    const row = db.prepare(
      'SELECT 1 FROM purchases WHERE wallet_address = ? AND reel_id = ?'
    ).get(address.toLowerCase(), resource);
    return !!row;
  }
}

export const siwxStorage = new SQLiteSIWxStorage();

// The resource server configures our payment requirements
export const x402Server = new x402ResourceServer(facilitatorClient);
x402Server.register(NETWORK as `${string}:${string}`, new ExactEvmScheme());

// We register the SIWx extension with our SQLite storage and our app's origin
const appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
x402Server.registerExtension(
  createSIWxResourceServerExtension({
    storage: siwxStorage,
    origin: appOrigin,
  })
);
