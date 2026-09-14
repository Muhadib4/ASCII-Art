import { themeById, type ThemeId } from '../themes/config';
import { type AudioPreferences } from '../themes/store';

export type AudioEvent = 'hover' | 'click' | 'confirm' | 'cancel' | 'switch' | 'dropdown' | 'slider' | 'theme' | 'theme-change' | 'upload' | 'complete' | 'processing-complete' | 'export' | 'error';
interface Ambience { gain: GainNode; nodes: AudioNode[]; oscillators: OscillatorNode[] }

/** A single, gesture-unlocked Web Audio graph. Pads use audio-rate modulation, never JS animation loops. */
class AudioManager {
  private context: AudioContext | null = null;
  private masterNode: GainNode | null = null;
  private musicNode: GainNode | null = null;
  private sfxNode: GainNode | null = null;
  private theme: ThemeId = 'mono';
  private settings: AudioPreferences = { master: .5, bgm: .22, sfx: .55, muted: true };
  private ambience: Ambience | null = null;
  private unlocked = false;
  private lastPlayed = new Map<AudioEvent, number>();
  private retireTimers = new Set<ReturnType<typeof setTimeout>>();
  private retiredAmbience = new Set<Ambience>();

  async unlock(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.masterNode = this.context.createGain();
        this.musicNode = this.context.createGain();
        this.sfxNode = this.context.createGain();
        this.masterNode.gain.value = 0;
        this.musicNode.connect(this.masterNode);
        this.sfxNode.connect(this.masterNode);
        this.masterNode.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') await this.context.resume();
      this.unlocked = true;
      this.applyVolumes();
      if (!this.settings.muted && !this.ambience) this.startAmbience();
    } catch {
      // Browsers without audio support still have the full creative workflow.
    }
  }

  configure(settings: AudioPreferences, theme: ThemeId = this.theme) {
    const changed = this.theme !== theme;
    this.settings = settings;
    this.theme = theme;
    this.applyVolumes();
    if (this.context && this.unlocked && !settings.muted && (changed || !this.ambience)) this.startAmbience();
  }

  setTheme(theme: ThemeId) { this.configure(this.settings, theme); }
  setConfig(settings: Partial<AudioPreferences>) { this.configure({ ...this.settings, ...settings }); }

  private applyVolumes() {
    if (!this.context || !this.masterNode || !this.musicNode || !this.sfxNode) return;
    const now = this.context.currentTime;
    this.masterNode.gain.setTargetAtTime(this.settings.muted ? 0 : this.settings.master, now, .06);
    this.musicNode.gain.setTargetAtTime(this.settings.bgm * .18, now, .1);
    this.sfxNode.gain.setTargetAtTime(this.settings.sfx * .2, now, .025);
  }

  private startAmbience() {
    const context = this.context;
    if (!context || !this.musicNode) return;
    const old = this.ambience;
    const profile = themeById[this.theme].audio;
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    gain.gain.value = 0;
    filter.type = 'lowpass';
    filter.frequency.value = profile.filter;
    filter.Q.value = .4;
    filter.connect(gain);
    gain.connect(this.musicNode);
    const nodes: AudioNode[] = [filter, gain];
    const oscillators: OscillatorNode[] = [];
    profile.chord.forEach((ratio, i) => {
      const oscillator = context.createOscillator();
      const voice = context.createGain();
      oscillator.type = profile.wave;
      oscillator.frequency.value = profile.root * ratio;
      oscillator.detune.value = i % 2 ? -3 : 3;
      voice.gain.value = .28 / profile.chord.length;
      oscillator.connect(voice).connect(filter);
      oscillator.start();
      oscillators.push(oscillator);
      nodes.push(voice, oscillator);
    });
    // A slow continuous amplitude cycle makes each pad breathe without timers.
    const lfo = context.createOscillator();
    const modulation = context.createGain();
    lfo.frequency.value = { mono: .085, terminal: .13, neon: .26, winter: .052 }[this.theme];
    modulation.gain.value = profile.filter * .14;
    lfo.connect(modulation).connect(filter.frequency);
    lfo.start();
    oscillators.push(lfo);
    nodes.push(lfo, modulation);
    gain.gain.setTargetAtTime(1, context.currentTime, .6);
    this.ambience = { gain, nodes, oscillators };
    if (old) {
      old.gain.gain.setTargetAtTime(0, context.currentTime, .45);
      this.retiredAmbience.add(old);
      const timer = setTimeout(() => {
        this.disposeAmbience(old);
        this.retiredAmbience.delete(old);
        this.retireTimers.delete(timer);
      }, 2500);
      this.retireTimers.add(timer);
    }
  }

  play(event: AudioEvent) {
    const context = this.context;
    if (!context || !this.unlocked || this.settings.muted || context.state !== 'running' || this.settings.sfx === 0) return;
    const now = performance.now();
    const gap = event === 'hover' ? 160 : event === 'slider' ? 65 : 35;
    if (now - (this.lastPlayed.get(event) ?? -Infinity) < gap) return;
    this.lastPlayed.set(event, now);
    const profile = themeById[this.theme].audio;
    const notes: Record<AudioEvent, number[]> = {
      hover: [.85], click: [1], confirm: [1, 1.5], cancel: [1, .75], switch: [1.2, 1],
      dropdown: [.8, 1.1], slider: [.7], theme: [1, 1.25, 1.5], 'theme-change': [1, 1.25, 1.5],
      upload: [.75, 1, 1.5], complete: [1, 1.25, 1.5], 'processing-complete': [1, 1.25, 1.5],
      export: [1, 1.5, 2], error: [.6, .48],
    };
    notes[event].forEach((ratio, index) => {
      const start = context.currentTime + index * .065;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = event === 'error' ? 'triangle' : profile.wave;
      oscillator.frequency.setValueAtTime(profile.click * ratio, start);
      oscillator.frequency.exponentialRampToValueAtTime(profile.click * ratio * .72, start + profile.decay);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(event === 'hover' ? .055 : .18, start + .003);
      gain.gain.exponentialRampToValueAtTime(.0001, start + profile.decay + .025);
      oscillator.connect(gain).connect(this.sfxNode!);
      oscillator.start(start);
      oscillator.stop(start + profile.decay + .04);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }

  setVisible(visible: boolean) {
    if (!this.context) return;
    if (!visible) void this.context.suspend().catch(() => {});
    else if (this.unlocked && !this.settings.muted) void this.context.resume().catch(() => {});
  }

  private disposeAmbience(ambience: Ambience) {
    ambience.oscillators.forEach(oscillator => { try { oscillator.stop(); } catch { /* Already stopped. */ } });
    ambience.nodes.forEach(node => node.disconnect());
  }

  dispose() {
    this.retireTimers.forEach(clearTimeout);
    this.retireTimers.clear();
    this.retiredAmbience.forEach(pad => this.disposeAmbience(pad));
    this.retiredAmbience.clear();
    if (this.ambience) this.disposeAmbience(this.ambience);
    this.ambience = null;
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
    this.masterNode = this.musicNode = this.sfxNode = null;
    this.unlocked = false;
  }
}

export const audioManager = new AudioManager();
