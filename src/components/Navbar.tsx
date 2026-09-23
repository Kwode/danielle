import React, { useState } from 'react';
import { Sparkles, Heart, Menu, X, Camera, Film, Cake, Mail, Volume2, VolumeX } from 'lucide-react';
import { triggerCelebration } from '../utils/confetti';

interface NavbarProps {
  isPlayingMusic: boolean;
  onToggleMusic: () => void;
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  isPlayingMusic,
  onToggleMusic,
  activeSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'hero', label: 'Welcome', icon: Sparkles },
    { id: 'letter', label: 'Heartfelt Letter', icon: Mail },
    { id: 'gallery', label: 'Photo Gallery', icon: Camera },
    { id: 'videos', label: 'Video Memories', icon: Film },
    { id: 'cake', label: 'Birthday Cake', icon: Cake },
  ];

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCelebrateClick = () => {
    triggerCelebration();
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-pink-200/90 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Monogram Brand */}
        <button
          onClick={() => handleNavClick('hero')}
          className="flex items-center gap-2 group text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-600 to-rose-600 text-white flex items-center justify-center font-serif text-lg font-bold shadow-md shadow-pink-400/40 group-hover:scale-105 transition-transform">
            D
          </div>
          <div>
            <div className="font-serif text-lg font-bold tracking-tight text-pink-950 group-hover:text-pink-700 transition-colors flex items-center gap-1.5">
              <span>Danielle Sarah Festus</span>
              <Heart className="w-3.5 h-3.5 text-pink-600 fill-pink-500 inline" />
            </div>
            <p className="text-[11px] text-pink-700 tracking-widest uppercase font-semibold">Birthday Edition</p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-pink-200/90 text-pink-950 border border-pink-300 font-semibold shadow-xs'
                    : 'text-neutral-700 hover:text-pink-800 hover:bg-pink-100/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-pink-700 fill-pink-300' : 'text-pink-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Music quick toggle pill */}
          <button
            id="nav-music-toggle-btn"
            onClick={onToggleMusic}
            title={isPlayingMusic ? 'Mute Music' : 'Play Music'}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
              isPlayingMusic
                ? 'bg-pink-600 text-white border-pink-500 shadow-sm shadow-pink-400 animate-pulse'
                : 'bg-white/90 text-pink-800 border-pink-300 hover:bg-pink-100/60'
            }`}
          >
            {isPlayingMusic ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">Music Playing</span>
                <span className="flex items-center gap-0.5 ml-0.5">
                  <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:0ms]"></span>
                  <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:150ms]"></span>
                  <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]"></span>
                </span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-pink-500" />
                <span className="hidden sm:inline">Play Music</span>
              </>
            )}
          </button>

          {/* Quick Confetti button */}
          <button
            id="celebrate-confetti-btn"
            onClick={handleCelebrateClick}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 text-white text-xs font-semibold shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Celebrate!</span>
          </button>

          {/* Mobile menu hamburger */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-neutral-700 hover:text-pink-700 hover:bg-pink-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-pink-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6 shadow-xl space-y-2 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 text-left cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-pink-200 text-pink-950 font-bold border border-pink-300'
                      : 'bg-pink-100/50 text-neutral-700 hover:bg-pink-100'
                  }`}
                >
                  <Icon className="w-4 h-4 text-pink-600" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={handleCelebrateClick}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Shower Confetti!</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
