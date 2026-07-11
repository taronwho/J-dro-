import type { LevelConfig } from '../engine/types';

interface Tier {
  size: number;
  wrap: boolean;
  coreCount: 1 | 2 | 3;
  lockedCount: number;
}

// Progrese: levely 1–4, 5–8, … po čtveřicích
const TIERS: Tier[] = [
  { size: 3, wrap: false, coreCount: 1, lockedCount: 0 }, // 1–4
  { size: 4, wrap: false, coreCount: 1, lockedCount: 0 }, // 5–8
  { size: 5, wrap: false, coreCount: 1, lockedCount: 0 }, // 9–12
  { size: 6, wrap: false, coreCount: 1, lockedCount: 0 }, // 13–16
  { size: 5, wrap: true, coreCount: 1, lockedCount: 0 }, // 17–20
  { size: 6, wrap: true, coreCount: 1, lockedCount: 0 }, // 21–24
  { size: 6, wrap: true, coreCount: 2, lockedCount: 2 }, // 25–28
  { size: 7, wrap: true, coreCount: 3, lockedCount: 4 }, // 29–32
];

export const LEVEL_COUNT = 32;

export const LEVELS: LevelConfig[] = Array.from({ length: LEVEL_COUNT }, (_, k) => {
  const id = k + 1;
  const tier = TIERS[Math.floor(k / 4)];
  return {
    id,
    seed: id * 7919 + 12345,
    width: tier.size,
    height: tier.size,
    wrap: tier.wrap,
    coreCount: tier.coreCount,
    lockedCount: tier.lockedCount,
  };
});
