import type { LevelConfig } from '../engine/types';

interface Tier {
  from: number;
  to: number;
  size: number;
  wrap: boolean;
  coreCount: 1 | 2 | 3;
  lockedCount: number;
  movesMargin?: number;
  forest?: boolean;
  wallCount?: number;
  targetCount?: number;
  frozenCount?: number;
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
  // Sektor 6: oddělené barevné sítě (les), zdi, barevné cíle, zamrzlé dlaždice
  { from: 101, to: 104, size: 6, wrap: false, coreCount: 2, lockedCount: 0, forest: true, wallCount: 6, targetCount: 2 },
  { from: 105, to: 108, size: 6, wrap: false, coreCount: 2, lockedCount: 0, forest: true, wallCount: 8, targetCount: 2, frozenCount: 1 },
  { from: 109, to: 112, size: 7, wrap: false, coreCount: 2, lockedCount: 2, forest: true, wallCount: 9, targetCount: 3, frozenCount: 1 },
  { from: 113, to: 116, size: 7, wrap: false, coreCount: 3, lockedCount: 2, forest: true, wallCount: 10, targetCount: 3, frozenCount: 2 },
  { from: 117, to: 120, size: 7, wrap: true, coreCount: 3, lockedCount: 2, forest: true, wallCount: 12, targetCount: 4, frozenCount: 3 },
];

export const LEVEL_COUNT = 120;

// Menu dělí levely do sektorů po 20
export const CHAPTER_SIZE = 20;
export const CHAPTER_COUNT = LEVEL_COUNT / CHAPTER_SIZE;

// ---------- Balíčky výzev: každá mechanika zvlášť, od nejlehčí po nejtěžší ----------

export type PackId = 'colors' | 'maze' | 'ice';

export interface LevelPack {
  id: PackId;
  levels: LevelConfig[];
}

interface PackTier {
  count: number;
  size: number;
  wrap: boolean;
  coreCount: 1 | 2 | 3;
  lockedCount: number;
  forest?: boolean;
  wallCount?: number;
  targetCount?: number;
  frozenCount?: number;
}

// Vlastní číselný prostor id (1001+, 2001+, 3001+) => jiné seedy, jiné mapy
// než v kampani; id se používají i pro ukládání postupu a hvězd
function buildPack(id: PackId, baseId: number, tiers: PackTier[]): LevelPack {
  const levels: LevelConfig[] = [];
  for (const tier of tiers) {
    for (let k = 0; k < tier.count; k++) {
      const lid = baseId + levels.length + 1;
      levels.push({
        id: lid,
        seed: lid * 7919 + 12345,
        width: tier.size,
        height: tier.size,
        wrap: tier.wrap,
        coreCount: tier.coreCount,
        lockedCount: tier.lockedCount,
        ...(tier.forest === true ? { forest: true } : {}),
        ...(tier.wallCount !== undefined ? { wallCount: tier.wallCount } : {}),
        ...(tier.targetCount !== undefined ? { targetCount: tier.targetCount } : {}),
        ...(tier.frozenCount !== undefined ? { frozenCount: tier.frozenCount } : {}),
      });
    }
  }
  return { id, levels };
}

export const PACKS: LevelPack[] = [
  buildPack('colors', 1000, [
    { count: 2, size: 4, wrap: false, coreCount: 2, lockedCount: 0, forest: true, targetCount: 1 },
    { count: 2, size: 5, wrap: false, coreCount: 2, lockedCount: 0, forest: true, targetCount: 2 },
    { count: 2, size: 6, wrap: false, coreCount: 2, lockedCount: 0, forest: true, targetCount: 3 },
    { count: 2, size: 6, wrap: false, coreCount: 3, lockedCount: 0, forest: true, targetCount: 3 },
    { count: 2, size: 7, wrap: false, coreCount: 3, lockedCount: 0, forest: true, targetCount: 4 },
    { count: 2, size: 7, wrap: true, coreCount: 3, lockedCount: 2, forest: true, targetCount: 4 },
  ]),
  buildPack('maze', 2000, [
    { count: 2, size: 4, wrap: false, coreCount: 1, lockedCount: 0, wallCount: 3 },
    { count: 2, size: 5, wrap: false, coreCount: 1, lockedCount: 0, wallCount: 5 },
    { count: 2, size: 5, wrap: false, coreCount: 1, lockedCount: 0, wallCount: 7 },
    { count: 2, size: 6, wrap: false, coreCount: 1, lockedCount: 0, wallCount: 9 },
    { count: 2, size: 7, wrap: false, coreCount: 1, lockedCount: 0, wallCount: 12 },
    { count: 2, size: 7, wrap: true, coreCount: 1, lockedCount: 2, wallCount: 14 },
  ]),
  buildPack('ice', 3000, [
    { count: 2, size: 4, wrap: false, coreCount: 1, lockedCount: 0, frozenCount: 1 },
    { count: 2, size: 5, wrap: false, coreCount: 1, lockedCount: 0, frozenCount: 1 },
    { count: 2, size: 5, wrap: false, coreCount: 2, lockedCount: 0, forest: true, frozenCount: 2 },
    { count: 2, size: 6, wrap: false, coreCount: 2, lockedCount: 0, forest: true, frozenCount: 2 },
    { count: 2, size: 7, wrap: false, coreCount: 3, lockedCount: 0, forest: true, frozenCount: 3 },
    { count: 2, size: 7, wrap: true, coreCount: 3, lockedCount: 2, forest: true, frozenCount: 3 },
  ]),
];

export const PACK_LEVEL_TOTAL = PACKS.reduce((sum, p) => sum + p.levels.length, 0);

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
    ...(tier.forest === true ? { forest: true } : {}),
    ...(tier.wallCount !== undefined ? { wallCount: tier.wallCount } : {}),
    ...(tier.targetCount !== undefined ? { targetCount: tier.targetCount } : {}),
    ...(tier.frozenCount !== undefined ? { frozenCount: tier.frozenCount } : {}),
  };
});
