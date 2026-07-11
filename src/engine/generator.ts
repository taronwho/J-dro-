import { mulberry32 } from './rng';
import { computeFlow, neighborIndex, opposite } from './solver';
import type { Dir, GameState, LevelConfig, Tile } from './types';

// Rotace o 90° po směru hodinových ručiček
export function rotateCw(mask: number): number {
  return ((mask << 1) | (mask >> 3)) & 0b1111;
}

export function rotateCcw(mask: number): number {
  return ((mask >> 1) | (mask << 3)) & 0b1111;
}

export function bitCount(mask: number): number {
  let c = 0;
  for (let d = 0; d < 4; d++) if (mask & (1 << d)) c++;
  return c;
}

function rotateTimes(mask: number, times: number): number {
  let m = mask;
  for (let k = 0; k < times; k++) m = rotateCw(m);
  return m;
}

export function generateLevel(config: LevelConfig): GameState {
  const rng = mulberry32(config.seed);
  const { width, height, coreCount, lockedCount } = config;
  const n = width * height;

  // 1. Pozice jader — odlišné a pokud možno nesousedící
  const cores: number[] = [];
  let attempts = 0;
  while (cores.length < coreCount) {
    attempts++;
    const c = Math.floor(rng() * n);
    if (cores.includes(c)) continue;
    const adjacent = cores.some((o) => {
      for (let d = 0; d < 4; d++) {
        if (neighborIndex(o, d as Dir, config) === c) return true;
      }
      return false;
    });
    if (adjacent && attempts < 200) continue;
    cores.push(c);
  }

  // 2. Kostrový strom přes všechny buňky randomizovaným Primem, start v prvním jádru
  const solution = new Array<number>(n).fill(0);
  const inTree = new Array<boolean>(n).fill(false);
  const frontier: Array<{ from: number; dir: Dir }> = [];
  const addEdges = (from: number): void => {
    for (let d = 0; d < 4; d++) {
      const dir = d as Dir;
      const to = neighborIndex(from, dir, config);
      if (to !== -1 && !inTree[to]) frontier.push({ from, dir });
    }
  };
  inTree[cores[0]] = true;
  addEdges(cores[0]);
  while (frontier.length > 0) {
    const i = Math.floor(rng() * frontier.length);
    const edge = frontier[i];
    frontier[i] = frontier[frontier.length - 1];
    frontier.pop();
    const to = neighborIndex(edge.from, edge.dir, config);
    if (to === -1 || inTree[to]) continue;
    inTree[to] = true;
    solution[edge.from] |= 1 << edge.dir;
    solution[to] |= 1 << opposite(edge.dir);
    addEdges(to);
  }

  // 3. Dlaždice s konektory řešení
  const tiles: Tile[] = [];
  for (let i = 0; i < n; i++) {
    const coreIdx = cores.indexOf(i);
    tiles.push({
      mask: solution[i],
      solutionMask: solution[i],
      locked: coreIdx !== -1,
      isCore: coreIdx !== -1,
      ...(coreIdx !== -1 ? { coreColor: coreIdx } : {}),
    });
  }

  // 4. Zamčené dlaždice — nikdy koncovky, preferuj rovinky/kolena/T-kusy
  const shuffle = (arr: number[]): number[] => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const preferred: number[] = []; // 2–3 konektory
  const crosses: number[] = [];
  for (let i = 0; i < n; i++) {
    if (tiles[i].isCore) continue;
    const bc = bitCount(solution[i]);
    if (bc === 2 || bc === 3) preferred.push(i);
    else if (bc === 4) crosses.push(i);
  }
  const pool = [...shuffle(preferred), ...shuffle(crosses)];
  for (const idx of pool.slice(0, lockedCount)) {
    tiles[idx].locked = true;
  }

  // 5. Scramble nezamčených s kontrolou efektivní rozházenosti
  const unlockedIdxs: number[] = [];
  for (let i = 0; i < n; i++) if (!tiles[i].locked) unlockedIdxs.push(i);
  const threshold = Math.max(3, Math.floor(0.5 * unlockedIdxs.length));
  for (let attempt = 0; attempt < 20; attempt++) {
    for (const i of unlockedIdxs) {
      tiles[i].mask = rotateTimes(tiles[i].solutionMask, Math.floor(rng() * 4));
    }
    let diff = 0;
    for (const t of tiles) if (t.mask !== t.solutionMask) diff++;
    if (diff >= threshold) break;
  }

  // 6. Anti-instant-win pojistka
  let flow = computeFlow(tiles, config);
  if (flow.powered.every(Boolean)) {
    for (const i of unlockedIdxs) {
      if (rotateCw(tiles[i].mask) === tiles[i].mask) continue;
      tiles[i].mask = rotateCw(tiles[i].mask);
      flow = computeFlow(tiles, config);
      if (!flow.powered.every(Boolean)) break;
    }
  }

  return {
    tiles,
    config,
    moves: 0,
    powered: flow.powered,
    won: flow.powered.every(Boolean),
  };
}
