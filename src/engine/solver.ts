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

// Kam vede konektor buňky i směrem d: běžný soused, partner portálu,
// nebo null (zeď / okraj pole). backDir = strana, kterou spoj vstupuje.
export function linkTarget(
  tiles: Tile[],
  i: number,
  d: Dir,
  config: LevelConfig,
): { cell: number; backDir: Dir } | null {
  const tile = tiles[i];
  if (tile.portalDir === d && tile.portalPair !== undefined) {
    for (let j = 0; j < tiles.length; j++) {
      const partnerDir = tiles[j].portalDir;
      if (j !== i && tiles[j].portalPair === tile.portalPair && partnerDir !== undefined) {
        return { cell: j, backDir: partnerDir };
      }
    }
    return null;
  }
  if (((tile.wallMask ?? 0) & (1 << d)) !== 0) return null;
  const nb = neighborIndex(i, d, config);
  return nb === -1 ? null : { cell: nb, backDir: opposite(d) };
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
      const link = linkTarget(tiles, cur, dir, config);
      if (link === null || powered[link.cell]) continue;
      if ((tiles[link.cell].mask & (1 << link.backDir)) === 0) continue;
      powered[link.cell] = true;
      colors[link.cell] = colors[cur];
      dists[link.cell] = dists[cur] + 1;
      entryDirs[link.cell] = link.backDir;
      queue.push(link.cell);
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
        const link = linkTarget(tiles, cur, dir, config);
        if (link === null || visited[link.cell]) continue;
        if ((tiles[link.cell].mask & (1 << link.backDir)) === 0) continue;
        visited[link.cell] = true;
        queue.push(link.cell);
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
        const link = linkTarget(tiles, i, dir, config); // zeď led neroztaví
        if (link === null || (colors[link.cell] & bit) === 0) continue;
        // soused (i skrz portál) musí na led mířit konektorem
        if ((tiles[link.cell].mask & (1 << link.backDir)) !== 0) melt = true;
      }
    }
    if (!melt) return tile;
    changed = true;
    return { ...tile, frozen: false };
  });
  return changed ? next : null;
}
