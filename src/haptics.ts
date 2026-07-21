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

// Vibration API chybí např. v iOS Safari — tam vibrace fungovat nemohou.
export function isHapticsSupported(): boolean {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  } catch {
    return false;
  }
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

// Krátké vibrace (<20 ms) motor telefonu často nestihne roztočit, takže
// nejsou cítit — proto delší, jasně hmatatelné pulzy.
export const haptic = {
  rotate(): void {
    buzz(22);
  },
  connect(): void {
    buzz(35);
  },
  win(): void {
    buzz([0, 45, 55, 45, 55, 90]);
  },
  fail(): void {
    buzz([0, 90, 50, 90]);
  },
  melt(): void {
    buzz(30);
  },
  undo(): void {
    buzz(25);
  },
  // zřetelné potvrzení při zapnutí vibrací v nastavení
  test(): void {
    buzz([0, 40, 60, 40]);
  },
};
