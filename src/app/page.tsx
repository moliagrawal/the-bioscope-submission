import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const res = await fetch('http://localhost:3000/api/reels', { cache: 'no-store' });
  let reels = [];
  try {
    reels = await res.json();
  } catch (e) {}

  return (
    <div className="space-y-8">
      <p className="text-xl text-neutral-300 border-b border-neutral-700 pb-4">Select a reel to view</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reels.map((reel: any) => (
          <Link href={\`/reel/\${reel.id}\`} key={reel.id} className="block group">
            <div className="bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700 hover:border-amber-500 transition-colors">
              <div className="aspect-video relative bg-neutral-900">
                <img 
                  src={\`/api/reels/\${reel.id}/preview\`} 
                  alt={reel.title} 
                  className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-white group-hover:text-amber-500">{reel.title}</h3>
                <p className="text-sm text-neutral-400 mt-1">{reel.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-amber-500/80 font-mono">Unlock: ${reel.price_usd}</span>
                  <span className="text-neutral-500">{reel.frame_count} frames</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
