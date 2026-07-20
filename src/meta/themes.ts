type Lang = 'cs' | 'en' | 'de';

export interface ThemeDef {
  id: string;
  minRank: number; // hodnost potřebná k odemčení
  name: Record<Lang, string>;
  colors: [string, string, string]; // --core-0/1/2
}

// Barevná témata trubek — odemykají se hodnostmi (aplikují se přes
// data-theme na <html> a CSS proměnné)
export const THEMES: ThemeDef[] = [
  {
    id: 'default',
    minRank: 1,
    name: { cs: 'Neon', en: 'Neon', de: 'Neon' },
    colors: ['#22e0ff', '#ff3df0', '#ffb52e'],
  },
  {
    id: 'sunset',
    minRank: 3,
    name: { cs: 'Západ slunce', en: 'Sunset', de: 'Sonnenuntergang' },
    colors: ['#ff9d4d', '#ff4d88', '#ffe14d'],
  },
  {
    id: 'matrix',
    minRank: 6,
    name: { cs: 'Matrix', en: 'Matrix', de: 'Matrix' },
    colors: ['#4dff88', '#b6ff4d', '#4dffe1'],
  },
  {
    id: 'aurora',
    minRank: 9,
    name: { cs: 'Polární záře', en: 'Aurora', de: 'Polarlicht' },
    colors: ['#6de5b9', '#a78bfa', '#63b3ff'],
  },
  {
    id: 'inferno',
    minRank: 13,
    name: { cs: 'Inferno', en: 'Inferno', de: 'Inferno' },
    colors: ['#ff5d3d', '#ffb52e', '#ff3d6e'],
  },
  {
    id: 'frost',
    minRank: 17,
    name: { cs: 'Mráz', en: 'Frost', de: 'Frost' },
    colors: ['#bfe9ff', '#7aa8ff', '#e8f6ff'],
  },
];

const THEME_KEY = 'jadro-theme';

export function loadTheme(): string {
  try {
    return window.localStorage.getItem(THEME_KEY) ?? 'default';
  } catch {
    return 'default';
  }
}

export function persistTheme(id: string): void {
  try {
    window.localStorage.setItem(THEME_KEY, id);
  } catch {
    // bez ukládání
  }
}
