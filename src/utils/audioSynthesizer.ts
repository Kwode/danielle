/**
 * Soft Acoustic & Music Box Synthesizer using Web Audio API.
 * Ensures zero-broken links, plays immediately upon user interaction,
 * and creates an enchanting romantic music-box / piano atmosphere.
 */

class AudioSynthesizerManager {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timer: number | null = null;
  private noteIndex = 0;
  private currentMode: 'birthday' | 'romance' | 'lullaby' = 'birthday';
  private masterGain: GainNode | null = null;
  private volume = 0.6;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  // Play a dreamy bell / music box tone
  private playBellNote(freq: number, duration = 1.2, timeOffset = 0) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime + timeOffset;

    const osc = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Warm soft harmonic overtone
    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(freq * 2, now);

    // Envelope: fast gentle attack, long dreamy exponential decay
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(0.35, now + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(noteGain);
    oscHarmonic.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc.start(now);
    oscHarmonic.start(now);
    osc.stop(now + duration);
    oscHarmonic.stop(now + duration);
  }

  // Happy birthday melody notes (C4, D4, E4, F4, G4, A4, B4, C5, etc.)
  private birthdayNotes = [
    { f: 261.63, d: 0.35 }, // Hap-
    { f: 261.63, d: 0.35 }, // py
    { f: 293.66, d: 0.7 },  // Birth-
    { f: 261.63, d: 0.7 },  // day
    { f: 349.23, d: 0.7 },  // to
    { f: 329.63, d: 1.2 },  // you
    { f: 0, d: 0.3 },

    { f: 261.63, d: 0.35 }, // Hap-
    { f: 261.63, d: 0.35 }, // py
    { f: 293.66, d: 0.7 },  // Birth-
    { f: 261.63, d: 0.7 },  // day
    { f: 392.00, d: 0.7 },  // to
    { f: 349.23, d: 1.2 },  // you
    { f: 0, d: 0.3 },

    { f: 261.63, d: 0.35 }, // Hap-
    { f: 261.63, d: 0.35 }, // py
    { f: 523.25, d: 0.7 },  // Birth-
    { f: 440.00, d: 0.7 },  // day
    { f: 349.23, d: 0.7 },  // dear
    { f: 329.63, d: 0.7 },  // Da-
    { f: 293.66, d: 1.2 },  // nielle
    { f: 0, d: 0.3 },

    { f: 466.16, d: 0.35 }, // Hap-
    { f: 466.16, d: 0.35 }, // py
    { f: 440.00, d: 0.7 },  // Birth-
    { f: 349.23, d: 0.7 },  // day
    { f: 392.00, d: 0.7 },  // to
    { f: 349.23, d: 1.5 },  // you!
    { f: 0, d: 0.6 },
  ];

  // Romantic arpeggio notes
  private romanceNotes = [
    { f: 349.23, d: 0.6 }, // F4
    { f: 440.00, d: 0.6 }, // A4
    { f: 523.25, d: 0.6 }, // C5
    { f: 659.25, d: 0.9 }, // E5
    { f: 523.25, d: 0.6 }, // C5
    { f: 440.00, d: 0.6 }, // A4

    { f: 392.00, d: 0.6 }, // G4
    { f: 493.88, d: 0.6 }, // B4
    { f: 587.33, d: 0.6 }, // D5
    { f: 698.46, d: 0.9 }, // F5
    { f: 587.33, d: 0.6 }, // D5
    { f: 493.88, d: 0.6 }, // B4

    { f: 329.63, d: 0.6 }, // E4
    { f: 392.00, d: 0.6 }, // G4
    { f: 493.88, d: 0.6 }, // B4
    { f: 659.25, d: 0.9 }, // E5
    { f: 493.88, d: 0.6 }, // B4
    { f: 392.00, d: 0.6 }, // G4

    { f: 293.66, d: 0.6 }, // D4
    { f: 349.23, d: 0.6 }, // F4
    { f: 440.00, d: 0.6 }, // A4
    { f: 587.33, d: 1.0 }, // D5
    { f: 440.00, d: 0.6 },
  ];

  public start(mode: 'birthday' | 'romance' | 'lullaby' = 'birthday') {
    this.initContext();
    this.stop();
    this.isPlaying = true;
    this.currentMode = mode;
    this.noteIndex = 0;

    const playLoop = () => {
      if (!this.isPlaying) return;

      const playlist = this.currentMode === 'birthday' ? this.birthdayNotes : this.romanceNotes;
      const current = playlist[this.noteIndex % playlist.length];

      if (current.f > 0) {
        this.playBellNote(current.f, current.d * 1.5);
      }

      this.noteIndex = (this.noteIndex + 1) % playlist.length;
      const delay = current.d * 750;

      this.timer = window.setTimeout(playLoop, delay);
    };

    playLoop();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioSynth = new AudioSynthesizerManager();
