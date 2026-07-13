import { mulberry32 } from './rng';
import { checkWin, computeFlow, neighborIndex, opposite } from './solver';
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

  // 0. Zdi mezi dlaždicemi (hrany jako v bludišti) — pole musí zůstat průchozí
  const wallMask = new Array<number>(n).fill(0);
  if ((config.wallCount ?? 0) > 0) {
    // kanonický výčet hran: (buňka, E) a (buňka, S) pokryje každou hranu jednou
    const edges: Array<{ cell: number; dir: Dir }> = [];
    for (let i = 0; i < n; i++) {
      for (const dir of [1, 2] as Dir[]) {
        if (neighborIndex(i, dir, config) !== -1) edges.push({ cell: i, dir });
      }
    }
    for (let want = Math.min(config.wallCount ?? 0, edges.length); want > 0; want--) {
      let placed = false;
      for (let attempt = 0; attempt < 40 && !placed; attempt++) {
        wallMask.fill(0);
        const chosen = new Set<number>();
        while (chosen.size < want) chosen.add(Math.floor(rng() * edges.length));
        for (const ei of chosen) {
          const { cell, dir } = edges[ei];
          const nb = neighborIndex(cell, dir, config);
          wallMask[cell] |= 1 << dir;
          wallMask[nb] |= 1 << opposite(dir);
        }
        // BFS: každá buňka musí zůstat dosažitelná i se zdmi
        const seen = new Array<boolean>(n).fill(false);
        seen[0] = true;
        const queue = [0];
        let head = 0;
        while (head < queue.length) {
          const cur = queue[head++];
          for (let d = 0; d < 4; d++) {
            const dir = d as Dir;
            if ((wallMask[cur] & (1 << dir)) !== 0) continue;
            const nb = neighborIndex(cur, dir, config);
            if (nb !== -1 && !seen[nb]) {
              seen[nb] = true;
              queue.push(nb);
            }
          }
        }
        placed = queue.length === n;
      }
      if (placed) break;
      wallMask.fill(0);
    }
  }

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

  // 2. Kostrový strom (nebo les — každé jádro vlastní strom) randomizovaným
  // Primem přes všechny buňky mimo zdi
  const solution = new Array<number>(n).fill(0);
  const region = new Array<number>(n).fill(0); // index jádra, jehož strom buňku napájí
  const inTree = new Array<boolean>(n).fill(false);
  const frontier: Array<{ from: number; dir: Dir }> = [];
  const addEdges = (from: number): void => {
    for (let d = 0; d < 4; d++) {
      const dir = d as Dir;
      if ((wallMask[from] & (1 << dir)) !== 0) continue; // přes zeď strom nevede
      const to = neighborIndex(from, dir, config);
      if (to !== -1 && !inTree[to]) frontier.push({ from, dir });
    }
  };
  const seeds = config.forest === true ? cores : [cores[0]];
  seeds.forEach((seed, idx) => {
    inTree[seed] = true;
    region[seed] = idx;
    addEdges(seed);
  });
  while (frontier.length > 0) {
    const i = Math.floor(rng() * frontier.length);
    const edge = frontier[i];
    frontier[i] = frontier[frontier.length - 1];
    frontier.pop();
    const to = neighborIndex(edge.from, edge.dir, config);
    if (to === -1 || inTree[to]) continue;
    inTree[to] = true;
    region[to] = region[edge.from];
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
      ...(wallMask[i] !== 0 ? { wallMask: wallMask[i] } : {}),
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

  // 4b. Barevné cíle: koncovky, které musí dostat energii svého stromu
  if ((config.targetCount ?? 0) > 0 && config.forest === true) {
    const endpoints: number[] = [];
    for (let i = 0; i < n; i++) {
      if (tiles[i].isCore || tiles[i].locked) continue;
      if (bitCount(solution[i]) === 1) endpoints.push(i);
    }
    shuffle(endpoints);
    for (const idx of endpoints.slice(0, config.targetCount)) {
      tiles[idx].targetColor = region[idx];
    }
  }

  // 4c. Zamrzlé dlaždice: max jedna na barevný strom, aby cesta od jádra
  // k ledu nikdy nevedla přes jiný led (garance rozmrazitelnosti)
  if ((config.frozenCount ?? 0) > 0) {
    const preferFrozen: number[] = [];
    const restFrozen: number[] = [];
    for (let i = 0; i < n; i++) {
      if (tiles[i].isCore || tiles[i].locked || tiles[i].targetColor !== undefined) {
        continue;
      }
      if (bitCount(solution[i]) >= 2) preferFrozen.push(i);
      else restFrozen.push(i);
    }
    shuffle(preferFrozen);
    shuffle(restFrozen);
    const usedRegions = new Set<number>();
    for (const idx of [...preferFrozen, ...restFrozen]) {
      if (usedRegions.size >= (config.frozenCount ?? 0)) break;
      if (usedRegions.has(region[idx])) continue;
      usedRegions.add(region[idx]);
      tiles[idx].frozenColor = region[idx];
      tiles[idx].frozen = true;
    }
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
  if (checkWin(tiles, config)) {
    for (const i of unlockedIdxs) {
      if (rotateCw(tiles[i].mask) === tiles[i].mask) continue;
      tiles[i].mask = rotateCw(tiles[i].mask);
      if (!checkWin(tiles, config)) break;
    }
  }
  const flow = computeFlow(tiles, config);

  // Par: součet minimálních rotací každé dlaždice k masce řešení
  let par = 0;
  for (const t of tiles) {
    if (t.locked) continue;
    let m = t.mask;
    let r = 0;
    while (m !== t.solutionMask && r < 4) {
      m = rotateCw(m);
      r++;
    }
    par += r;
  }

  return {
    tiles,
    config,
    moves: 0,
    powered: flow.powered,
    won: checkWin(tiles, config),
    par,
    moveLimit: config.movesMargin !== undefined ? par + config.movesMargin : null,
  };
}
