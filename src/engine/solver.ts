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
}

// Multi-source BFS ze všech jader; při remíze vyhrává jádro s nižším indexem barvy
export function computeFlow(tiles: Tile[], config: LevelConfig): FlowResult {
  const n = tiles.length;
  const powered = new Array<boolean>(n).fill(false);
  const colors = new Array<number>(n).fill(-1);
  const dists = new Array<number>(n).fill(-1);

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
      queue.push(nb);
    }
  }

  return { powered, colors, dists };
}

export function computePowered(state: GameState): boolean[] {
  return computeFlow(state.tiles, state.config).powered;
}

export function isWon(state: GameState): boolean {
  return computePowered(state).every(Boolean);
}
