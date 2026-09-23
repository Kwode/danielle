/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FloatingConfettiBg } from './components/FloatingConfettiBg';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { HeartfeltLetter } from './components/HeartfeltLetter';
import { PhotoGallery } from './components/PhotoGallery';
import { VideoMemories } from './components/VideoMemories';
import { InteractiveCake } from './components/InteractiveCake';
import { Footer } from './components/Footer';
import { MusicPlayerWidget } from './components/MusicPlayerWidget';

export default function App() {
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const [activeSection, setActiveSection] = useState('hero');

  // Ensure music starts on page load, or on very first touch/click/scroll if browser blocked zero-click autoplay
  useEffect(() => {
    const handleFirstInteraction = () => {
      setIsPlayingMusic(true);
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    window.addEventListener('click', handleFirstInteraction, { passive: true });
    window.addEventListener('scroll', handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
    };
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'letter', 'gallery', 'videos', 'cake'];
      const scrollPos = window.scrollY + 200;

      for (const s of sections) {
        const el = document.getElementById(s);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(s);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleMusic = () => {
    setIsPlayingMusic((prev) => !prev);
  };

  return (
    <div className="relative min-h-screen text-neutral-800 font-sans selection:bg-pink-600 selection:text-white overflow-x-hidden">
      {/* Dynamic Floating Confetti & Blush Gradient Background */}
      <FloatingConfettiBg />

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Sticky Nav */}
        <Navbar
          isPlayingMusic={isPlayingMusic}
          onToggleMusic={toggleMusic}
          activeSection={activeSection}
        />

        <main className="flex-1">
          {/* Hero Welcome */}
          <HeroSection
            onScrollTo={handleScrollTo}
            onStartMusic={() => setIsPlayingMusic(true)}
            isPlayingMusic={isPlayingMusic}
          />

          {/* Heartfelt Letter with Wax Seal */}
          <HeartfeltLetter />

          {/* Interactive Photo Gallery */}
          <PhotoGallery />

          {/* Video Memories */}
          <VideoMemories />

          {/* Celebratory Interactive Cake & Wishes */}
          <InteractiveCake />
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Floating Music Jukebox Player Widget */}
      <MusicPlayerWidget
        isPlaying={isPlayingMusic}
        onTogglePlay={toggleMusic}
      />
    </div>
  );
}
