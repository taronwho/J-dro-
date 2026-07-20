// Nastavení „omezit animace". Bere v potaz i systémovou preferenci
// prefers-reduced-motion — pokud ji uživatel má zapnutou, bereme to jako
// výchozí redukci. Ruční přepínač uloží explicitní volbu.

const MOTION_KEY = 'jadro-motion';

function systemPrefersReduced(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function loadReducedMotion(): boolean {
  try {
    const saved = window.localStorage.getItem(MOTION_KEY);
    if (saved === 'reduced') return true;
    if (saved === 'full') return false;
  } catch {
    // localStorage nedostupný
  }
  return systemPrefersReduced();
}

export function persistReducedMotion(value: boolean): void {
  try {
    window.localStorage.setItem(MOTION_KEY, value ? 'reduced' : 'full');
  } catch {
    // běžíme dál bez ukládání
  }
}
