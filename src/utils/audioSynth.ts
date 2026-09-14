// Web Audio API Synthesizer & Speech Engine for Hedge-Fund Grade Trading Terminal
export type AudioProfile = 'INSTITUTIONAL' | 'VOICE_ONLY' | 'CHIME_ONLY' | 'SCALPER_TURBO' | 'STEALTH';
export type VoiceGender = 'MALE' | 'FEMALE';
export type MaleTimbre = 'DEEP_BARITONE' | 'TACTICAL_OFFICER' | 'WALL_STREET_HEAVY';

export type WidgetAudioType = 'ORDER_BOOK' | 'HEATMAP' | 'CHART' | 'TAPE';
export type ChimeStyle = 'CRYSTAL_PING' | 'DEEP_PULSE' | 'HARMONIC_BELL' | 'TACTICAL_CLICK' | 'SUB_BASS';

export type SoundActionType = 
  | 'BUY' 
  | 'SELL' 
  | 'ORDER_FILLED' 
  | 'ORDER_SUBMITTED' 
  | 'ORDER_CANCELLED' 
  | 'CLOSE' 
  | 'REVERSE' 
  | 'FLATTEN' 
  | 'PRESET' 
  | 'AUTO_BE' 
  | 'ERROR' 
  | 'ALERT' 
  | 'SNIPER_ALERT'
  | 'TAKE_PROFIT' 
  | 'STOP_LOSS' 
  | 'WHALE_PING'
  | 'TP_HIT'
  | 'SL_HIT'
  | 'PARTIAL'
  | 'click'
  | 'CLICK';

export interface AudioEngineConfig {
  profile: AudioProfile;
  masterEnabled: boolean;
  voiceEnabled: boolean;
  chimesEnabled: boolean;
  voiceGender: VoiceGender; // 'MALE' | 'FEMALE'
  maleTimbre: MaleTimbre; // 'DEEP_BARITONE' | 'TACTICAL_OFFICER' | 'WALL_STREET_HEAVY'
  voiceVolume: number; // 0.0 - 1.0
  chimeVolume: number; // 0.0 - 1.0
  voiceRate: number; // 0.8 - 1.4
  voicePitch: number; // 0.5 - 1.5
  voiceAccent: string; // 'auto' | 'en-US' | 'en-GB'
  widgetChimes: {
    orderBook: ChimeStyle;
    heatmap: ChimeStyle;
    chart: ChimeStyle;
    tape: ChimeStyle;
  };
}

class TradingAudioSynth {
  private ctx: AudioContext | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private masterGainNode: GainNode | null = null;
  private config: AudioEngineConfig = {
    profile: 'INSTITUTIONAL',
    masterEnabled: true,
    voiceEnabled: true,
    chimesEnabled: true,
    voiceGender: 'MALE', // Default to masculine character
    maleTimbre: 'DEEP_BARITONE',
    voiceVolume: 1.0,
    chimeVolume: 0.85,
    voiceRate: 1.0,
    voicePitch: 0.72, // Thick, deep baritone pitch for male
    voiceAccent: 'auto',
    widgetChimes: {
      orderBook: 'CRYSTAL_PING',
      heatmap: 'DEEP_PULSE',
      chart: 'HARMONIC_BELL',
      tape: 'TACTICAL_CLICK',
    },
  };

  private availableVoices: SpeechSynthesisVoice[] = [];
  private lastSpeakTime: number = 0;
  private lastSpeakPhrase: string = '';
  private squelchWindowMs: number = 1200; // 1.2s Anti-duplicate & Anti-clipping debounce window
  private queuedFillsCount: number = 0;
  private batchSpeakTimer: any = null;

  constructor() {
    this.loadPersistedConfig();
    this.initSpeechEngine();
  }

  private loadPersistedConfig() {
    try {
      if (typeof window === 'undefined') return;
      const saved = localStorage.getItem('mountalgo_audio_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = { ...this.config, ...parsed };
      }
    } catch {
      // ignore storage error
    }
  }

  private saveConfig() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('mountalgo_audio_config', JSON.stringify(this.config));
      }
    } catch {
      // ignore storage error
    }
  }

  private initSpeechEngine() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const updateVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          this.availableVoices = voices;
        }
      } catch {
        // ignore
      }
    };
    
    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.availableVoices = window.speechSynthesis.getVoices() || [];
    }
    return this.availableVoices;
  }

  /**
   * Institutional Voice Matcher with Thick & Authoritative Male Prioritization
   */
  private getBestVoiceForGender(gender: VoiceGender): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    if (!voices || voices.length === 0) return null;

    const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
    const pool = enVoices.length > 0 ? enVoices : voices;

    if (gender === 'MALE') {
      // Prioritized list of deep, thick, resonant male voices across Windows/macOS/Chrome/Linux/Android
      const topMaleVoices = [
        'microsoft guy online (natural)',
        'microsoft david desktop',
        'microsoft david',
        'microsoft mark',
        'microsoft ryan',
        'microsoft christopher',
        'google uk english male',
        'google us english (male)',
        'en-us-x-sfg#male',
        'en-gb-x-rjs#male',
        'en-us-x-iom',
        'en-us-x-tpd',
        'daniel',
        'alex',
        'oliver',
        'george',
        'arthur',
        'tom',
        'fred',
        'aaron',
        'rishi',
        'male'
      ];
      
      const femaleExclude = ['samantha', 'jenny', 'ava', 'victoria', 'karen', 'zira', 'female', 'woman', 'girl', 'catherine', 'susan', 'hazel', 'moira', 'tessa', 'helena', 'natural (female)'];

      // 1. Check exact priority list
      for (const targetName of topMaleVoices) {
        const match = pool.find(v => v.name.toLowerCase().includes(targetName) && !femaleExclude.some(k => v.name.toLowerCase().includes(k)));
        if (match) return match;
      }

      // 2. Check for any voice having 'male' in name or voiceURI
      const malePattern = pool.find(v => {
        const lower = (v.name + ' ' + v.voiceURI).toLowerCase();
        return (lower.includes('male') || lower.includes('guy') || lower.includes('david') || lower.includes('man')) && !femaleExclude.some(k => lower.includes(k));
      });
      if (malePattern) return malePattern;

      // 3. Fallback to any voice not containing known female names
      const nonFemale = pool.find(v => {
        const name = v.name.toLowerCase();
        return !femaleExclude.some(k => name.includes(k));
      });
      if (nonFemale) return nonFemale;

      return pool[0] || null;
    } else {
      // FEMALE (Clear Institutional Desk Announcer)
      const topFemaleVoices = [
        'microsoft jenny online (natural)',
        'microsoft zira desktop',
        'microsoft zira',
        'microsoft ava',
        'google us english female',
        'google uk english female',
        'samantha',
        'victoria',
        'karen',
        'catherine',
        'female'
      ];
      const maleExclude = ['david', 'daniel', 'guy', 'george', 'james', 'oliver', 'thomas', 'aaron', 'mark', 'richard', 'alex', 'fred', 'arthur', 'male', 'man'];

      for (const targetName of topFemaleVoices) {
        const match = pool.find(v => v.name.toLowerCase().includes(targetName) && !maleExclude.some(k => v.name.toLowerCase().includes(k)));
        if (match) return match;
      }

      const exactFemale = pool.find(v => {
        const name = v.name.toLowerCase();
        return !maleExclude.some(k => name.includes(k));
      });
      if (exactFemale) return exactFemale;

      return pool[0] || null;
    }
  }

  public getConfig(): AudioEngineConfig {
    return { ...this.config };
  }

  public setConfig(updates: Partial<AudioEngineConfig>) {
    this.config = { ...this.config, ...updates };
    
    // Auto-apply profile constraints if profile is updated
    if (updates.profile) {
      this.applyProfileDefaults(updates.profile);
    }
    
    this.saveConfig();
  }

  public setVoiceGender(gender: VoiceGender) {
    this.config.voiceGender = gender;
    if (gender === 'MALE') {
      this.config.voicePitch = 0.72; // Deep thick baritone default
      this.config.voiceRate = 1.0;
    } else {
      this.config.voicePitch = 1.08; // High clarity female default
      this.config.voiceRate = 1.05;
    }
    this.saveConfig();
  }

  public setMaleTimbre(timbre: MaleTimbre) {
    this.config.maleTimbre = timbre;
    if (timbre === 'WALL_STREET_HEAVY') {
      this.config.voicePitch = 0.64; // Ultra-deep heavy baritone
      this.config.voiceRate = 0.96;
    } else if (timbre === 'DEEP_BARITONE') {
      this.config.voicePitch = 0.72; // Thick authoritative masculine
      this.config.voiceRate = 1.0;
    } else if (timbre === 'TACTICAL_OFFICER') {
      this.config.voicePitch = 0.80; // Firm, crisp tactical execution
      this.config.voiceRate = 1.04;
    }
    this.saveConfig();
  }

  public getVoiceGender(): VoiceGender {
    return this.config.voiceGender || 'MALE';
  }

  public setAudioProfile(profile: AudioProfile) {
    this.config.profile = profile;
    this.applyProfileDefaults(profile);
    this.saveConfig();
  }

  public setWidgetChime(widget: 'orderBook' | 'heatmap' | 'chart' | 'tape', style: ChimeStyle) {
    if (!this.config.widgetChimes) {
      this.config.widgetChimes = {
        orderBook: 'CRYSTAL_PING',
        heatmap: 'DEEP_PULSE',
        chart: 'HARMONIC_BELL',
        tape: 'TACTICAL_CLICK',
      };
    }
    this.config.widgetChimes[widget] = style;
    this.saveConfig();
  }

  public getWidgetChime(widget: 'orderBook' | 'heatmap' | 'chart' | 'tape'): ChimeStyle {
    return this.config.widgetChimes?.[widget] || 'CRYSTAL_PING';
  }

  /**
   * High-Precision Audio Synthesizer for Custom Chime Styles
   */
  public playChimeStyle(style: ChimeStyle) {
    if (!this.config.masterEnabled || !this.config.chimesEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const masterGain = this.config.chimeVolume;

      if (style === 'CRYSTAL_PING') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now); // A6
        osc.frequency.exponentialRampToValueAtTime(2640, now + 0.05);
        gain.gain.setValueAtTime(0.2 * masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        osc.start(now);
        osc.stop(now + 0.23);
      } else if (style === 'DEEP_PULSE') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now); // A3
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
        gain.gain.setValueAtTime(0.28 * masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        osc.start(now);
        osc.stop(now + 0.29);
      } else if (style === 'HARMONIC_BELL') {
        [880, 1320, 1760].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.03);
          gain.gain.setValueAtTime((0.14 / (i + 1)) * masterGain, now + i * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.35);
          osc.connect(gain);
          gain.connect(this.getOutputNode(ctx));
          osc.start(now + i * 0.03);
          osc.stop(now + i * 0.03 + 0.36);
        });
      } else if (style === 'TACTICAL_CLICK') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);
        gain.gain.setValueAtTime(0.25 * masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        osc.start(now);
        osc.stop(now + 0.032);
      } else if (style === 'SUB_BASS') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(55, now + 0.2);
        gain.gain.setValueAtTime(0.3 * masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        osc.start(now);
        osc.stop(now + 0.31);
      }
    } catch {
      // Ignore
    }
  }

  public playWidgetChime(widget: 'orderBook' | 'heatmap' | 'chart' | 'tape', styleOverride?: ChimeStyle) {
    const style = styleOverride || this.getWidgetChime(widget);
    this.playChimeStyle(style);
  }

  private applyProfileDefaults(profile: AudioProfile) {
    switch (profile) {
      case 'INSTITUTIONAL':
        this.config.masterEnabled = true;
        this.config.voiceEnabled = true;
        this.config.chimesEnabled = true;
        break;
      case 'VOICE_ONLY':
        this.config.masterEnabled = true;
        this.config.voiceEnabled = true;
        this.config.chimesEnabled = false;
        break;
      case 'CHIME_ONLY':
        this.config.masterEnabled = true;
        this.config.voiceEnabled = false;
        this.config.chimesEnabled = true;
        break;
      case 'SCALPER_TURBO':
        this.config.masterEnabled = true;
        this.config.voiceEnabled = false;
        this.config.chimesEnabled = true;
        this.config.chimeVolume = 0.55; // Lower volume for high-speed scalping
        break;
      case 'STEALTH':
        this.config.masterEnabled = false;
        break;
    }
  }

  public setEnabled(enabled: boolean) {
    this.config.masterEnabled = enabled;
    if (!enabled) this.config.profile = 'STEALTH';
    else if (this.config.profile === 'STEALTH') this.config.profile = 'INSTITUTIONAL';
    this.saveConfig();
  }

  public isEnabled(): boolean {
    return this.config.masterEnabled && this.config.profile !== 'STEALTH';
  }

  public setVoiceEnabled(enabled: boolean) {
    this.config.voiceEnabled = enabled;
    this.saveConfig();
  }

  public isVoiceEnabled(): boolean {
    return this.config.masterEnabled && this.config.voiceEnabled && this.config.profile !== 'STEALTH' && this.config.profile !== 'CHIME_ONLY' && this.config.profile !== 'SCALPER_TURBO';
  }

  public setChimesEnabled(enabled: boolean) {
    this.config.chimesEnabled = enabled;
    this.saveConfig();
  }

  public setVolumes(voiceVol: number, chimeVol: number) {
    this.config.voiceVolume = Math.max(0, Math.min(1, voiceVol));
    this.config.chimeVolume = Math.max(0, Math.min(1, chimeVol));
    this.saveConfig();
  }

  private getOutputNode(ctx: AudioContext): AudioNode {
    try {
      if (!this.masterCompressor || !this.masterGainNode) {
        this.masterCompressor = ctx.createDynamicsCompressor();
        this.masterCompressor.threshold.setValueAtTime(-14, ctx.currentTime);
        this.masterCompressor.knee.setValueAtTime(24, ctx.currentTime);
        this.masterCompressor.ratio.setValueAtTime(10, ctx.currentTime);
        this.masterCompressor.attack.setValueAtTime(0.003, ctx.currentTime);
        this.masterCompressor.release.setValueAtTime(0.22, ctx.currentTime);

        this.masterGainNode = ctx.createGain();
        this.masterGainNode.gain.setValueAtTime(1.0, ctx.currentTime);

        this.masterCompressor.connect(this.masterGainNode);
        this.masterGainNode.connect(ctx.destination);
      }
      return this.masterCompressor;
    } catch {
      return ctx.destination;
    }
  }

  private getContext(): AudioContext | null {
    if (!this.isEnabled()) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Acoustic Sub-Bass Chest Resonator for Thick Masculine Trading Desk Punch
   */
  private playMasculineAcousticBody() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Low-pass filter for thick boardroom body resonance (warmth)
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now); // A2 deep baritone fundamental
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.22); // subtle downward chest resonance

      gain.gain.setValueAtTime(0.14 * (this.config.voiceVolume ?? 1.0), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getOutputNode(ctx));

      osc.start(now);
      osc.stop(now + 0.27);
    } catch {
      // Ignore
    }
  }

  /**
   * Institutional Zero-Latency Speech Synthesis Engine with Priority Squelch & Anti-Clipping
   */
  public speak(phrase: string = 'Order filled', isHighPriority: boolean = false) {
    if (!this.isVoiceEnabled() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    
    // Priority Squelch: If same phrase is spoken within squelchWindow, throttle to prevent voice echo/clipping
    if (!isHighPriority && phrase === this.lastSpeakPhrase && (now - this.lastSpeakTime) < this.squelchWindowMs) {
      this.queuedFillsCount++;
      if (!this.batchSpeakTimer) {
        this.batchSpeakTimer = setTimeout(() => {
          this.batchSpeakTimer = null;
          this.queuedFillsCount = 0;
        }, 800);
      }
      return;
    }

    this.lastSpeakTime = now;
    this.lastSpeakPhrase = phrase;

    try {
      // Cancel previous non-priority speech for zero-latency execution announcement
      window.speechSynthesis.cancel();

      const isMale = this.config.voiceGender === 'MALE';
      
      // If male, trigger subtle acoustic sub-bass chest resonance for thick body punch
      if (isMale) {
        this.playMasculineAcousticBody();
      }

      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = this.config.voiceAccent === 'en-GB' ? 'en-GB' : 'en-US';
      
      // Pitch Calculation:
      // Male: Default 0.70x - 0.75x (Deep, thick, heavy baritone, masculine firmness)
      // Female: Default 1.08x (Crisp, high clarity)
      utterance.pitch = Math.max(0.4, Math.min(1.6, this.config.voicePitch || (isMale ? 0.72 : 1.08)));
      
      // Rate Calculation:
      // Male: Deliberate, firm, authoritative execution pace (0.98x - 1.02x)
      // Female: Crisp desk cadence (1.05x)
      utterance.rate = Math.max(0.8, Math.min(1.4, this.config.voiceRate || (isMale ? 1.0 : 1.05)));
      utterance.volume = this.config.voiceVolume ?? 1.0;

      const matchedVoice = this.getBestVoiceForGender(this.config.voiceGender);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors silently
    }
  }

  /**
   * Mechanical Shutter-Snap Affirmative Order Execution Sound
   * (Matches ultra-crisp tactile latch double-click with resonant affirmative tail)
   */
  private playOrderExecutionSnap(ctx: AudioContext, masterGain: number, isBuy: boolean = true) {
    try {
      const now = ctx.currentTime;
      
      // --- Transient 1: Initial Mechanical Strike (t = 0) ---
      const click1Osc = ctx.createOscillator();
      const click1Gain = ctx.createGain();
      click1Osc.type = 'triangle';
      click1Osc.frequency.setValueAtTime(3200, now);
      click1Osc.frequency.exponentialRampToValueAtTime(1400, now + 0.012);
      click1Gain.gain.setValueAtTime(0.24 * masterGain, now);
      click1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      click1Osc.connect(click1Gain);
      click1Gain.connect(this.getOutputNode(ctx));
      click1Osc.start(now);
      click1Osc.stop(now + 0.016);

      // --- Transient 2: Mechanical Latch Snap (t = now + 0.032s) ---
      const t2 = now + 0.032;
      const click2Osc = ctx.createOscillator();
      const click2Gain = ctx.createGain();
      click2Osc.type = 'sine';
      click2Osc.frequency.setValueAtTime(2200, t2);
      click2Osc.frequency.exponentialRampToValueAtTime(680, t2 + 0.022);
      click2Gain.gain.setValueAtTime(0.28 * masterGain, t2);
      click2Gain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.025);
      click2Osc.connect(click2Gain);
      click2Gain.connect(this.getOutputNode(ctx));
      click2Osc.start(t2);
      click2Osc.stop(t2 + 0.026);

      // --- Body & Affirmative Metallic Resonance Tail (t = t2) ---
      const harm1Osc = ctx.createOscillator();
      const harm1Gain = ctx.createGain();
      harm1Osc.type = 'sine';
      const baseFreq = isBuy ? 587.33 : 523.25; // D5 for buy, C5 for sell
      harm1Osc.frequency.setValueAtTime(baseFreq, t2);
      harm1Osc.frequency.exponentialRampToValueAtTime(baseFreq * (isBuy ? 1.5 : 1.25), t2 + 0.08);

      const harm2Osc = ctx.createOscillator();
      const harm2Gain = ctx.createGain();
      harm2Osc.type = 'triangle';
      harm2Osc.frequency.setValueAtTime(baseFreq * 2, t2);

      harm1Gain.gain.setValueAtTime(0.18 * masterGain, t2);
      harm1Gain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.28);

      harm2Gain.gain.setValueAtTime(0.08 * masterGain, t2);
      harm2Gain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.18);

      harm1Osc.connect(harm1Gain);
      harm1Gain.connect(this.getOutputNode(ctx));
      harm2Osc.connect(harm2Gain);
      harm2Gain.connect(this.getOutputNode(ctx));

      harm1Osc.start(t2);
      harm1Osc.stop(t2 + 0.29);
      harm2Osc.start(t2);
      harm2Osc.stop(t2 + 0.19);
    } catch {
      // Ignore
    }
  }

  /**
   * Primary Audio Player with Harmonic Synthesizer and Voice Prompt Coordination
   */
  public play(type: SoundActionType) {
    if (!this.isEnabled()) return;

    // If click sound, trigger tactical click chime without speaking
    if (type === 'click' || type === 'CLICK') {
      this.playChimeStyle('TACTICAL_CLICK');
      return;
    }

    // 1. Voice Prompt Processing (Institutional Voice Alerts)
    switch (type) {
      case 'BUY':
      case 'SELL':
      case 'ORDER_FILLED':
        this.speak('Order filled');
        break;
      case 'ORDER_SUBMITTED':
      case 'PRESET':
        this.speak('Order submitted');
        break;
      case 'ORDER_CANCELLED':
        this.speak('Order cancelled');
        break;
      case 'TP_HIT':
      case 'TAKE_PROFIT':
        this.speak('Target reached', true);
        break;
      case 'SL_HIT':
      case 'STOP_LOSS':
        this.speak('Stop loss triggered', true);
        break;
      case 'PARTIAL':
      case 'CLOSE':
        this.speak('Position closed');
        break;
      case 'REVERSE':
        this.speak('Position reversed');
        break;
      case 'FLATTEN':
        this.speak('Emergency flatten executed', true);
        break;
      case 'AUTO_BE':
        this.speak('Break even secured');
        break;
      case 'ERROR':
        this.speak('Order rejected', true);
        break;
      case 'ALERT':
        this.speak('Alert triggered', true);
        break;
      case 'SNIPER_ALERT':
        this.speak('New listing detected. Snipe ready.', true);
        break;
      default:
        break;
    }

    // 2. Chimes / Synthesizer Tone Generation
    if (!this.config.chimesEnabled || this.config.profile === 'VOICE_ONLY') return;

    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = this.config.chimeVolume ?? 0.85;

    try {
      if (type === 'BUY' || type === 'ORDER_FILLED' || type === 'TP_HIT') {
        this.playOrderExecutionSnap(ctx, masterGain, true);
      } else if (type === 'SELL' || type === 'SL_HIT') {
        this.playOrderExecutionSnap(ctx, masterGain, false);
      } else if (type === 'ORDER_SUBMITTED' || type === 'PRESET') {
        // Subtle clean UI click / tactical confirmation
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.04);
        
        gain.gain.setValueAtTime(0.06 * masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        
        osc.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        osc.start(now);
        osc.stop(now + 0.055);
      } else if (type === 'ORDER_CANCELLED') {
        // Downward pop for cancellation
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
        
        gain.gain.setValueAtTime(0.1 * masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        
        osc.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        osc.start(now);
        osc.stop(now + 0.095);
      } else if (type === 'CLOSE' || type === 'PARTIAL') {
        // Double pop for clean order exit
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.09);
        
        gain.gain.setValueAtTime(0.15 * masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        osc.start(now);
        osc.stop(now + 0.11);
      } else if (type === 'REVERSE') {
        // Whoosh pitch warp
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
        
        gain.gain.setValueAtTime(0.08 * masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        
        osc.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        osc.start(now);
        osc.stop(now + 0.23);
      } else if (type === 'FLATTEN') {
        // Double warning sweep (Panic Kill)
        [0, 0.08].forEach(offset => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(600, now + offset);
          osc.frequency.exponentialRampToValueAtTime(200, now + offset + 0.06);
          gain.gain.setValueAtTime(0.07 * masterGain, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.07);
          osc.connect(gain);
          gain.connect(this.getOutputNode(ctx));
          osc.start(now + offset);
          osc.stop(now + offset + 0.075);
        });
      } else if (type === 'AUTO_BE') {
        // Shield activation chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.07);
        
        gain.gain.setValueAtTime(0.1 * masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'ALERT') {
        // Bell resonance for Price & Technical Alert
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        gain.gain.setValueAtTime(0.18 * masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        osc.start(now);
        osc.stop(now + 0.46);
      } else if (type === 'SNIPER_ALERT') {
        // High-Tech Sniper Sonar Triple Ping
        [0, 0.06, 0.12].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const freq = idx === 0 ? 1760 : idx === 1 ? 2349.32 : 3520;
          osc.frequency.setValueAtTime(freq, now + offset);
          gain.gain.setValueAtTime(0.22 * masterGain, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);
          osc.connect(gain);
          gain.connect(this.getOutputNode(ctx));
          osc.start(now + offset);
          osc.stop(now + offset + 0.19);
        });
      } else if (type === 'TAKE_PROFIT') {
        // Victory double high bell
        [0, 0.12].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(idx === 0 ? 880 : 1320, now + offset);
          gain.gain.setValueAtTime(0.15 * masterGain, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.28);
          osc.connect(gain);
          gain.connect(this.getOutputNode(ctx));
          osc.start(now + offset);
          osc.stop(now + offset + 0.3);
        });
      } else if (type === 'STOP_LOSS') {
        // Low cautionary tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.25);
        gain.gain.setValueAtTime(0.14 * masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        osc.start(now);
        osc.stop(now + 0.29);
      } else if (type === 'WHALE_PING') {
        // Deep sub-sonar bubble sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.09);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);
        gain.gain.setValueAtTime(0.18 * masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        osc.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        osc.start(now);
        osc.stop(now + 0.27);
      } else if (type === 'ERROR') {
        // Dull low alert buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        
        gain.gain.setValueAtTime(0.12 * masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        
        osc.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        osc.start(now);
        osc.stop(now + 0.19);
      }
    } catch {
      // Ignore audio context errors silently
    }
  }
}

export const tradingAudio = new TradingAudioSynth();
