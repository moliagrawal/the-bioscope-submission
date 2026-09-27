import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'bioscope.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initializeSchema(_db);
  }
  return _db;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reels (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      frame_count INTEGER NOT NULL,
      price_usd TEXT NOT NULL DEFAULT '0.001',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      reel_id TEXT NOT NULL,
      tx_ref TEXT,
      amount TEXT,
      paid_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(wallet_address, reel_id),
      FOREIGN KEY (reel_id) REFERENCES reels(id)
    );

    CREATE TABLE IF NOT EXISTS auth_nonces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nonce TEXT NOT NULL UNIQUE,
      address TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      consumed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_purchases_wallet_reel
      ON purchases(wallet_address, reel_id);

    CREATE INDEX IF NOT EXISTS idx_auth_nonces_nonce
      ON auth_nonces(nonce);

    CREATE INDEX IF NOT EXISTS idx_auth_nonces_address
      ON auth_nonces(address);
  `);
}

// ── Purchase operations ─────────────────────────────────────────────────

export function hasPurchase(walletAddress: string, reelId: string): boolean {
  const db = getDb();
  const row = db.prepare(
    'SELECT 1 FROM purchases WHERE wallet_address = ? AND reel_id = ?'
  ).get(walletAddress.toLowerCase(), reelId);
  return !!row;
}

export function recordPurchase(
  walletAddress: string,
  reelId: string,
  txRef: string,
  amount: string
): void {
  const db = getDb();
  db.prepare(`
    INSERT OR IGNORE INTO purchases (wallet_address, reel_id, tx_ref, amount)
    VALUES (?, ?, ?, ?)
  `).run(walletAddress.toLowerCase(), reelId, txRef, amount);
}

// ── Nonce operations ────────────────────────────────────────────────────

export function createNonce(address: string, expirySeconds: number = 300): {
  nonce: string;
  expiresAt: number;
} {
  const db = getDb();
  const nonce = crypto.randomBytes(32).toString('hex');
  const expiresAt = Math.floor(Date.now() / 1000) + expirySeconds;

  db.prepare(`
    INSERT INTO auth_nonces (nonce, address, expires_at)
    VALUES (?, ?, ?)
  `).run(nonce, address.toLowerCase(), expiresAt);

  return { nonce, expiresAt };
}

export function consumeNonce(nonce: string, address: string): {
  valid: boolean;
  reason?: string;
} {
  const db = getDb();
  const row = db.prepare(
    'SELECT * FROM auth_nonces WHERE nonce = ? AND address = ?'
  ).get(nonce, address.toLowerCase()) as {
    nonce: string;
    address: string;
    expires_at: number;
    consumed: number;
  } | undefined;

  if (!row) {
    return { valid: false, reason: 'Nonce not found' };
  }

  if (row.consumed) {
    return { valid: false, reason: 'Nonce already consumed' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (now > row.expires_at) {
    return { valid: false, reason: 'Nonce expired' };
  }

  // Mark as consumed (single-use)
  db.prepare('UPDATE auth_nonces SET consumed = 1 WHERE nonce = ?').run(nonce);

  return { valid: true };
}

// ── Reel operations ─────────────────────────────────────────────────────

export function getAllReels(): Array<{
  id: string;
  title: string;
  description: string;
  frame_count: number;
  price_usd: string;
}> {
  const db = getDb();
  return db.prepare('SELECT * FROM reels ORDER BY created_at').all() as Array<{
    id: string;
    title: string;
    description: string;
    frame_count: number;
    price_usd: string;
  }>;
}

export function getReel(id: string): {
  id: string;
  title: string;
  description: string;
  frame_count: number;
  price_usd: string;
} | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM reels WHERE id = ?').get(id) as {
    id: string;
    title: string;
    description: string;
    frame_count: number;
    price_usd: string;
  } | undefined;
}

// ── Cleanup ─────────────────────────────────────────────────────────────

export function cleanExpiredNonces(): void {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  db.prepare('DELETE FROM auth_nonces WHERE expires_at < ?').run(now);
}
