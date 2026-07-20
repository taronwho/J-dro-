// Jemná haptická odezva přes Vibration API. Na desktopu (bez navigator.vibrate)
// je vše no-op. Nastavení se ukládá zvlášť od zvuku, aby šlo přepínat nezávisle.

const HAPTICS_KEY = 'jadro-haptics';

let enabled = loadEnabled();

function loadEnabled(): boolean {
  try {
    return window.localStorage.getItem(HAPTICS_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function isHapticsEnabled(): boolean {
  return enabled;
}

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
  try {
    window.localStorage.setItem(HAPTICS_KEY, value ? 'on' : 'off');
  } catch {
    // bez ukládání
  }
}

function buzz(pattern: number | number[]): void {
  if (!enabled) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // zařízení haptiku nepodporuje
  }
}

export const haptic = {
  rotate(): void {
    buzz(8);
  },
  connect(): void {
    buzz(14);
  },
  win(): void {
    buzz([0, 30, 40, 60]);
  },
  fail(): void {
    buzz([0, 60, 30, 60]);
  },
  melt(): void {
    buzz(18);
  },
  undo(): void {
    buzz(10);
  },
};
