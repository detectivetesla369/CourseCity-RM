'use client';

import { ArrowLeft, Maximize2, Pause, Play, Volume2 } from 'lucide-react';
import { useState } from 'react';

export default function VideoPlayer() {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      className="relative aspect-video min-h-[280px] w-full overflow-hidden rounded-[16px]"
      style={{ background: 'linear-gradient(145deg, #1a1f3a 0%, #2a3050 100%)' }}
    >
      {/* Back button */}
      <button
        type="button"
        className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-[8px] bg-white/10 px-3 py-2 text-[13px] text-white/80 backdrop-blur transition-colors duration-100 hover:bg-white/20"
        style={{ minHeight: '44px' }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* PiP avatar */}
      <div className="absolute right-4 top-4 z-10 rounded-full ring-2 ring-primary-200 ring-offset-1 ring-offset-[#2a3050]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-[11px] font-bold text-white">
          JD
        </div>
      </div>

      {/* Center play */}
      <button
        type="button"
        aria-label={playing ? 'Pause' : 'Play'}
        onClick={() => setPlaying(!playing)}
        className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-all duration-100 hover:bg-white/25 hover:scale-105"
      >
        {playing ? <Pause size={24} /> : <Play size={24} className="translate-x-[2px]" />}
      </button>

      {/* Bottom controls */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-3 bg-gradient-to-t from-black/40 to-transparent px-4 pb-4 pt-8">
        <button
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={() => setPlaying(!playing)}
          className="text-white transition-opacity duration-100 hover:opacity-80"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <span className="shrink-0 text-[13px] text-white/60">03:54 / 09:55</span>

        <div className="flex-1">
          <div className="h-1 w-full rounded-full bg-white/15">
            <div className="h-1 rounded-full bg-primary-500 transition-all" style={{ width: '40%' }} />
          </div>
        </div>

        <button
          type="button"
          aria-label="Volume"
          className="text-white/50 transition-colors duration-100 hover:text-white/80"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <Volume2 size={16} />
        </button>

        <button
          type="button"
          aria-label="Fullscreen"
          className="text-white/50 transition-colors duration-100 hover:text-white/80"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
}
