import {
  AudioEngineSettings,
  BibleVerse,
  RagaOption,
  VoiceOption,
  RhythmPattern,
  BackgroundMusicStyle,
} from '../types';
import { RAGA_OPTIONS, VOICE_OPTIONS } from '../data/teluguBibleData';

export type PlaybackCallback = (state: {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentVerseIndex: number;
  currentLineIndex: number;
  isPaused: boolean;
}) => void;

export class TeluguAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;

  // Primary Gains
  private masterGain: GainNode | null = null;
  private vocalGain: GainNode | null = null;
  private accompGain: GainNode | null = null;
  private tanpuraGain: GainNode | null = null;
  private rhythmGain: GainNode | null = null;

  // Effects Nodes
  private convolverNode: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayFilterNode: BiquadFilterNode | null = null;
  private delayWetGain: GainNode | null = null;

  // Chorus Nodes
  private chorusDelayNode: DelayNode | null = null;
  private chorusLfo: OscillatorNode | null = null;
  private chorusLfoGain: GainNode | null = null;
  private chorusWetGain: GainNode | null = null;

  // Equalizer & Dynamics Nodes
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private limiterNode: DynamicsCompressorNode | null = null;

  // Active Playback State
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private verses: BibleVerse[] = [];
  private currentVerseIndex: number = 0;
  private currentLineIndex: number = 0;
  private elapsedTime: number = 0;
  private totalDuration: number = 0;

  // Default Soothing & Devotional Settings
  private settings: AudioEngineSettings = {
    speed: 1.0,
    pitchSemi: 0,
    masterVolume: 0.9,
    vocalVolume: 1.0,
    accompanimentVolume: 0.38, // Gentle, soothing worship accompaniment
    tanpuraVolume: 0.2,
    voiceId: 'priya_melodic',
    ragaId: 'mohanam',

    // Soothing Background Music Defaults
    bgMusicStyle: 'worship_piano', // Christian Worship Piano & Silky Strings Pad
    bgMusicMuted: false,

    // Listening Scope (Whole Chapter vs Individual Verse)
    listenMode: 'chapter',
    repeatMode: 'none',
    autoAdvanceVerse: true,

    // Devotional Effects Defaults
    reverbEnabled: true,
    reverbLevel: 0.45,
    reverbType: 'cathedral',

    echoEnabled: true,
    echoTime: 0.32,
    echoFeedback: 0.28,
    echoLevel: 0.22,

    chorusEnabled: true,
    chorusLevel: 0.3,

    rhythmEnabled: false, // OFF by default to eliminate harsh rhythmic clicking
    rhythmPattern: 'adi_tala',
    rhythmVolume: 0.25,

    fluteEnabled: false, // OFF by default to prevent clashing notes
    fluteVolume: 0.25,

    eqBass: 2.0,
    eqTreble: 2.5,

    vocalMode: 'gemini_ai',
  };

  // Timers and loop references
  private playbackInterval: number | null = null;
  private melodyTimeout: number | null = null;
  private tanpuraOscillators: OscillatorNode[] = [];
  private tanpuraRunning: boolean = false;
  private rhythmInterval: number | null = null;
  private rhythmStep: number = 0;
  private audioBufferSource: AudioBufferSourceNode | null = null;
  private speechUtterance: SpeechSynthesisUtterance | null = null;

  private onStateChange: PlaybackCallback | null = null;

  constructor() {
    // Lazy initialisation on user gesture
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master bus & analyser
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      this.masterGain = this.ctx.createGain();
      this.vocalGain = this.ctx.createGain();
      this.accompGain = this.ctx.createGain();
      this.tanpuraGain = this.ctx.createGain();
      this.rhythmGain = this.ctx.createGain();

      // Build EQ & Limiter
      this.bassFilter = this.ctx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.midFilter = this.ctx.createBiquadFilter();
      this.midFilter.type = 'peaking';
      this.midFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      this.midFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.trebleFilter = this.ctx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.setValueAtTime(5500, this.ctx.currentTime);

      this.limiterNode = this.ctx.createDynamicsCompressor();
      this.limiterNode.threshold.setValueAtTime(-1.5, this.ctx.currentTime);
      this.limiterNode.knee.setValueAtTime(3.0, this.ctx.currentTime);
      this.limiterNode.ratio.setValueAtTime(12.0, this.ctx.currentTime);
      this.limiterNode.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.limiterNode.release.setValueAtTime(0.12, this.ctx.currentTime);

      // Reverb Engine (Convolver with synthetic room impulse response)
      this.convolverNode = this.ctx.createConvolver();
      this.reverbWetGain = this.ctx.createGain();
      this.updateReverbImpulse(this.settings.reverbType);

      // Delay / Echo Engine
      this.delayNode = this.ctx.createDelay(2.0);
      this.delayNode.delayTime.setValueAtTime(this.settings.echoTime, this.ctx.currentTime);

      this.delayFeedbackGain = this.ctx.createGain();
      this.delayFeedbackGain.gain.setValueAtTime(this.settings.echoFeedback, this.ctx.currentTime);

      this.delayFilterNode = this.ctx.createBiquadFilter();
      this.delayFilterNode.type = 'lowpass';
      this.delayFilterNode.frequency.setValueAtTime(2400, this.ctx.currentTime);

      this.delayWetGain = this.ctx.createGain();

      // Loop delay with damping filter
      this.delayNode.connect(this.delayFilterNode);
      this.delayFilterNode.connect(this.delayFeedbackGain);
      this.delayFeedbackGain.connect(this.delayNode);
      this.delayFilterNode.connect(this.delayWetGain);

      // Chorus Engine
      this.chorusDelayNode = this.ctx.createDelay(0.1);
      this.chorusDelayNode.delayTime.setValueAtTime(0.025, this.ctx.currentTime);

      this.chorusLfo = this.ctx.createOscillator();
      this.chorusLfoGain = this.ctx.createGain();
      this.chorusLfo.type = 'sine';
      this.chorusLfo.frequency.setValueAtTime(0.8, this.ctx.currentTime);
      this.chorusLfoGain.gain.setValueAtTime(0.002, this.ctx.currentTime);
      this.chorusLfo.connect(this.chorusLfoGain);
      this.chorusLfoGain.connect(this.chorusDelayNode.delayTime);
      this.chorusLfo.start();

      this.chorusWetGain = this.ctx.createGain();
      this.chorusDelayNode.connect(this.chorusWetGain);

      // Connect vocal to chorus
      this.vocalGain.connect(this.chorusDelayNode);

      // Connect dry sources to master bus
      const dryBus = this.ctx.createGain();
      this.vocalGain.connect(dryBus);
      this.accompGain.connect(dryBus);
      this.tanpuraGain.connect(dryBus);
      this.rhythmGain.connect(dryBus);

      // Sends to Reverb
      this.vocalGain.connect(this.convolverNode);
      this.accompGain.connect(this.convolverNode);
      this.rhythmGain.connect(this.convolverNode);
      this.convolverNode.connect(this.reverbWetGain);

      // Sends to Delay
      this.vocalGain.connect(this.delayNode);
      this.accompGain.connect(this.delayNode);

      // Mix Dry + Reverb + Delay + Chorus into EQ chain
      dryBus.connect(this.bassFilter);
      this.reverbWetGain.connect(this.bassFilter);
      this.delayWetGain.connect(this.bassFilter);
      this.chorusWetGain.connect(this.bassFilter);

      this.bassFilter.connect(this.midFilter);
      this.midFilter.connect(this.trebleFilter);
      this.trebleFilter.connect(this.limiterNode);
      this.limiterNode.connect(this.masterGain);

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.applyGains();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generate synthetic impulse response for authentic church / temple acoustics
  private updateReverbImpulse(type: 'cathedral' | 'temple' | 'sanctuary' | 'intimate') {
    if (!this.ctx || !this.convolverNode) return;

    const rate = this.ctx.sampleRate;
    let duration = 3.0;
    let decay = 3.0;

    switch (type) {
      case 'cathedral':
        duration = 3.8;
        decay = 2.8;
        break;
      case 'temple':
        duration = 2.6;
        decay = 2.2;
        break;
      case 'sanctuary':
        duration = 1.8;
        decay = 1.8;
        break;
      case 'intimate':
        duration = 0.9;
        decay = 1.2;
        break;
    }

    const length = Math.floor(rate * duration);
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const env = Math.pow(1 - n, decay);
      left[i] = (Math.random() * 2 - 1) * env;
      right[i] = (Math.random() * 2 - 1) * env;
    }

    this.convolverNode.buffer = impulse;
  }

  public setCallback(cb: PlaybackCallback) {
    this.onStateChange = cb;
  }

  public updateSettings(newSettings: Partial<AudioEngineSettings>) {
    const prevReverbType = this.settings.reverbType;
    const prevBgStyle = this.settings.bgMusicStyle;
    const prevMuted = this.settings.bgMusicMuted;

    this.settings = { ...this.settings, ...newSettings };

    if (this.ctx && newSettings.reverbType && newSettings.reverbType !== prevReverbType) {
      this.updateReverbImpulse(newSettings.reverbType);
    }

    this.applyGains();

    // Restart or stop tanpura based on background style
    if (this.isPlaying) {
      if (this.settings.bgMusicMuted || this.settings.bgMusicStyle !== 'soothing_tanpura') {
        this.stopTanpura();
      } else if (
        (newSettings.bgMusicStyle === 'soothing_tanpura' && prevBgStyle !== 'soothing_tanpura') ||
        (prevMuted && !this.settings.bgMusicMuted)
      ) {
        this.startTanpura();
      }
    }

    if (this.audioBufferSource) {
      const rate = this.settings.speed * Math.pow(2, this.settings.pitchSemi / 12);
      this.audioBufferSource.playbackRate.value = Math.max(0.2, Math.min(3.0, rate));
    }

    this.notifyState();
  }

  public getSettings(): AudioEngineSettings {
    return { ...this.settings };
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  private applyGains() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Is background music active or muted?
    const isBgActive = !this.settings.bgMusicMuted && this.settings.bgMusicStyle !== 'vocals_only';
    const accompVol = isBgActive ? this.settings.accompanimentVolume : 0;
    const tanpuraVol =
      isBgActive && this.settings.bgMusicStyle === 'soothing_tanpura'
        ? this.settings.tanpuraVolume
        : 0;
    const rhythmVol =
      isBgActive && this.settings.rhythmEnabled ? this.settings.rhythmVolume : 0;

    // Master & Submix Gains
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(this.settings.masterVolume, now, 0.05);
    if (this.vocalGain) this.vocalGain.gain.setTargetAtTime(this.settings.vocalVolume, now, 0.05);
    if (this.accompGain) this.accompGain.gain.setTargetAtTime(accompVol, now, 0.05);
    if (this.tanpuraGain) this.tanpuraGain.gain.setTargetAtTime(tanpuraVol, now, 0.05);
    if (this.rhythmGain) this.rhythmGain.gain.setTargetAtTime(rhythmVol, now, 0.05);

    // Reverb Wet
    if (this.reverbWetGain) {
      const wet = this.settings.reverbEnabled ? this.settings.reverbLevel * 0.75 : 0;
      this.reverbWetGain.gain.setTargetAtTime(wet, now, 0.05);
    }

    // Delay Wet & Params
    if (this.delayWetGain && this.delayNode && this.delayFeedbackGain) {
      const wet = this.settings.echoEnabled ? this.settings.echoLevel * 0.65 : 0;
      this.delayWetGain.gain.setTargetAtTime(wet, now, 0.05);
      this.delayNode.delayTime.setTargetAtTime(this.settings.echoTime, now, 0.05);
      this.delayFeedbackGain.gain.setTargetAtTime(this.settings.echoFeedback, now, 0.05);
    }

    // Chorus Wet
    if (this.chorusWetGain) {
      const wet = this.settings.chorusEnabled ? this.settings.chorusLevel * 0.5 : 0;
      this.chorusWetGain.gain.setTargetAtTime(wet, now, 0.05);
    }

    // EQ
    if (this.bassFilter) {
      this.bassFilter.gain.setTargetAtTime(this.settings.eqBass, now, 0.05);
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.setTargetAtTime(this.settings.eqTreble, now, 0.05);
    }
  }

  // --- SOOTHING CHRISTIAN WORSHIP BACKGROUND MUSIC SYNTHESIS ---
  // Plays rich, warm worship chords, piano harmonics, or celestial harp pads
  private playBackgroundAccompaniment(startTime: number, duration: number, pitchSemi: number) {
    if (!this.ctx || !this.accompGain) return;
    if (this.settings.bgMusicMuted || this.settings.bgMusicStyle === 'vocals_only') return;

    const style = this.settings.bgMusicStyle;
    const pitchFactor = Math.pow(2, pitchSemi / 12);
    const baseC = 130.81 * pitchFactor; // C3

    // Chord progressions in C (transposed by pitchSemi)
    // 4 phrases per verse: C (I) -> Am (vi) -> F (IV) -> G (V)
    const chordDuration = duration / 4;

    const chords = [
      // 1. C Major (C3, G3, C4, E4)
      [baseC, baseC * 1.5, baseC * 2, baseC * 2.52],
      // 2. A Minor (A2, E3, A3, C4)
      [baseC * 0.84, baseC * 1.26, baseC * 1.68, baseC * 2],
      // 3. F Major (F2, C3, F3, A3)
      [baseC * 0.67, baseC, baseC * 1.34, baseC * 1.68],
      // 4. G Major (G2, D3, G3, B3)
      [baseC * 0.75, baseC * 1.12, baseC * 1.5, baseC * 1.89],
    ];

    chords.forEach((chordFreqs, chordIndex) => {
      if (!this.ctx) return;
      const chordStart = startTime + chordIndex * chordDuration;

      if (style === 'worship_piano') {
        // Christian Worship Piano & Silky Pad
        this.playPianoChord(chordFreqs, chordStart, chordDuration);
        this.playSilkyPad(chordFreqs.slice(0, 3), chordStart, chordDuration);
      } else if (style === 'acoustic_guitar') {
        // Gentle Plucked Harp / Guitar Arpeggio
        this.playArpeggioPlucks(chordFreqs, chordStart, chordDuration);
        this.playSilkyPad(chordFreqs.slice(0, 2), chordStart, chordDuration);
      } else if (style === 'sacred_strings') {
        // Celestial Orchestral Strings Pad
        this.playSilkyPad(chordFreqs, chordStart, chordDuration, 0.15);
      }
    });
  }

  // Soft Acoustic Worship Piano Note Voice
  private playPianoChord(freqs: number[], startTime: number, duration: number) {
    if (!this.ctx || !this.accompGain) return;

    freqs.forEach((freq) => {
      if (!this.ctx || !this.accompGain) return;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Pure fundamental + soft warm overtone
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, startTime);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, startTime);

      // Warm acoustic lowpass filter (removes any harsh brightness)
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, startTime);
      filter.frequency.exponentialRampToValueAtTime(450, startTime + Math.min(2.5, duration));
      filter.Q.setValueAtTime(0.8, startTime);

      // Natural acoustic piano amplitude envelope
      const maxGain = 0.055;
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(maxGain, startTime + 0.025);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.min(3.2, duration));

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.accompGain);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + Math.min(3.5, duration));
      osc2.stop(startTime + Math.min(3.5, duration));
    });
  }

  // Heavenly, Silky Strings Pad (Slow swell, zero harshness)
  private playSilkyPad(freqs: number[], startTime: number, duration: number, volMultiplier: number = 0.08) {
    if (!this.ctx || !this.accompGain) return;

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.accompGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      // Subtle micro-detune for lush celestial chorus width
      const detune = idx % 2 === 0 ? 3 : -3;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.detune.setValueAtTime(detune, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, startTime);
      filter.Q.setValueAtTime(0.6, startTime);

      // Slow worship pad swell
      const targetGain = volMultiplier / freqs.length;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(targetGain, startTime + 0.6);
      gain.gain.setValueAtTime(targetGain, startTime + duration - 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.accompGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
    });
  }

  // Plucked Harp & Acoustic Guitar Notes
  private playArpeggioPlucks(freqs: number[], startTime: number, duration: number) {
    if (!this.ctx || !this.accompGain) return;

    const stepTime = duration / (freqs.length * 2);
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.accompGain) return;

      const t = startTime + idx * stepTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 2, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 1.2);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.accompGain);

      osc.start(t);
      osc.stop(t + 1.5);
    });
  }

  // --- ATMOSPHERE SOUNDSCAPE PRESETS ---
  public applyAmbiencePreset(preset: 'cathedral' | 'temple' | 'joyful' | 'meditative') {
    switch (preset) {
      case 'cathedral':
        this.updateSettings({
          bgMusicStyle: 'worship_piano',
          bgMusicMuted: false,
          reverbEnabled: true,
          reverbType: 'cathedral',
          reverbLevel: 0.6,
          echoEnabled: true,
          echoTime: 0.38,
          echoFeedback: 0.3,
          echoLevel: 0.25,
          chorusEnabled: true,
          chorusLevel: 0.35,
          rhythmEnabled: false,
          fluteEnabled: false,
          eqBass: 2.5,
          eqTreble: 3.5,
        });
        break;

      case 'temple':
        this.updateSettings({
          bgMusicStyle: 'soothing_tanpura',
          bgMusicMuted: false,
          reverbEnabled: true,
          reverbType: 'temple',
          reverbLevel: 0.5,
          echoEnabled: true,
          echoTime: 0.3,
          echoFeedback: 0.22,
          echoLevel: 0.2,
          chorusEnabled: true,
          chorusLevel: 0.25,
          rhythmEnabled: false,
          fluteEnabled: false,
          eqBass: 2.0,
          eqTreble: 2.0,
        });
        break;

      case 'joyful':
        this.updateSettings({
          bgMusicStyle: 'worship_piano',
          bgMusicMuted: false,
          reverbEnabled: true,
          reverbType: 'sanctuary',
          reverbLevel: 0.35,
          echoEnabled: true,
          echoTime: 0.24,
          echoFeedback: 0.2,
          echoLevel: 0.18,
          chorusEnabled: true,
          chorusLevel: 0.4,
          speed: 1.1,
          rhythmEnabled: false,
          fluteEnabled: false,
          eqBass: 3.0,
          eqTreble: 4.0,
        });
        break;

      case 'meditative':
        this.updateSettings({
          bgMusicStyle: 'sacred_strings',
          bgMusicMuted: false,
          reverbEnabled: true,
          reverbType: 'cathedral',
          reverbLevel: 0.55,
          echoEnabled: true,
          echoTime: 0.45,
          echoFeedback: 0.35,
          echoLevel: 0.3,
          chorusEnabled: true,
          chorusLevel: 0.45,
          rhythmEnabled: false,
          speed: 0.9,
          eqBass: 2.5,
          eqTreble: 2.0,
        });
        break;
    }
  }

  // --- SOOTHING PERCUSSION RHYTHM ENGINE ---
  private startRhythm() {
    if (
      this.rhythmInterval !== null ||
      !this.settings.rhythmEnabled ||
      this.settings.rhythmPattern === 'none' ||
      this.settings.bgMusicMuted ||
      this.settings.bgMusicStyle === 'vocals_only'
    ) {
      return;
    }

    const raga = RAGA_OPTIONS.find((r) => r.id === this.settings.ragaId) || RAGA_OPTIONS[0];
    const bpm = raga.baseTempoBpm * this.settings.speed;
    const beatIntervalMs = (60 / bpm) * 1000 * 0.5;

    this.rhythmStep = 0;
    this.rhythmInterval = window.setInterval(() => {
      if (!this.isPlaying || this.isPaused || !this.ctx) return;

      const now = this.ctx.currentTime;
      this.playPercussionStep(this.rhythmStep, now);
      this.rhythmStep = (this.rhythmStep + 1) % 16;
    }, beatIntervalMs);
  }

  private stopRhythm() {
    if (this.rhythmInterval !== null) {
      clearInterval(this.rhythmInterval);
      this.rhythmInterval = null;
    }
  }

  private playPercussionStep(step: number, time: number) {
    if (!this.settings.rhythmEnabled || this.settings.bgMusicMuted) return;

    // Gentle, soft strokes (no harsh clicks)
    const pat = this.settings.rhythmPattern;
    if (pat === 'chimes_only') {
      if (step === 0 || step === 8) this.playTempleChime(time, 0.08);
      return;
    }

    if (pat === 'adi_tala') {
      if (step === 0) this.playGentleBassThump(time, 0.12);
      else if (step === 4) this.playGentleRim(time, 0.06);
      else if (step === 8) this.playGentleBassThump(time, 0.1);
      else if (step === 12) this.playGentleRim(time, 0.06);
      if (step === 0) this.playTempleChime(time, 0.05);
    } else if (pat === 'bhajana_tala') {
      if (step % 4 === 0) this.playGentleBassThump(time, 0.1);
      if (step % 2 === 1) this.playGentleRim(time, 0.05);
      if (step === 0) this.playTempleChime(time, 0.06);
    } else {
      if (step === 0 || step === 6) this.playGentleBassThump(time, 0.1);
      if (step === 3 || step === 9) this.playGentleRim(time, 0.05);
    }
  }

  private playGentleBassThump(time: number, volume: number = 0.12) {
    if (!this.ctx || !this.rhythmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, time);
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.22);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(gain);
    gain.connect(this.rhythmGain);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  private playGentleRim(time: number, volume: number = 0.06) {
    if (!this.ctx || !this.rhythmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, time);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.rhythmGain);

    osc.start(time);
    osc.stop(time + 0.09);
  }

  // Sacred Temple Bell & Soft Manjira Chime
  private playTempleChime(time: number, volume: number = 0.08) {
    if (!this.ctx || !this.accompGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc2.type = 'sine';

    // Harmonic bell frequencies
    osc1.frequency.setValueAtTime(1760, time);
    osc2.frequency.setValueAtTime(2640, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.accompGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 1.3);
    osc2.stop(time + 1.3);
  }

  // --- PURE SINE DEVOTIONAL TANPURA DRONE ---
  // ZERO harsh sawtooth waves! Uses pure sine waves with lowpass filter at 280Hz.
  private startTanpura() {
    if (!this.ctx || this.tanpuraRunning) return;
    if (this.settings.bgMusicMuted || this.settings.bgMusicStyle !== 'soothing_tanpura') return;

    this.stopTanpura();
    this.tanpuraRunning = true;

    const pitchMultiplier = Math.pow(2, this.settings.pitchSemi / 12);
    const baseSa = 130.81 * pitchMultiplier; // C3
    const pa = baseSa * 1.5; // G3
    const highSa = baseSa * 2; // C4

    const frequencies = [pa, highSa, highSa, baseSa];

    frequencies.forEach((freq, i) => {
      if (!this.ctx || !this.tanpuraGain) return;

      const osc = this.ctx.createOscillator();
      const stringGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // PURE SINE WAVE - No buzz!
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

      const cycleDuration = 3.6 / this.settings.speed;
      const delay = (i * cycleDuration) / 4;

      stringGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(1 / cycleDuration, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(stringGain.gain);

      osc.connect(filter);
      filter.connect(stringGain);
      stringGain.connect(this.tanpuraGain);

      osc.start(this.ctx.currentTime + delay);
      lfo.start(this.ctx.currentTime);

      this.tanpuraOscillators.push(osc, lfo);
    });
  }

  private stopTanpura() {
    this.tanpuraOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.tanpuraOscillators = [];
    this.tanpuraRunning = false;
  }

  // --- UPGRADED DEVOTIONAL VOCAL SYNTHESIZER ---
  // Sings swaras with authentic human vowel formants (F1, F2, F3) + gamaka portamento
  private playVocalSyllable(
    freq: number,
    startTime: number,
    duration: number,
    voice: VoiceOption,
    nextFreq?: number
  ) {
    if (!this.ctx || !this.vocalGain) return;

    // Dual detuned oscillators for lush singing presence
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();

    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    const masterVoiceGain = this.ctx.createGain();

    // 3 Formant filters representing human vocal tract vowels ("Aa / Oo")
    const f1 = this.ctx.createBiquadFilter();
    const f2 = this.ctx.createBiquadFilter();
    const f3 = this.ctx.createBiquadFilter();

    const isFemale = voice.gender === 'female';
    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Base pitch + subtle portamento towards next note (Carnatic Gamaka)
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.frequency.setValueAtTime(freq * 1.002, startTime);

    if (nextFreq && nextFreq !== freq) {
      const glideStart = startTime + duration * 0.65;
      osc1.frequency.setTargetAtTime(nextFreq, glideStart, duration * 0.15);
      osc2.frequency.setTargetAtTime(nextFreq * 1.002, glideStart, duration * 0.15);
    }

    // Devotional Gamaka Vibrato (swells gently like a real singer)
    vibrato.frequency.setValueAtTime(4.8, startTime);
    vibratoGain.gain.setValueAtTime(0.001, startTime);
    vibratoGain.gain.linearRampToValueAtTime(freq * 0.016, startTime + duration * 0.35);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc1.frequency);
    vibratoGain.connect(osc2.frequency);

    // Formant poles (Ah / Oh vowel singing)
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(isFemale ? 850 : 650, startTime);
    f1.Q.setValueAtTime(4.5, startTime);

    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(isFemale ? 1850 : 1350, startTime);
    f2.Q.setValueAtTime(5.0, startTime);

    f3.type = 'bandpass';
    f3.frequency.setValueAtTime(isFemale ? 2900 : 2500, startTime);
    f3.Q.setValueAtTime(4.0, startTime);

    // Smooth envelope with musical attack
    masterVoiceGain.gain.setValueAtTime(0.001, startTime);
    masterVoiceGain.gain.linearRampToValueAtTime(0.24, startTime + 0.12);
    masterVoiceGain.gain.setValueAtTime(0.24, startTime + duration - 0.15);
    masterVoiceGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Formant routing
    osc1.connect(f1);
    osc1.connect(f2);
    osc2.connect(f2);
    osc2.connect(f3);

    f1.connect(masterVoiceGain);
    f2.connect(masterVoiceGain);
    f3.connect(masterVoiceGain);

    masterVoiceGain.connect(this.vocalGain);

    vibrato.start(startTime);
    osc1.start(startTime);
    osc2.start(startTime);
    vibrato.stop(startTime + duration);
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }

  // --- PLAYBACK ORCHESTRATION ---
  // Plays whole chapter or individual verse with seamless transition
  public async playScripture(
    verses: BibleVerse[],
    startVerseIndex: number = 0,
    audioBlobUrl?: string
  ) {
    this.init();
    this.stop();

    this.verses = verses;
    this.currentVerseIndex = Math.max(0, Math.min(startVerseIndex, verses.length - 1));
    this.currentLineIndex = 0;
    this.isPlaying = true;
    this.isPaused = false;
    this.elapsedTime = 0;

    const baseVerseDuration = 9.5;
    if (this.settings.listenMode === 'verse') {
      this.totalDuration = baseVerseDuration / this.settings.speed;
    } else {
      this.totalDuration = (this.verses.length * baseVerseDuration) / this.settings.speed;
    }

    if (this.settings.bgMusicStyle === 'soothing_tanpura' && !this.settings.bgMusicMuted) {
      this.startTanpura();
    }
    if (this.settings.rhythmEnabled && !this.settings.bgMusicMuted) {
      this.startRhythm();
    }

    this.notifyState();
    this.startTracking();

    if (audioBlobUrl) {
      await this.playAudioBuffer(audioBlobUrl);
    } else {
      this.playCurrentVerse();
    }
  }

  // Convenience helper for playing whole chapter
  public playWholeChapter(verses: BibleVerse[], startIndex: number = 0, audioBlobUrl?: string) {
    this.settings.listenMode = 'chapter';
    this.playScripture(verses, startIndex, audioBlobUrl);
  }

  // Convenience helper for playing an individual verse
  public playSingleVerse(verses: BibleVerse[], verseIndex: number, audioBlobUrl?: string) {
    this.settings.listenMode = 'verse';
    this.playScripture(verses, verseIndex, audioBlobUrl);
  }

  // Plays high fidelity Gemini AI singing audio routed through the effects rack
  private async playAudioBuffer(url: string) {
    if (!this.ctx || !this.vocalGain) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

      this.audioBufferSource = this.ctx.createBufferSource();
      this.audioBufferSource.buffer = audioBuffer;

      const rate = this.settings.speed * Math.pow(2, this.settings.pitchSemi / 12);
      this.audioBufferSource.playbackRate.value = Math.max(0.2, Math.min(3.0, rate));

      // Connect into the vocal submix so it enjoys Reverb, Delay, Chorus, and EQ!
      this.audioBufferSource.connect(this.vocalGain);

      this.totalDuration = audioBuffer.duration / rate;

      // Play subtle background accompaniment behind AI vocal
      if (this.ctx) {
        this.playBackgroundAccompaniment(
          this.ctx.currentTime,
          audioBuffer.duration / rate,
          this.settings.pitchSemi
        );
      }

      this.audioBufferSource.onended = () => {
        this.handleVerseEnd();
      };

      this.audioBufferSource.start(0);
    } catch (err) {
      console.warn('Falling back to synthesized singing:', err);
      this.playCurrentVerse();
    }
  }

  private playCurrentVerse() {
    if (!this.isPlaying || this.isPaused || this.currentVerseIndex >= this.verses.length) {
      if (this.currentVerseIndex >= this.verses.length) {
        this.stop();
      }
      return;
    }

    const currentVerse = this.verses[this.currentVerseIndex];
    const voice = VOICE_OPTIONS.find((v) => v.id === this.settings.voiceId) || VOICE_OPTIONS[0];

    const pitchFactor = Math.pow(2, (this.settings.pitchSemi + voice.pitchOffset) / 12);
    const speed = this.settings.speed;

    // Trigger gentle temple chime at verse inception
    if (this.ctx && !this.settings.bgMusicMuted) {
      this.playTempleChime(this.ctx.currentTime + 0.05, 0.07);
    }

    // Melodic Swara progression based on devotional scale
    const baseFreqs = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0];
    const noteDuration = 1.15 / speed;
    const totalVerseTime = baseFreqs.length * noteDuration + 1.4 / speed;

    // Trigger soothing background music accompaniment under the verse
    if (this.ctx) {
      this.playBackgroundAccompaniment(
        this.ctx.currentTime,
        totalVerseTime,
        this.settings.pitchSemi
      );
    }

    baseFreqs.forEach((base, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * noteDuration;
      const f = base * pitchFactor;
      const nextF = idx < baseFreqs.length - 1 ? baseFreqs[idx + 1] * pitchFactor : undefined;

      // Resonant vocal singing note with Gamaka portamento
      this.playVocalSyllable(f, t, noteDuration * 0.95, voice, nextF);
    });

    // Also support speech synthesis if Telugu voice is present in browser
    this.speakVerseText(currentVerse.teluguText, voice);

    this.notifyState();

    this.melodyTimeout = window.setTimeout(() => {
      this.handleVerseEnd();
    }, totalVerseTime * 1000);
  }

  // Handles transition at the end of a verse based on listenMode (Whole Chapter vs Individual Verse)
  private handleVerseEnd() {
    if (!this.isPlaying || this.isPaused) return;

    if (this.settings.listenMode === 'chapter') {
      // Whole Chapter mode: automatically proceed to next verse
      if (this.currentVerseIndex < this.verses.length - 1) {
        this.currentVerseIndex++;
        this.playCurrentVerse();
      } else {
        // Reached end of chapter
        if (this.settings.repeatMode === 'chapter') {
          this.currentVerseIndex = 0;
          this.playCurrentVerse();
        } else {
          this.stop();
        }
      }
    } else {
      // Individual Verse mode
      if (this.settings.repeatMode === 'verse') {
        // Repeat this single verse
        this.playCurrentVerse();
      } else if (this.settings.autoAdvanceVerse) {
        // Advance to next verse if available
        if (this.currentVerseIndex < this.verses.length - 1) {
          this.currentVerseIndex++;
          this.playCurrentVerse();
        } else {
          this.stop();
        }
      } else {
        // Stop cleanly after this individual verse
        this.stop();
      }
    }
  }

  private speakVerseText(teluguText: string, voice: VoiceOption) {
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(teluguText);
      const voices = window.speechSynthesis.getVoices();

      const teluguVoice = voices.find(
        (v) =>
          v.lang === 'te-IN' ||
          v.lang.includes('te') ||
          v.lang.includes('ta') ||
          v.name.toLowerCase().includes('telugu')
      );

      if (teluguVoice) {
        utterance.voice = teluguVoice;
      }

      utterance.rate = Math.max(0.6, Math.min(1.6, 0.82 * this.settings.speed));
      utterance.pitch = Math.max(
        0.5,
        Math.min(1.5, 1.0 + this.settings.pitchSemi / 12 + (voice.gender === 'female' ? 0.25 : -0.15))
      );
      utterance.volume = this.settings.vocalVolume * this.settings.masterVolume * 0.85;

      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          this.currentLineIndex = Math.floor(e.charIndex / 14);
          this.notifyState();
        }
      };

      this.speechUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  private startTracking() {
    this.stopTracking();
    const intervalMs = 100;
    this.playbackInterval = window.setInterval(() => {
      if (this.isPlaying && !this.isPaused) {
        this.elapsedTime += (intervalMs / 1000) * this.settings.speed;
        if (this.elapsedTime > this.totalDuration && this.totalDuration > 0) {
          this.elapsedTime = this.totalDuration;
        }
        this.notifyState();
      }
    }, intervalMs);
  }

  private stopTracking() {
    if (this.playbackInterval !== null) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPaused = true;
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    if (this.melodyTimeout) {
      clearTimeout(this.melodyTimeout);
      this.melodyTimeout = null;
    }
    this.notifyState();
  }

  public resume() {
    if (!this.isPlaying || !this.isPaused) return;
    this.isPaused = false;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
    this.notifyState();
  }

  public stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.stopTracking();
    this.stopTanpura();
    this.stopRhythm();

    if (this.melodyTimeout) {
      clearTimeout(this.melodyTimeout);
      this.melodyTimeout = null;
    }

    if (this.audioBufferSource) {
      try {
        this.audioBufferSource.stop();
        this.audioBufferSource.disconnect();
      } catch {}
      this.audioBufferSource = null;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    this.notifyState();
  }

  public seekVerse(index: number) {
    if (index >= 0 && index < this.verses.length) {
      this.stop();
      this.playScripture(this.verses, index);
    }
  }

  public nextVerse() {
    if (this.currentVerseIndex < this.verses.length - 1) {
      this.seekVerse(this.currentVerseIndex + 1);
    }
  }

  public prevVerse() {
    if (this.currentVerseIndex > 0) {
      this.seekVerse(this.currentVerseIndex - 1);
    }
  }

  private notifyState() {
    if (this.onStateChange) {
      this.onStateChange({
        isPlaying: this.isPlaying,
        isPaused: this.isPaused,
        currentTime: this.elapsedTime,
        duration: this.totalDuration,
        currentVerseIndex: this.currentVerseIndex,
        currentLineIndex: this.currentLineIndex,
      });
    }
  }
}

export const audioEngine = new TeluguAudioEngine();
