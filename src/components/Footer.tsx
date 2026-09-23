import React from 'react';
import { Heart, ArrowUp, Sparkles } from 'lucide-react';
import { DANIELLE_NAME } from '../data/defaultContent';
import { ScrollReveal } from './ScrollReveal';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative border-t border-pink-300 bg-white/85 backdrop-blur-md py-12 text-center text-neutral-600">
      <ScrollReveal className="max-w-4xl mx-auto px-4 space-y-4">
        
        {/* Monogram Badge */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-600 to-rose-600 text-white font-serif text-xl font-bold mx-auto flex items-center justify-center shadow-md shadow-pink-500/25">
          D
        </div>

        <div>
          <h3 className="font-serif text-2xl font-bold text-neutral-900">
            Happy Birthday, {DANIELLE_NAME}
          </h3>
          <p className="font-script text-3xl text-pink-800 mt-1">
            Forever my favorite person in the world
          </p>
        </div>

        <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed font-medium">
          May this special year bring you boundless laughter, immense triumphs, radiant health, and unforgettable joy. You are deeply cherished.
        </p>

        <div className="pt-4 flex items-center justify-center gap-4">
          <button
            onClick={scrollToTop}
            className="px-4 py-1.5 rounded-full bg-pink-200 hover:bg-pink-300 text-pink-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-pink-300"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Back to Top</span>
          </button>
        </div>

        <div className="pt-6 border-t border-pink-200 flex items-center justify-center gap-1 text-[11px] text-neutral-500">
          <span>Made with all my heart for Danielle</span>
          <Heart className="w-3 h-3 text-pink-600 fill-pink-600 inline" />
        </div>

      </ScrollReveal>
    </footer>
  );
};
