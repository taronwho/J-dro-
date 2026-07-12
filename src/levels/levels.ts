import type { LevelConfig } from '../engine/types';

interface Tier {
  from: number;
  to: number;
  size: number;
  wrap: boolean;
  coreCount: 1 | 2 | 3;
  lockedCount: number;
  movesMargin?: number;
}

// Progrese 100 levelů. Levely 1–32 zůstávají shodné s původní verzí
// (stejné seedy i parametry), od 33 roste obtížnost kombinacemi wrap /
// více jader / zamčených dlaždic a od 61 limity tahů (par + margin).
const TIERS: Tier[] = [
  { from: 1, to: 4, size: 3, wrap: false, coreCount: 1, lockedCount: 0 },
  { from: 5, to: 8, size: 4, wrap: false, coreCount: 1, lockedCount: 0 },
  { from: 9, to: 12, size: 5, wrap: false, coreCount: 1, lockedCount: 0 },
  { from: 13, to: 16, size: 6, wrap: false, coreCount: 1, lockedCount: 0 },
  { from: 17, to: 20, size: 5, wrap: true, coreCount: 1, lockedCount: 0 },
  { from: 21, to: 24, size: 6, wrap: true, coreCount: 1, lockedCount: 0 },
  { from: 25, to: 28, size: 6, wrap: true, coreCount: 2, lockedCount: 2 },
  { from: 29, to: 32, size: 7, wrap: true, coreCount: 3, lockedCount: 4 },
  { from: 33, to: 40, size: 7, wrap: false, coreCount: 2, lockedCount: 3 },
  { from: 41, to: 48, size: 6, wrap: true, coreCount: 2, lockedCount: 4 },
  { from: 49, to: 56, size: 7, wrap: true, coreCount: 2, lockedCount: 5 },
  { from: 57, to: 60, size: 7, wrap: true, coreCount: 3, lockedCount: 6 },
  { from: 61, to: 68, size: 6, wrap: true, coreCount: 2, lockedCount: 3, movesMargin: 12 },
  { from: 69, to: 76, size: 7, wrap: false, coreCount: 2, lockedCount: 4, movesMargin: 10 },
  { from: 77, to: 84, size: 7, wrap: true, coreCount: 3, lockedCount: 5, movesMargin: 8 },
  { from: 85, to: 92, size: 7, wrap: true, coreCount: 3, lockedCount: 6, movesMargin: 6 },
  { from: 93, to: 100, size: 7, wrap: true, coreCount: 3, lockedCount: 6, movesMargin: 4 },
];

export const LEVEL_COUNT = 100;

// Menu dělí levely do sektorů po 20
export const CHAPTER_SIZE = 20;
export const CHAPTER_COUNT = LEVEL_COUNT / CHAPTER_SIZE;

export const LEVELS: LevelConfig[] = Array.from({ length: LEVEL_COUNT }, (_, k) => {
  const id = k + 1;
  const tier = TIERS.find((t) => id >= t.from && id <= t.to);
  if (tier === undefined) throw new Error(`Chybí tier pro level ${id}`);
  return {
    id,
    seed: id * 7919 + 12345,
    width: tier.size,
    height: tier.size,
    wrap: tier.wrap,
    coreCount: tier.coreCount,
    lockedCount: tier.lockedCount,
    ...(tier.movesMargin !== undefined ? { movesMargin: tier.movesMargin } : {}),
  };
});
