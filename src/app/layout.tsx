import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'The Bioscope',
  description: 'Drop a Coin, Watch a Reel, Never Pay Twice.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-900 text-white font-sans antialiased p-8">
        <header className="max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-amber-500">The Bioscope</h1>
          <p className="text-neutral-400 mt-2 text-lg">Drop a Coin, Watch a Reel, Never Pay Twice.</p>
        </header>
        <main className="max-w-4xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
