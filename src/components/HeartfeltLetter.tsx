import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';
import { triggerHeartConfetti } from '../utils/confetti';
import { DEFAULT_HEARTFELT_LETTER } from '../data/defaultContent';
import { ScrollReveal } from './ScrollReveal';

export const HeartfeltLetter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Clear any legacy edited text so the author's permanent letter is always displayed
  useEffect(() => {
    localStorage.removeItem('danielle_birthday_letter');
  }, []);

  const handleOpenLetter = () => {
    setIsOpen(true);
    triggerHeartConfetti();
  };

  return (
    <motion.section
      id="letter"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      className="py-16 md:py-24 relative"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Scroll Reveal */}
        <ScrollReveal className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-200 text-pink-950 text-xs font-bold uppercase tracking-wider mb-2 border border-pink-300">
            <Heart className="w-3.5 h-3.5 fill-pink-600 text-pink-600" />
            <span>Straight From The Heart</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-neutral-900">
            A Letter For Danielle
          </h2>
          <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-lg mx-auto">
            Click the wax seal below to unwrap a heartfelt message written just for you, Danielle Sarah Festus.
          </p>
        </ScrollReveal>

        {/* Envelope / Letter Container with Scroll Reveal */}
        <ScrollReveal delay={0.15} distance={28}>
          <AnimatePresence mode="wait">
            {!isOpen ? (
              /* Sealed Envelope View */
              <motion.div
                key="sealed-envelope"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, y: -20 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-lg mx-auto"
              >
                <div
                  onClick={handleOpenLetter}
                  className="group cursor-pointer relative bg-gradient-to-br from-pink-200 via-rose-200 to-pink-300 rounded-2xl p-8 sm:p-12 border border-pink-400/90 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-center overflow-hidden"
                >
                  {/* Envelope flap lines */}
                  <div className="absolute inset-x-0 top-0 h-24 border-b border-pink-400/60 bg-pink-100/60 [clip-path:polygon(0_0,100%_0,50%_100%)]"></div>

                  {/* Heart Stamp */}
                  <div className="relative z-10 my-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-tr from-rose-700 via-pink-700 to-rose-800 text-white flex items-center justify-center shadow-lg shadow-rose-900/30 group-hover:scale-110 transition-transform duration-300 border-4 border-rose-300">
                      <span className="font-serif text-3xl font-bold tracking-widest text-amber-100">D</span>
                    </div>
                    <p className="text-xs font-bold text-rose-950 mt-3 uppercase tracking-widest">
                      Tap to Unseal Letter
                    </p>
                  </div>

                  <div className="relative z-10 pt-2 border-t border-pink-300/80">
                    <p className="text-xs text-neutral-600 italic font-medium">
                      To: Danielle Sarah Festus
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Unfolded Parchment / Letter View - Permanent and Uneditable */
              <motion.div
                key="open-letter"
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -20 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white/95 rounded-3xl p-6 sm:p-12 border border-pink-300/90 shadow-2xl backdrop-blur-md transition-all"
              >
                {/* Top Toolbar */}
                <div className="flex items-center justify-between border-b border-pink-200 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center">
                      <Heart className="w-4 h-4 fill-pink-600 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 font-serif">For Danielle Sarah Festus</h3>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-medium text-pink-900 hover:text-pink-950 px-3 py-1.5 rounded-lg bg-pink-100/80 hover:bg-pink-200/80 border border-pink-200 transition-colors cursor-pointer"
                  >
                    Fold Letter
                  </button>
                </div>

                {/* Permanent Uneditable Letter Content */}
                <div className="prose prose-pink max-w-none">
                  <div className="font-serif text-base sm:text-lg text-neutral-800 leading-relaxed sm:leading-loose whitespace-pre-line space-y-4 select-text">
                    {DEFAULT_HEARTFELT_LETTER}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollReveal>

      </div>
    </motion.section>
  );
};
