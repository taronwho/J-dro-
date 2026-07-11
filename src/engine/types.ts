export type Dir = 0 | 1 | 2 | 3; // N, E, S, W

export interface Tile {
  mask: number; // aktuální konektory (0–15), bit 0=N, 1=E, 2=S, 3=W
  solutionMask: number; // konektory v řešení
  locked: boolean;
  isCore: boolean;
  coreColor?: number; // index barvy 0–2, jen pro jádra a vizuál
}

export interface LevelConfig {
  id: number; // 1–32
  seed: number;
  width: number;
  height: number;
  wrap: boolean;
  coreCount: 1 | 2 | 3;
  lockedCount: number;
}

export interface GameState {
  tiles: Tile[]; // délka width*height, index = y*width + x
  config: LevelConfig;
  moves: number;
  powered: boolean[]; // přepočítáno po každém tahu
  won: boolean;
}
