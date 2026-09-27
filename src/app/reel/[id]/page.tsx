'use client';

import { useState, useEffect } from 'react';
import { createWalletClient, custom } from 'viem';
import { baseSepolia } from 'viem/chains';
import Link from 'next/link';

export default function ReelPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [reel, setReel] = useState<any>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frameUrls, setFrameUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch('/api/reels').then(r => r.json()).then(reels => {
      const found = reels.find((r: any) => r.id === id);
      setReel(found);
      if (found) {
        setFrameUrls([`/api/reels/${id}/preview`]);
        setLoading(false);
      }
    });
    fetchFrames();
  }, [id]);

  async function fetchFrames() {
    try {
      const res = await fetch(`/api/reels/${id}/frames?index=1`);
      if (res.ok) {
        setError(null);
        setIsUnlocked(true);
      }
    } catch (e) {}
  }

  async function connectWallet() {
    const win = window as any;
    if (!win.ethereum) {
      alert('No browser wallet found (e.g. MetaMask). Install one to continue.');
      throw new Error('No wallet found');
    }
    const client = createWalletClient({ chain: baseSepolia, transport: custom(win.ethereum) });
    const [addr] = await client.requestAddresses();
    setAddress(addr);
    return { client, addr };
  }

  async function handleUnlock() {
    setLoading(true);
    try {
      const { client, addr } = await connectWallet();
      
      const chalRes = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr })
      });
      const { nonce } = await chalRes.json();

      const message = `Sign in to access your purchased content\n\nURI: http://localhost:3000\nNonce: ${nonce}`;
      const signature = await client.signMessage({ account: addr as `0x${string}`, message });

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr, signature, message })
      });

      if (!verifyRes.ok) throw new Error('Wallet Verification failed');

      let frameRes = await fetch(`/api/reels/${id}/frames?index=1`);
      
      if (frameRes.status === 402) {
        const reqs = await frameRes.json();
        
        // Simulating the facilitator payload our mock server expects
        const mockPayment = Buffer.from(JSON.stringify({
          resourceId: reqs.requirements.resourceId,
          txRef: 'mock-tx-' + Date.now()
        })).toString('base64');

        frameRes = await fetch(`/api/reels/${id}/frames?index=1`, {
          headers: { 'X402-Payment': mockPayment }
        });
      }

      if (frameRes.ok) {
        setError(null);
        setIsUnlocked(true);
      } else {
        throw new Error('Failed to unlock frames. Payment may be required.');
      }

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!reel) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
    </div>
  );

  const maxFrames = reel.frame_count;
  const currentUrl = currentFrame === 0 
    ? frameUrls[0] 
    : `/api/reels/${id}/frames?index=${currentFrame}`;

  return (
    <div className="space-y-12 animate-fade-in relative z-20 pb-20">
      
      {/* Back Button */}
      <Link href="/" className="inline-flex items-center text-neutral-400 hover:text-amber-400 transition-colors font-mono text-sm tracking-widest uppercase">
        <span className="mr-2">←</span> Return to Archive
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
        <div className="max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400 mb-4">{reel.title}</h2>
          <p className="text-lg text-neutral-400 leading-relaxed font-light">{reel.description}</p>
        </div>
        {isUnlocked ? (
          <div className="relative bg-emerald-950/30 text-emerald-500 font-serif text-lg py-3 px-8 rounded-full border border-emerald-500/30 flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Reel Unlocked
          </div>
        ) : (
          <button 
            onClick={handleUnlock}
            disabled={loading}
            className="relative group overflow-hidden bg-amber-600/10 hover:bg-amber-500/20 text-amber-500 hover:text-amber-300 font-serif text-lg py-3 px-8 rounded-full border border-amber-500/50 hover:border-amber-400 transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.1)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] disabled:opacity-50 flex-shrink-0"
          >
            <span className="relative z-10 flex items-center gap-3">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                  Unlock Reel • ${reel.price_usd}
                </>
              )}
            </span>
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 text-red-400 p-4 bg-red-950/20 border border-red-900/50 rounded-xl backdrop-blur-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p className="font-mono text-sm">{error}</p>
        </div>
      )}

      {/* The Bioscope Viewer */}
      <div className="relative max-w-4xl mx-auto mt-12">
        {/* Glow behind the player */}
        <div className="absolute -inset-4 bg-gradient-to-b from-amber-900/20 to-black rounded-3xl blur-2xl -z-10"></div>
        
        {/* Machine Housing */}
        <div className="bg-[#0c0c0c] border-2 border-[#2a2a2a] rounded-2xl p-4 shadow-2xl relative">
          
          {/* Reel Decorations */}
          <div className="absolute -top-12 -left-8 w-24 h-24 rounded-full border-[8px] border-neutral-800 bg-black flex items-center justify-center opacity-80 shadow-xl hidden md:flex">
            <div className="w-4 h-4 bg-neutral-700 rounded-full"></div>
            <div className="absolute inset-0 animate-[spin_10s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, transparent 0 45deg, #222 45deg 90deg, transparent 90deg 135deg, #222 135deg 180deg, transparent 180deg 225deg, #222 225deg 270deg, transparent 270deg 315deg, #222 315deg 360deg)'}}></div>
          </div>
          <div className="absolute -top-12 -right-8 w-24 h-24 rounded-full border-[8px] border-neutral-800 bg-black flex items-center justify-center opacity-80 shadow-xl hidden md:flex">
            <div className="w-4 h-4 bg-neutral-700 rounded-full"></div>
            <div className="absolute inset-0 animate-[spin_10s_linear_infinite_reverse]" style={{ background: 'conic-gradient(from 0deg, transparent 0 45deg, #222 45deg 90deg, transparent 90deg 135deg, #222 135deg 180deg, transparent 180deg 225deg, #222 225deg 270deg, transparent 270deg 315deg, #222 315deg 360deg)'}}></div>
          </div>

          {/* Screen */}
          <div className="aspect-video relative bg-black flex items-center justify-center overflow-hidden rounded-xl border border-white/5 shadow-[inset_0_0_100px_rgba(0,0,0,1)]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dust.png')] opacity-20 pointer-events-none z-20 mix-blend-screen"></div>
            <img 
              key={currentFrame}
              src={currentUrl} 
              alt="Frame" 
              className="w-full h-full object-cover sepia-[0.4] contrast-125 brightness-90 animate-[flicker_0.15s_infinite]" 
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 800 450" fill="%23111"><rect width="800" height="450" fill="%23111"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="24" fill="%23555">PAYMENT REQUIRED FOR FRAME ' + (currentFrame+1) + '</text></svg>';
              }}
            />
            {/* Vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] pointer-events-none z-30"></div>
          </div>
          
          {/* Controls */}
          <div className="flex justify-between items-center mt-6 px-6 pb-4 border-t border-white/5 pt-6">
            <button 
              onClick={() => setCurrentFrame(f => Math.max(0, f - 1))}
              className="text-neutral-500 hover:text-amber-400 disabled:opacity-20 transition-colors font-mono tracking-widest text-sm"
              disabled={currentFrame === 0}
            >
              ← REWIND
            </button>
            <div className="flex flex-col items-center">
              <span className="font-serif italic text-amber-500/80 text-xl tracking-widest">
                FRAME {currentFrame + 1}
              </span>
              <span className="text-neutral-600 font-mono text-[10px] tracking-widest mt-1">OF {maxFrames}</span>
            </div>
            <button 
              onClick={() => setCurrentFrame(f => Math.min(maxFrames - 1, f + 1))}
              className="text-neutral-500 hover:text-amber-400 disabled:opacity-20 transition-colors font-mono tracking-widest text-sm"
              disabled={currentFrame === maxFrames - 1}
            >
              CRANK →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
