import Link from 'next/link';
import { getAllReels } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let reels: any[] = [];
  try {
    reels = getAllReels();
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
        <h2 className="text-2xl md:text-3xl font-serif text-neutral-200">
          Available Collections
        </h2>
        <span className="text-sm font-mono text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          {reels.length} Reels Loaded
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reels.map((reel: any) => (
          <Link href={`/reel/${reel.id}`} key={reel.id} className="block group cursor-pointer relative outline-none">
            {/* Ambient hover glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
            
            <div className="relative bg-[#111111] rounded-2xl overflow-hidden border border-white/10 group-hover:border-amber-500/50 transition-all duration-300 transform group-hover:-translate-y-1 shadow-2xl flex flex-col h-full">
              
              {/* Image Container */}
              <div className="aspect-video relative bg-black overflow-hidden group-hover:shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                <img 
                  src={`/api/reels/${reel.id}/preview`} 
                  alt={reel.title} 
                  className="object-cover w-full h-full opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out grayscale group-hover:grayscale-0 sepia-[0.3]"
                />
                
                {/* Floating Price Tag */}
                <div className="absolute top-4 right-4 z-20">
                  <div className="backdrop-blur-md bg-black/40 border border-white/10 text-amber-400 font-mono text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                    ${reel.price_usd}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1 relative z-20">
                <h3 className="text-xl font-serif font-semibold text-white group-hover:text-amber-400 transition-colors">{reel.title}</h3>
                <p className="text-sm text-neutral-400 mt-3 leading-relaxed flex-1">{reel.description}</p>
                
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                  <span className="text-amber-500/80 font-mono tracking-wider text-xs font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    WATCH REEL
                  </span>
                  <span className="text-neutral-500 font-mono text-xs bg-white/5 px-2 py-1 rounded">{reel.frame_count} FRAMES</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
