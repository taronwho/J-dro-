export type Dir = 0 | 1 | 2 | 3; // N, E, S, W

export interface Tile {
  mask: number; // aktuální konektory (0–15), bit 0=N, 1=E, 2=S, 3=W
  solutionMask: number; // konektory v řešení
  locked: boolean;
  isCore: boolean;
  coreColor?: number; // index barvy 0–2, jen pro jádra a vizuál
  wallMask?: number; // zdi na hranách buňky (bitmaska směrů) — tudy spoj nevede
  targetColor?: number; // koncovka musí dostat energii této barvy
  frozenColor?: number; // barva, která dlaždici rozmrazí
  frozen?: boolean; // aktuálně zamrzlá (nelze otáčet)
}

export interface LevelConfig {
  id: number; // 1–100
  seed: number;
  width: number;
  height: number;
  wrap: boolean;
  coreCount: 1 | 2 | 3;
  lockedCount: number;
  movesMargin?: number; // limit tahů = par + margin; undefined = bez limitu
  forest?: boolean; // každé jádro napájí vlastní strom (oddělené barevné sítě)
  wallCount?: number; // počet zdí mezi dlaždicemi (hrany jako v bludišti)
  targetCount?: number; // počet barevných cílů (koncovek)
  frozenCount?: number; // počet zamrzlých dlaždic (max 1 na barevnou síť)
}

export interface GameState {
  tiles: Tile[]; // délka width*height, index = y*width + x
  config: LevelConfig;
  moves: number;
  powered: boolean[]; // přepočítáno po každém tahu
  won: boolean;
  par: number; // minimální počet tahů (součet nejkratších rotací k řešení)
  moveLimit: number | null; // maximum tahů, null = bez limitu
}
