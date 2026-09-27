import './globals.css';
import { ReactNode } from 'react';
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata = {
  title: 'The Bioscope | Vintage Reels',
  description: 'Drop a Coin, Watch a Reel, Never Pay Twice.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-[#0a0a0a] text-neutral-100 font-sans antialiased relative selection:bg-amber-500/30">
        
        {/* Vintage Film Grain Overlay & Lighting effects */}
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
        <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full mix-blend-screen"></div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <header className="w-full py-10 px-8 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-40">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600 font-serif drop-shadow-sm">
                  The Bioscope
                </h1>
                <p className="text-neutral-400 mt-2 text-sm md:text-base tracking-wide font-light uppercase letter-spacing-2">
                  Drop a Coin. Watch a Reel. Never Pay Twice.
                </p>
              </div>
            </div>
          </header>
          
          <main className="flex-1 max-w-6xl w-full mx-auto p-8 pt-12">
            {children}
          </main>
          
          <footer className="w-full py-8 text-center border-t border-white/5 mt-auto">
            <p className="text-neutral-600 text-sm font-light">
              Crafted for Road to Devcon VI. Powered by x402.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
