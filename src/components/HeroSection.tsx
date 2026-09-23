import React from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, Cake, Mail, ArrowDown, Star } from 'lucide-react';
import { triggerCelebration, triggerHeartConfetti } from '../utils/confetti';
import { DANIELLE_NAME } from '../data/defaultContent';

interface HeroSectionProps {
  onScrollTo: (id: string) => void;
  onStartMusic: () => void;
  isPlayingMusic: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onScrollTo,
  onStartMusic,
  isPlayingMusic,
}) => {
  const handleHeroCelebrate = () => {
    triggerCelebration();
    triggerHeartConfetti();
    if (!isPlayingMusic) {
      onStartMusic();
    }
  };

  return (
    <section id="hero" className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Soft floating pill tag */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-200/90 border border-pink-300/90 text-pink-950 text-xs font-bold tracking-wider uppercase mb-6 shadow-xs animate-bounce [animation-duration:3s]"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-700" />
          <span>A Special Celebration For My One & Only</span>
          <Sparkles className="w-3.5 h-3.5 text-pink-700" />
        </motion.div>

        {/* Big Romantic Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold text-neutral-900 tracking-tight leading-[1.1] mb-4"
        >
          Happy Birthday, <br />
          <span className="bg-gradient-to-r from-pink-700 via-rose-600 to-pink-600 bg-clip-text text-transparent italic font-serif">
            {DANIELLE_NAME}
          </span>
        </motion.h1>

        {/* Sweet Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto text-lg sm:text-xl text-neutral-700 font-normal leading-relaxed mb-8"
        >
          To the girl whose smile lights up every single day and whose heart is as timid as hard as she makes it look. Today is all about you, your laughter, your beauty, and your boundless dreams, and your birkenstock slippers -- even though you copied me.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-14"
        >
          <button
            id="hero-celebrate-btn"
            onClick={handleHeroCelebrate}
            className="px-6 py-3.5 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 text-white font-semibold text-sm sm:text-base shadow-md shadow-pink-500/30 hover:shadow-pink-400/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-white animate-pulse" />
            <span>Celebrate Danielle! 🎉</span>
          </button>

          <button
            id="hero-read-letter-btn"
            onClick={() => onScrollTo('letter')}
            className="px-6 py-3.5 rounded-full bg-white/95 hover:bg-pink-100/90 text-pink-950 font-semibold text-sm sm:text-base border border-pink-300 shadow-xs hover:border-pink-400 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-pink-600" />
            <span>Open Letter</span>
          </button>

          <button
            id="hero-cake-btn"
            onClick={() => onScrollTo('cake')}
            className="px-6 py-3.5 rounded-full bg-rose-200/90 hover:bg-rose-300 text-rose-950 font-semibold text-sm sm:text-base border border-rose-300/80 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Cake className="w-4 h-4 text-rose-700" />
            <span>Blow The Candles</span>
          </button>
        </motion.div>

        {/* Floating Polaroid & Highlight Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-xl mx-auto"
        >
          {/* Decorative Pink Glow */}
          <div className="absolute -inset-2 bg-gradient-to-r from-pink-400 to-rose-400 rounded-3xl blur-xl opacity-35 animate-pulse"></div>

          {/* Polaroid Frame */}
          <div className="relative bg-white/95 rounded-2xl p-4 sm:p-6 shadow-xl border border-pink-200 transform hover:-rotate-1 transition-transform duration-300">
            {/* Top Tape Graphic */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-pink-300/80 backdrop-blur-xs rounded-xs transform -rotate-2 border border-pink-400/70"></div>

            <div className="relative overflow-hidden rounded-xl aspect-[16/10] bg-rose-100 group">
              <img
                src="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80"
                alt="Danielle Sarah Festus Celebration"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent flex items-end p-4">
                <div className="text-left text-white">
                  <span className="px-2.5 py-0.5 rounded-full bg-pink-600/90 text-[10px] font-semibold tracking-wider uppercase backdrop-blur-xs mb-1 inline-block">
                    Forever Cherished
                  </span>
                  <p className="font-serif text-lg sm:text-xl font-bold">
                    To Danielle, with love 💕
                  </p>
                </div>
              </div>
            </div>

            {/* Polaroid Bottom Note */}
            <div className="pt-4 text-center">
              <p className="font-script text-2xl sm:text-3xl text-pink-800 tracking-wide">
                “Still you, after all this time.”
              </p>
              <div className="mt-2 flex items-center justify-center gap-4 text-xs text-neutral-500">
                <span className="flex items-center gap-1 text-pink-700 font-medium">
                  <Star className="w-3.5 h-3.5 fill-pink-600 text-pink-600" /> Danielle Sarah Festus
                </span>
                <span>•</span>
                <span>Happy Birthday Queen</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Down Arrow Indicator */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          onClick={() => onScrollTo('letter')}
          className="mt-12 inline-flex flex-col items-center text-pink-700 hover:text-pink-900 transition-colors animate-bounce cursor-pointer"
        >
          <span className="text-xs font-semibold mb-1">Scroll to open your birthday letter</span>
          <ArrowDown className="w-4 h-4" />
        </motion.button>

      </div>
    </section>
  );
};

