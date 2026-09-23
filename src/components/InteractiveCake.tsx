import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Flame, Wind, RotateCcw, Heart, Star } from 'lucide-react';
import { triggerCelebration, triggerFireworks, triggerHeartConfetti } from '../utils/confetti';
import { DANIELLE_NAME } from '../data/defaultContent';
import { ScrollReveal } from './ScrollReveal';

interface CandleState {
  id: number;
  isLit: boolean;
}

export const InteractiveCake: React.FC = () => {
  const [candles, setCandles] = useState<CandleState[]>([
    { id: 1, isLit: true },
    { id: 2, isLit: true },
    { id: 3, isLit: true },
    { id: 4, isLit: true },
    { id: 5, isLit: true },
  ]);
  const [wish, setWish] = useState('');
  const [isWishBlown, setIsWishBlown] = useState(false);

  const areAllCandlesLit = candles.some((c) => c.isLit);

  const handleBlowCandles = () => {
    setCandles(candles.map((c) => ({ ...c, isLit: false })));
    setIsWishBlown(true);
    triggerFireworks();
    triggerCelebration();
    triggerHeartConfetti();
  };

  const handleRelight = () => {
    setCandles(candles.map((c) => ({ ...c, isLit: true })));
    setIsWishBlown(false);
  };

  const toggleSingleCandle = (id: number) => {
    setCandles(
      candles.map((c) => (c.id === id ? { ...c, isLit: !c.isLit } : c))
    );
  };

  return (
    <motion.section
      id="cake"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      className="py-16 md:py-24 relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Header with Scroll Reveal */}
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-neutral-900">
            Make a Wish, Danielle
          </h2>
          <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-lg mx-auto">
            Light the candles, whisper your secret birthday wish into your heart, and blow them out!
          </p>
        </ScrollReveal>

        {/* Cake Stage Card with Scroll Reveal */}
        <ScrollReveal delay={0.15} distance={25}>
          <div className="mt-12 bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-12 border border-pink-300/90 shadow-2xl relative max-w-2xl mx-auto">
            
            {/* Cake Illustration in Pink & Rose Gold */}
            <div className="relative py-8 flex flex-col items-center justify-center select-none">
              
              {/* Candles Row */}
              <div className="flex items-end justify-center gap-5 sm:gap-8 mb-[-4px] z-20">
                {candles.map((candle) => (
                  <div
                    key={candle.id}
                    onClick={() => toggleSingleCandle(candle.id)}
                    className="flex flex-col items-center cursor-pointer group"
                    title="Click candle to toggle flame"
                  >
                    {/* Flame / Smoke */}
                    <div className="h-8 flex items-center justify-center">
                      {candle.isLit ? (
                        <div className="relative">
                          {/* Glow effect */}
                          <div className="absolute -inset-2 bg-amber-400/40 rounded-full blur-xs animate-ping"></div>
                          <div className="w-4 h-6 bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-200 rounded-full animate-bounce [animation-duration:800ms] shadow-sm shadow-amber-300"></div>
                        </div>
                      ) : (
                        <div className="w-1.5 h-4 bg-neutral-300 rounded-full opacity-60 animate-pulse"></div>
                      )}
                    </div>

                    {/* Wick */}
                    <div className="w-0.5 h-2.5 bg-neutral-700"></div>

                    {/* Candle Stick */}
                    <div className="w-3 sm:w-3.5 h-14 sm:h-16 rounded-t-sm bg-gradient-to-b from-pink-400 via-rose-400 to-pink-500 shadow-sm border border-pink-300 relative overflow-hidden">
                      {/* Spiral stripes on candle */}
                      <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(45deg,#ffffff,#ffffff_3px,transparent_3px,transparent_6px)]"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top Tier */}
              <div className="w-48 sm:w-56 h-16 sm:h-20 bg-gradient-to-r from-pink-300 via-pink-200 to-rose-300 rounded-t-2xl border-t-4 border-x-4 border-white shadow-md relative z-10 flex items-center justify-center">
                {/* Dripping pink icing */}
                <div className="absolute top-0 inset-x-0 h-4 bg-rose-400/90 rounded-b-xl"></div>
                {/* Pearl toppings */}
                <div className="absolute -top-2 inset-x-4 flex justify-between">
                  {[...Array(6)].map((_, i) => (
                    <span key={i} className="w-3 h-3 rounded-full bg-rose-500 shadow-xs border border-white"></span>
                  ))}
                </div>
                <span className="font-script text-xl sm:text-2xl text-pink-900 font-bold">
                  Danielle 💕
                </span>
              </div>

              {/* Middle Tier */}
              <div className="w-64 sm:w-72 h-16 sm:h-20 bg-gradient-to-r from-rose-300 via-pink-300 to-rose-400 border-t-2 border-x-4 border-white shadow-md relative z-0 flex items-center justify-center">
                <div className="absolute top-0 inset-x-0 h-3 bg-pink-500/70 rounded-b-lg"></div>
                <p className="font-serif text-xs uppercase tracking-widest text-rose-950 font-bold">
                  ★ Sarah Festus ★
                </p>
              </div>

              {/* Bottom Base Tier */}
              <div className="w-80 sm:w-92 h-20 sm:h-24 bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400 rounded-b-xl border-x-4 border-b-4 border-white shadow-xl relative flex items-center justify-center">
                {/* Decorative Swirls */}
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 fill-pink-600 text-pink-600" />
                  <span className="font-serif text-sm tracking-widest uppercase font-bold text-pink-950">
                    Happy Birthday Queen
                  </span>
                  <Heart className="w-4 h-4 fill-pink-600 text-pink-600" />
                </div>
              </div>

              {/* Cake Stand */}
              <div className="w-96 sm:w-[420px] h-4 bg-gradient-to-r from-neutral-200 via-white to-neutral-200 rounded-full shadow-lg border border-neutral-300 mt-1"></div>
              <div className="w-32 h-6 bg-gradient-to-b from-neutral-300 to-neutral-200 rounded-b-lg shadow-sm"></div>
            </div>

            {/* Secret Wish Input Field */}
            <div className="mt-6 max-w-md mx-auto">
              <AnimatePresence mode="wait">
                {!isWishBlown ? (
                  <motion.div
                    key="wish-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    <input
                      type="text"
                      value={wish}
                      onChange={(e) => setWish(e.target.value)}
                      placeholder="Type a birthday wish in secret (optional)..."
                      className="w-full px-4 py-2.5 rounded-full border border-pink-300 text-xs sm:text-sm bg-white/95 text-center focus:ring-2 focus:ring-pink-500 focus:outline-none placeholder:text-neutral-400"
                    />

                    <div className="flex items-center justify-center gap-3">
                      <button
                        id="blow-candles-btn"
                        onClick={handleBlowCandles}
                        disabled={!areAllCandlesLit}
                        className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white font-semibold text-sm shadow-md shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Wind className="w-4 h-4" />
                        <span>Blow Out Candles! 🎂</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Wish Blown Celebration Banner */
                  <motion.div
                    key="wish-blown"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-pink-200 via-rose-100 to-pink-200 border border-pink-300 space-y-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-rose-600 text-white mx-auto flex items-center justify-center shadow-md">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900">
                      Your Wish Has Flown To The Heavens! ✨
                    </h3>
                    {wish ? (
                      <p className="font-serif italic text-base text-pink-950 font-medium">
                        “{wish}”
                      </p>
                    ) : (
                      <p className="text-sm text-neutral-700 font-medium">
                        May every single joy, peace, and blessing find you this year, Danielle Sarah Festus!
                      </p>
                    )}

                    <div className="pt-3 flex items-center justify-center gap-3">
                      <button
                        onClick={handleRelight}
                        className="px-4 py-2 rounded-full bg-white text-pink-900 text-xs font-semibold border border-pink-300 hover:bg-pink-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Light Candles Again</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerCelebration();
                          triggerHeartConfetti();
                        }}
                        className="px-4 py-2 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Heart className="w-3.5 h-3.5 fill-white" />
                        <span>More Confetti!</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </ScrollReveal>

      </div>
    </motion.section>
  );
};
