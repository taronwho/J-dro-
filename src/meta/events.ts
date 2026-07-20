import type { LevelConfig } from '../engine/types';

type Lang = 'cs' | 'en' | 'de';

export interface WeekendEvent {
  weekId: string; // např. "2026-W29"
  themeIndex: number; // 0–3
  name: Record<Lang, string>;
  levels: LevelConfig[]; // 3 speciální levely
}

const THEME_NAMES: Array<Record<Lang, string>> = [
  { cs: 'Bludištní víkend', en: 'Maze weekend', de: 'Labyrinth-Wochenende' },
  { cs: 'Ledový víkend', en: 'Frozen weekend', de: 'Frost-Wochenende' },
  { cs: 'Portálový víkend', en: 'Portal weekend', de: 'Portal-Wochenende' },
  { cs: 'Barevný víkend', en: 'Color weekend', de: 'Farben-Wochenende' },
];

// ISO číslo týdne (stejné pro všechny hráče)
function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 6 || day === 0;
}

// Event daného víkendu — deterministický ze čísla týdne, 3 levely
// s rostoucí obtížností v tématu týdne
export function weekendEvent(date: Date): WeekendEvent {
  const { year, week } = isoWeek(date);
  const weekId = `${year}-W${String(week).padStart(2, '0')}`;
  const themeIndex = week % 4;
  const base = (year * 100 + week) * 7919 + 4242;
  const sizes = [5, 6, 7];

  const levels: LevelConfig[] = sizes.map((size, i) => {
    const common = {
      id: 0,
      seed: (base + i * 1013) >>> 0,
      width: size,
      height: size,
      wrap: false,
      lockedCount: 0,
    };
    switch (themeIndex) {
      case 0: // bludiště
        return { ...common, coreCount: 1 as const, wallCount: 5 + i * 4 };
      case 1: // led
        return {
          ...common,
          coreCount: 2 as const,
          forest: true,
          frozenCount: 2 + i,
        };
      case 2: // portály
        return {
          ...common,
          coreCount: (i === 2 ? 2 : 1) as 1 | 2,
          ...(i === 2 ? { forest: true, targetCount: 1 } : {}),
          portalCount: 1 + Math.floor(i / 2),
        };
      default: // barevné sítě
        return {
          ...common,
          coreCount: (2 + Math.floor(i / 2)) as 2 | 3,
          forest: true,
          targetCount: 1 + i,
        };
    }
  });

  return { weekId, themeIndex, name: THEME_NAMES[themeIndex], levels };
}

export const EVENT_REWARD_HINTS = 3;
