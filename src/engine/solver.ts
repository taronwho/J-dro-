import type { Dir, GameState, LevelConfig, Tile } from './types';

export const DX: readonly number[] = [0, 1, 0, -1];
export const DY: readonly number[] = [-1, 0, 1, 0];

export function opposite(d: Dir): Dir {
  return ((d + 2) % 4) as Dir;
}

// Index sousední buňky ve směru d; -1 = mimo mřížku (jen bez wrapu)
export function neighborIndex(index: number, d: Dir, config: LevelConfig): number {
  const { width, height, wrap } = config;
  const x = index % width;
  const y = Math.floor(index / width);
  let nx = x + DX[d];
  let ny = y + DY[d];
  if (wrap) {
    nx = (nx + width) % width;
    ny = (ny + height) % height;
  } else if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
    return -1;
  }
  return ny * width + nx;
}

export interface FlowResult {
  powered: boolean[];
  colors: number[]; // barva nejbližšího jádra, -1 = nenapájeno
  dists: number[]; // BFS vzdálenost od nejbližšího jádra, -1 = nenapájeno
  entryDirs: number[]; // strana, kterou energie do buňky vtekla, -1 = jádro/nenapájeno
}

// Multi-source BFS ze všech jader; při remíze vyhrává jádro s nižším indexem barvy
export function computeFlow(tiles: Tile[], config: LevelConfig): FlowResult {
  const n = tiles.length;
  const powered = new Array<boolean>(n).fill(false);
  const colors = new Array<number>(n).fill(-1);
  const dists = new Array<number>(n).fill(-1);
  const entryDirs = new Array<number>(n).fill(-1);

  const cores: number[] = [];
  for (let i = 0; i < n; i++) if (tiles[i].isCore) cores.push(i);
  cores.sort((a, b) => (tiles[a].coreColor ?? 0) - (tiles[b].coreColor ?? 0));

  const queue: number[] = [];
  for (const c of cores) {
    powered[c] = true;
    colors[c] = tiles[c].coreColor ?? 0;
    dists[c] = 0;
    queue.push(c);
  }

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    for (let d = 0; d < 4; d++) {
      const dir = d as Dir;
      if ((tiles[cur].mask & (1 << dir)) === 0) continue;
      const nb = neighborIndex(cur, dir, config);
      if (nb === -1 || powered[nb]) continue;
      if ((tiles[nb].mask & (1 << opposite(dir))) === 0) continue;
      powered[nb] = true;
      colors[nb] = colors[cur];
      dists[nb] = dists[cur] + 1;
      entryDirs[nb] = opposite(dir);
      queue.push(nb);
    }
  }

  return { powered, colors, dists, entryDirs };
}

export function computePowered(state: GameState): boolean[] {
  return computeFlow(state.tiles, state.config).powered;
}

// Bitmaska barev, které do každé buňky doteklo (bit c = barva c) —
// jedna trubka může vést i víc barev najednou
export function computeColors(tiles: Tile[], config: LevelConfig): number[] {
  const n = tiles.length;
  const out = new Array<number>(n).fill(0);
  for (let color = 0; color < 3; color++) {
    const visited = new Array<boolean>(n).fill(false);
    const queue: number[] = [];
    for (let i = 0; i < n; i++) {
      if (tiles[i].isCore && (tiles[i].coreColor ?? 0) === color) {
        visited[i] = true;
        queue.push(i);
      }
    }
    let head = 0;
    while (head < queue.length) {
      const cur = queue[head++];
      out[cur] |= 1 << color;
      for (let d = 0; d < 4; d++) {
        const dir = d as Dir;
        if ((tiles[cur].mask & (1 << dir)) === 0) continue;
        const nb = neighborIndex(cur, dir, config);
        if (nb === -1 || visited[nb]) continue;
        if ((tiles[nb].mask & (1 << opposite(dir))) === 0) continue;
        visited[nb] = true;
        queue.push(nb);
      }
    }
  }
  return out;
}

// Výhra: všechny dlaždice kromě zdí napájené + každý barevný cíl
// dostává energii své barvy
export function checkWin(tiles: Tile[], config: LevelConfig): boolean {
  const { powered } = computeFlow(tiles, config);
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i].isWall === true) continue;
    if (!powered[i]) return false;
  }
  const hasTargets = tiles.some((t) => t.targetColor !== undefined);
  if (hasTargets) {
    const colors = computeColors(tiles, config);
    for (let i = 0; i < tiles.length; i++) {
      const target = tiles[i].targetColor;
      if (target !== undefined && (colors[i] & (1 << target)) === 0) return false;
    }
  }
  return true;
}

export function isWon(state: GameState): boolean {
  return checkWin(state.tiles, state.config);
}

// Rozmrazí zamrzlé dlaždice: led taje, když do něj energie jeho barvy
// přímo vtéká, nebo když na něj míří sousední napájená trubka té barvy.
// Vrací nové pole dlaždic, nebo null beze změny.
export function applyMelt(tiles: Tile[], config: LevelConfig): Tile[] | null {
  const hasFrozen = tiles.some((t) => t.frozen === true);
  if (!hasFrozen) return null;
  const colors = computeColors(tiles, config);
  let changed = false;
  const next = tiles.map((tile, i) => {
    if (tile.frozen !== true || tile.frozenColor === undefined) return tile;
    const bit = 1 << tile.frozenColor;
    let melt = (colors[i] & bit) !== 0;
    if (!melt) {
      for (let d = 0; d < 4 && !melt; d++) {
        const dir = d as Dir;
        const nb = neighborIndex(i, dir, config);
        if (nb === -1 || (colors[nb] & bit) === 0) continue;
        // soused musí na led mířit konektorem
        if ((tiles[nb].mask & (1 << opposite(dir))) !== 0) melt = true;
      }
    }
    if (!melt) return tile;
    changed = true;
    return { ...tile, frozen: false };
  });
  return changed ? next : null;
}
