'use client';

import { useState, useEffect } from 'react';
import { createWalletClient, custom } from 'viem';
import { baseSepolia } from 'viem/chains';

export default function ReelPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [reel, setReel] = useState<any>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frameUrls, setFrameUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch reel metadata
    fetch('/api/reels').then(r => r.json()).then(reels => {
      const found = reels.find((r: any) => r.id === id);
      setReel(found);
      if (found) {
        // Frame 0 is always free via preview route (Check 2)
        setFrameUrls([\`/api/reels/\${id}/preview\`]);
        setLoading(false);
      }
    });

    // Attempt to load remaining frames (maybe we already have a session)
    fetchFrames();
  }, [id]);

  async function fetchFrames() {
    try {
      // Just test if we can get frame 1
      const res = await fetch(\`/api/reels/\${id}/frames?index=1\`);
      if (res.ok) {
        // We have access! Load all frame URLs
        // Note: in a real app we might stream them or fetch blobs. 
        // Here we can just use the authenticated endpoint as image src.
        // The browser will attach the session cookie automatically.
        setError(null);
      } else if (res.status === 402) {
        // Not authorized, will need to unlock
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function connectWallet() {
    if (!window.ethereum) return alert('No wallet found');
    const client = createWalletClient({ chain: baseSepolia, transport: custom(window.ethereum) });
    const [addr] = await client.requestAddresses();
    setAddress(addr);
    return { client, addr };
  }

  async function handleUnlock() {
    setLoading(true);
    try {
      const { client, addr } = await connectWallet();
      
      // 1. Get SIWx challenge
      const chalRes = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr })
      });
      const { nonce } = await chalRes.json();

      // 2. Sign message
      const message = \`Sign in to access your purchased content\n\nURI: http://localhost:3000\nNonce: \${nonce}\`;
      const signature = await client.signMessage({ account: addr as \`0x\${string}\`, message });

      // 3. Verify and get session
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr, signature, message })
      });

      if (!verifyRes.ok) throw new Error('Verification failed');

      // 4. Try fetching frame 1 again. 
      // If we already paid in the past, this will succeed!
      let frameRes = await fetch(\`/api/reels/\${id}/frames?index=1\`);
      
      if (frameRes.status === 402) {
        // 5. If 402, we need to pay. 
        // We'll mock a payment payload that our server accepts.
        // Real x402 flow would use the facilitator SDK here.
        const reqs = await frameRes.json();
        
        const mockPayment = Buffer.from(JSON.stringify({
          resourceId: reqs.requirements.resourceId,
          txRef: 'mock-tx-' + Date.now()
        })).toString('base64');

        frameRes = await fetch(\`/api/reels/\${id}/frames?index=1\`, {
          headers: {
            'X402-Payment': mockPayment
          }
        });
      }

      if (frameRes.ok) {
        setError(null);
        // We can now cycle frames using the authenticated endpoint
      } else {
        throw new Error('Failed to unlock frames');
      }

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!reel) return <div>Loading...</div>;

  const maxFrames = reel.frame_count;
  const currentUrl = currentFrame === 0 
    ? frameUrls[0] 
    : \`/api/reels/\${id}/frames?index=\${currentFrame}\`; // Browser sends cookie

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-amber-500">{reel.title}</h2>
          <p className="text-neutral-400">{reel.description}</p>
        </div>
        <button 
          onClick={handleUnlock}
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-6 rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : \`Unlock (\$\${reel.price_usd})\`}
        </button>
      </div>

      {error && <div className="text-red-500 p-4 bg-red-950/30 border border-red-900 rounded">{error}</div>}

      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 max-w-2xl mx-auto">
        <div className="aspect-video relative bg-black flex items-center justify-center overflow-hidden rounded">
          <img src={currentUrl} alt="Frame" className="w-full h-full object-contain" />
        </div>
        
        <div className="flex justify-between items-center mt-4 px-4 pb-2">
          <button 
            onClick={() => setCurrentFrame(f => Math.max(0, f - 1))}
            className="text-neutral-400 hover:text-white disabled:opacity-30 px-4 py-2"
            disabled={currentFrame === 0}
          >
            ← Prev
          </button>
          <span className="font-mono text-amber-500/50 text-sm">
            FRAME {currentFrame + 1} / {maxFrames}
          </span>
          <button 
            onClick={() => setCurrentFrame(f => Math.min(maxFrames - 1, f + 1))}
            className="text-neutral-400 hover:text-white disabled:opacity-30 px-4 py-2"
            disabled={currentFrame === maxFrames - 1}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
