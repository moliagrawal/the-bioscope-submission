import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const SESSION_DURATION_SECONDS = 86400; // 24 hours

interface SessionPayload {
  address: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Create a signed session token for a verified wallet address.
 * The session ties a request to a wallet address ONLY after SIWx
 * signature verification has succeeded (Check #7).
 */
export function createSession(address: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + SESSION_DURATION_SECONDS;

  const payload: SessionPayload = {
    address: address.toLowerCase(),
    issuedAt,
    expiresAt,
  };

  const data = JSON.stringify(payload);
  const signature = sign(data);

  // Base64 encode: payload.signature
  const token = Buffer.from(
    JSON.stringify({ data, signature })
  ).toString('base64');

  return token;
}

/**
 * Verify and decode a session token.
 * Returns the wallet address if the session is valid and not expired.
 * Returns null if invalid, tampered, or expired.
 */
export function verifySession(token: string): string | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const { data, signature } = decoded;

    // Verify HMAC signature
    const expectedSig = sign(data);
    if (!crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSig, 'hex')
    )) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(data);

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (now > payload.expiresAt) {
      return null;
    }

    return payload.address;
  } catch {
    return null;
  }
}

/**
 * Extract session from cookie header.
 */
export function getSessionFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce<Record<string, string>>((acc, c) => {
    const [key, ...vals] = c.trim().split('=');
    if (key) acc[key.trim()] = vals.join('=').trim();
    return acc;
  }, {});

  const token = cookies['bioscope_session'];
  if (!token) return null;

  return verifySession(token);
}

/**
 * Create a Set-Cookie header value for the session.
 */
export function sessionCookieHeader(token: string): string {
  return `bioscope_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}`;
}

// ── Internal ────────────────────────────────────────────────────────────

function sign(data: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('hex');
}
