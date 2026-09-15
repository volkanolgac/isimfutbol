/**
 * High-Fidelity Web Audio Synthesizer for i-SiM 1. Futbol Ligi:
 * - Authentic Fox 40 Referee Whistle (dual acoustic chamber beating, noise turbulence, pea flutter)
 * - Dynamic Stadium Crowd Atmosphere (continuous open-air ambient murmur + anticipation swells)
 * - Explosive Stadium Goal Celebration Roar (two-stage stadium surge with reverberation)
 * - Physical Ball Kick & Crossbar/Post Impact Sounds
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientRunning: boolean = false;
  private ambientSources: AudioNode[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockHandler = () => {
        this.unlock();
      };
      window.addEventListener('click', unlockHandler, { capture: true, passive: true });
      window.addEventListener('touchstart', unlockHandler, { capture: true, passive: true });
      window.addEventListener('keydown', unlockHandler, { capture: true, passive: true });
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    const ctx = this.getContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          if (!this.isMuted && !this.ambientRunning) {
            this.startCrowdAmbiance();
          }
        }).catch(() => {});
      } else if (!this.isMuted && !this.ambientRunning) {
        this.startCrowdAmbiance();
      }
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopCrowdAmbiance();
    } else {
      this.startCrowdAmbiance();
      this.playWhistle('short');
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Smooth, authentic stadium referee whistle
   * Uses gentle dual sine/warm triangle tones with soft resonance (no harsh screech)
   */
  public playWhistle(pattern: 'short' | 'long' | 'double' | 'triple' = 'short') {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    if (pattern === 'double') {
      this.synthesizeSingleWhistle(ctx, 0.14, 0, 2200);
      this.synthesizeSingleWhistle(ctx, 0.22, 0.18, 2300);
      return;
    }
    if (pattern === 'triple') {
      this.synthesizeSingleWhistle(ctx, 0.12, 0, 2200);
      this.synthesizeSingleWhistle(ctx, 0.12, 0.16, 2250);
      this.synthesizeSingleWhistle(ctx, 0.35, 0.32, 2350);
      return;
    }

    const duration = pattern === 'long' ? 0.45 : 0.18;
    this.synthesizeSingleWhistle(ctx, duration, 0, 2250);
  }

  private synthesizeSingleWhistle(ctx: AudioContext, duration: number, delaySec: number, baseFreq: number = 2250) {
    const startTime = ctx.currentTime + delaySec;

    // 1. Dual harmonic warm acoustic tones (2250Hz & 2450Hz) - lower and smoother than harsh high frequencies
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(baseFreq, startTime);
    osc2.frequency.setValueAtTime(baseFreq * 1.07, startTime);

    // 2. Gentle air turbulence through soft bandpass filter
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.2;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(baseFreq, startTime);
    noiseFilter.Q.setValueAtTime(2.0, startTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.02, startTime);

    // 3. Gentle flutter LFO (~20 Hz)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(20, startTime);
    lfoGain.gain.setValueAtTime(30, startTime);
    lfo.connect(osc1.frequency);
    lfo.connect(osc2.frequency);

    // 4. Smooth, soft envelope - prevents clicking or ear-piercing sharpness
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, startTime);
    // Smooth attack
    masterGain.gain.linearRampToValueAtTime(0.09, startTime + 0.03);
    // Gentle sustain
    masterGain.gain.setValueAtTime(0.08, startTime + duration - 0.04);
    // Soft exponential decay
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Gentle lowpass to round off piercing trebles
    const smoothFilter = ctx.createBiquadFilter();
    smoothFilter.type = 'lowpass';
    smoothFilter.frequency.setValueAtTime(3000, startTime);

    // Wiring
    osc1.connect(smoothFilter);
    osc2.connect(smoothFilter);
    smoothFilter.connect(masterGain);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    masterGain.connect(ctx.destination);

    // Trigger
    lfo.start(startTime);
    osc1.start(startTime);
    osc2.start(startTime);
    noise.start(startTime);

    const stopTime = startTime + duration + 0.02;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    noise.stop(stopTime);
    lfo.stop(stopTime);
  }

  /**
   * Continuous Open-Air Stadium Crowd Ambiance
   * Generates a realistic stadium murmur with subtle cheers and fan singing
   */
  public startCrowdAmbiance() {
    if (this.isMuted || this.ambientRunning) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      this.stopCrowdAmbiance();

      // 4-second looping pink noise buffer for ambient stadium murmur
      const bufferLen = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(2, bufferLen, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferLen; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2) * 0.25;
        }
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Resonant stadium acoustics filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(550, ctx.currentTime);
      filter.Q.setValueAtTime(0.85, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.25, ctx.currentTime); // Slow breathing crowd swell
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(150, ctx.currentTime);
      lfo.connect(filter.frequency);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 1.2);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      lfo.start();

      this.ambientGain = gain;
      this.ambientSources = [noiseSource, lfo, filter];
      this.ambientRunning = true;
    } catch (e) {
      console.warn('Ambient crowd error:', e);
    }
  }

  public stopCrowdAmbiance() {
    this.ambientRunning = false;
    this.ambientSources.forEach(src => {
      try {
        if ('stop' in src && typeof (src as any).stop === 'function') {
          (src as any).stop();
        }
        src.disconnect();
      } catch (e) {}
    });
    this.ambientSources = [];
    this.ambientGain = null;
  }

  /**
   * Ball kick sound - punchy contact sound with turf thump
   */
  public playKick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }

  /**
   * Metallic post / crossbar impact
   */
  public playPost() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1450, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  /**
   * Full Stadium Goal Celebration!
   * Warm, euphoric stadium celebration with harmonic chords & deep crowd roar (non-irritating, low resonance)
   */
  public playGoalRoar() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // 1. Soft referee goal whistle confirmation
    this.playWhistle('long');

    // 2. Warm stadium celebration chime (triads: C major - 261.63Hz, 329.63Hz, 392.00Hz, 523.25Hz)
    const chimeFrequencies = [261.63, 329.63, 392.0, 523.25];
    chimeFrequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);

      const startTime = ctx.currentTime + idx * 0.06;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.06, startTime + 0.08);
      gain.gain.setValueAtTime(0.05, startTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 1.65);
    });

    // 3. Warm Stadium Crowd Celebration Roar (lowered formant, no harsh hiss)
    const bufferSize = Math.floor(ctx.sampleRate * 2.8);
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.22;
      }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Formant filters to emulate cheering voices softly
    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.setValueAtTime(450, ctx.currentTime);

    const bandFilter = ctx.createBiquadFilter();
    bandFilter.type = 'bandpass';
    bandFilter.frequency.setValueAtTime(700, ctx.currentTime);
    bandFilter.Q.setValueAtTime(1.2, ctx.currentTime);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.01, ctx.currentTime);
    // Smooth roar surge in 350ms
    masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.35);
    // Sustained cheering
    masterGain.gain.setValueAtTime(0.15, ctx.currentTime + 1.4);
    // Stadium reverberation fade
    masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.8);

    noise.connect(lowFilter);
    noise.connect(bandFilter);
    lowFilter.connect(masterGain);
    bandFilter.connect(masterGain);
    masterGain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 2.8);
  }
}

export const soundManager = new SoundSynthesizer();
