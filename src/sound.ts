// Syntetizované zvukové efekty přes Web Audio API — žádné audio soubory,
// vše zůstává self-contained. AudioContext vzniká líně při prvním zvuku
// (mobilní prohlížeče ho povolí až po gestu uživatele).

const SOUND_KEY = 'jadro-sound';

let enabled = loadEnabled();
let ctx: AudioContext | null = null;

function loadEnabled(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
  try {
    window.localStorage.setItem(SOUND_KEY, value ? 'on' : 'off');
  } catch {
    // bez ukládání
  }
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface ToneOptions {
  freq: number;
  freqEnd?: number;
  duration: number; // s
  type?: OscillatorType;
  volume?: number;
  delay?: number; // s
}

function tone({ freq, freqEnd, duration, type = 'sine', volume = 0.12, delay = 0 }: ToneOptions): void {
  const ac = audio();
  if (ac === null) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + duration);
  }
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export const sfx = {
  // krátký mechanický tik otočení dlaždice
  rotate(): void {
    tone({ freq: 220, freqEnd: 160, duration: 0.05, type: 'triangle', volume: 0.07 });
  },
  // blip nového propojení — výška roste s počtem připojených dlaždic
  connect(count: number): void {
    const base = 440 + Math.min(count, 8) * 45;
    tone({ freq: base, freqEnd: base * 1.4, duration: 0.11, type: 'sine', volume: 0.1 });
  },
  // vítězné arpeggio
  win(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      tone({ freq, duration: 0.32, type: 'sine', volume: 0.11, delay: i * 0.09 });
      tone({ freq: freq * 2, duration: 0.18, type: 'triangle', volume: 0.04, delay: i * 0.09 });
    });
  },
  // vyčerpaný limit / konec času
  fail(): void {
    tone({ freq: 280, freqEnd: 130, duration: 0.35, type: 'sawtooth', volume: 0.08 });
    tone({ freq: 180, freqEnd: 90, duration: 0.4, type: 'sawtooth', volume: 0.06, delay: 0.12 });
  },
  // jiskra nápovědy
  hint(): void {
    tone({ freq: 880, freqEnd: 1400, duration: 0.14, type: 'sine', volume: 0.09 });
  },
  // fanfára úspěchu
  achievement(): void {
    tone({ freq: 660, duration: 0.22, type: 'triangle', volume: 0.1 });
    tone({ freq: 990, duration: 0.3, type: 'triangle', volume: 0.1, delay: 0.13 });
  },
};
