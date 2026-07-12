import { createContext, useContext } from 'react';

export type Lang = 'cs' | 'en' | 'de';

export const LANGS: readonly Lang[] = ['cs', 'en', 'de'];

const STRINGS = {
  tagline: {
    cs: 'Otáčej dlaždice a napoj celou síť na jádro.',
    en: 'Rotate the tiles and connect the whole grid to the core.',
    de: 'Drehe die Kacheln und verbinde das ganze Netz mit dem Kern.',
  },
  level: { cs: 'Level {n}', en: 'Level {n}', de: 'Level {n}' },
  moves: { cs: 'Tahy: {n}', en: 'Moves: {n}', de: 'Züge: {n}' },
  target: { cs: 'Cíl: {n}', en: 'Target: {n}', de: 'Ziel: {n}' },
  reset: { cs: 'Reset', en: 'Reset', de: 'Reset' },
  menu: { cs: 'Menu', en: 'Menu', de: 'Menü' },
  levelDone: { cs: 'Level dokončen', en: 'Level complete', de: 'Level geschafft' },
  overlayMoves: { cs: 'Počet tahů: {n}', en: 'Moves used: {n}', de: 'Benötigte Züge: {n}' },
  best: { cs: 'Nejlepší: {n}', en: 'Best: {n}', de: 'Bestwert: {n}' },
  newRecord: { cs: 'Nový rekord!', en: 'New record!', de: 'Neuer Rekord!' },
  next: { cs: 'Další level', en: 'Next level', de: 'Nächstes Level' },
  starsTotal: { cs: '{x} / {y} hvězd', en: '{x} / {y} stars', de: '{x} / {y} Sterne' },
  limit: { cs: 'Limit: {n}', en: 'Limit: {n}', de: 'Limit: {n}' },
  sector: { cs: 'Sektor {n}', en: 'Sector {n}', de: 'Sektor {n}' },
  hintTitle: { cs: 'Nápověda', en: 'Hint', de: 'Hinweis' },
  hintModeMsg: {
    cs: 'Vyber dlaždici — otočí se správně a zamkne se.',
    en: 'Pick a tile — it will rotate into place and lock.',
    de: 'Wähle eine Kachel — sie dreht sich richtig und wird gesperrt.',
  },
  hintNone: {
    cs: 'Žádné nápovědy. Získáš je za perfektní řešení a úspěchy.',
    en: 'No hints left. Earn them with perfect solves and achievements.',
    de: 'Keine Hinweise. Verdiene sie mit perfekten Lösungen und Erfolgen.',
  },
  hintCapNote: {
    cs: 'Použita nápověda — nejvýše 2 hvězdy',
    en: 'Hint used — capped at 2 stars',
    de: 'Hinweis genutzt — höchstens 2 Sterne',
  },
  hintEarned: {
    cs: '+1 nápověda za perfektní řešení',
    en: '+1 hint for a perfect solve',
    de: '+1 Hinweis für eine perfekte Lösung',
  },
  failTitle: { cs: 'Došly tahy', en: 'Out of moves', de: 'Keine Züge mehr' },
  failText: {
    cs: 'Limit {n} tahů je vyčerpán. Zkus to znovu.',
    en: 'The limit of {n} moves is used up. Try again.',
    de: 'Das Limit von {n} Zügen ist aufgebraucht. Versuch es nochmal.',
  },
  retry: { cs: 'Zkusit znovu', en: 'Try again', de: 'Nochmal' },
  achievements: { cs: 'Úspěchy', en: 'Achievements', de: 'Erfolge' },
  newAchievement: { cs: 'Nový úspěch!', en: 'New achievement!', de: 'Neuer Erfolg!' },
  close: { cs: 'Zavřít', en: 'Close', de: 'Schließen' },
  statLevels: { cs: 'Levely', en: 'Levels', de: 'Level' },
  statHints: { cs: 'Nápovědy', en: 'Hints', de: 'Hinweise' },
  statStreak: { cs: 'Nejlepší série', en: 'Best streak', de: 'Beste Serie' },
  rewardHint: { cs: '+{n} nápověda', en: '+{n} hint', de: '+{n} Hinweis' },
  ariaCore: { cs: 'Jádro', en: 'Core', de: 'Kern' },
  ariaLocked: { cs: 'Zamčená dlaždice', en: 'Locked tile', de: 'Gesperrte Kachel' },
  ariaTile: { cs: 'Dlaždice', en: 'Tile', de: 'Kachel' },
  ariaLockedLevel: { cs: 'Zamčený level', en: 'Locked level', de: 'Gesperrtes Level' },
} as const;

export type TKey = keyof typeof STRINGS;

export type TFunc = (key: TKey, vars?: Record<string, string | number>) => string;

export function makeT(lang: Lang): TFunc {
  return (key, vars) => {
    let text: string = STRINGS[key][lang];
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replace(`{${name}}`, String(value));
      }
    }
    return text;
  };
}

const LANG_KEY = 'jadro-lang';

export function detectLang(): Lang {
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === 'cs' || saved === 'en' || saved === 'de') return saved;
  } catch {
    // localStorage nedostupný
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  if (nav.startsWith('cs') || nav.startsWith('sk')) return 'cs';
  if (nav.startsWith('de')) return 'de';
  return 'en';
}

export function persistLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    // běžíme dál bez ukládání
  }
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFunc;
}

export const I18nContext = createContext<I18nValue | null>(null);

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (value === null) throw new Error('useI18n mimo I18nContext');
  return value;
}
