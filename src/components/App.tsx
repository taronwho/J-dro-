import { useEffect, useMemo, useRef, useState } from 'react';
import { generateLevel, rotateCw } from '../engine/generator';
import { computeFlow } from '../engine/solver';
import type { GameState } from '../engine/types';
import { detectLang, I18nContext, makeT, persistLang, type Lang } from '../i18n/i18n';
import { LEVELS, LEVEL_COUNT } from '../levels/levels';
import { Board } from './Board';
import { HUD } from './HUD';
import { Menu } from './Menu';

type Screen = 'menu' | 'game' | 'victory';

export interface BestEntry {
  moves: number;
  stars: number;
}

interface Progress {
  unlocked: number;
  completed: number[];
  best: Record<number, BestEntry>;
}

// Kaskáda rozsvícení: delays[i] v ms (-1 = bez animace), entries[i] = strana vstupu světla
export interface Ignite {
  gen: number;
  delays: number[];
  entries: number[];
}

interface LastWin {
  stars: number;
  newRecord: boolean;
  bestMoves: number;
}

const STORAGE_KEY = 'jadro-progress';

// Fallback do paměti, když localStorage není dostupný
let memoryProgress: Progress | null = null;

function loadProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw) as Partial<Progress>;
      if (typeof parsed.unlocked === 'number' && Array.isArray(parsed.completed)) {
        const best: Record<number, BestEntry> = {};
        if (parsed.best && typeof parsed.best === 'object') {
          for (const [id, entry] of Object.entries(parsed.best)) {
            if (
              entry &&
              typeof entry.moves === 'number' &&
              typeof entry.stars === 'number'
            ) {
              best[Number(id)] = { moves: entry.moves, stars: entry.stars };
            }
          }
        }
        return {
          unlocked: Math.min(Math.max(Math.floor(parsed.unlocked), 1), LEVEL_COUNT),
          completed: parsed.completed.filter((x): x is number => typeof x === 'number'),
          best,
        };
      }
    }
  } catch {
    // localStorage nedostupný — hrajeme bez ukládání
  }
  return memoryProgress ?? { unlocked: 1, completed: [], best: {} };
}

function saveProgress(progress: Progress): void {
  memoryProgress = progress;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // hra běží dál jen s pamětí
  }
}

export function starsFor(moves: number, par: number): number {
  if (moves <= par) return 3;
  if (moves <= Math.ceil(par * 1.5)) return 2;
  return 1;
}

export function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [game, setGame] = useState<GameState | null>(null);
  const [rotations, setRotations] = useState<number[]>([]);
  const [ignite, setIgnite] = useState<Ignite>({ gen: 0, delays: [], entries: [] });
  const [lastWin, setLastWin] = useState<LastWin | null>(null);
  const [lang, setLangState] = useState<Lang>(detectLang);
  const waveTimer = useRef<number | null>(null);

  const i18n = useMemo(
    () => ({
      lang,
      setLang: (next: Lang) => {
        setLangState(next);
        persistLang(next);
      },
      t: makeT(lang),
    }),
    [lang],
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    return () => {
      if (waveTimer.current !== null) window.clearTimeout(waveTimer.current);
    };
  }, []);

  const clearWaveTimer = (): void => {
    if (waveTimer.current !== null) {
      window.clearTimeout(waveTimer.current);
      waveTimer.current = null;
    }
  };

  const startLevel = (id: number): void => {
    clearWaveTimer();
    const state = generateLevel(LEVELS[id - 1]);
    const flow = computeFlow(state.tiles, state.config);
    setGame(state);
    setRotations(new Array(state.tiles.length).fill(0));
    // úvodní kaskáda: světlo se rozlije z jader do už propojených dlaždic
    setIgnite((prev) => ({
      gen: prev.gen + 1,
      delays: flow.dists.map((d) => (d >= 0 ? d * 70 : -1)),
      entries: flow.entryDirs,
    }));
    setLastWin(null);
    setScreen('game');
  };

  const goMenu = (): void => {
    clearWaveTimer();
    setGame(null);
    setScreen('menu');
  };

  const handleTileClick = (index: number): void => {
    if (!game || game.won) return;
    const tile = game.tiles[index];
    if (tile.locked) return;

    const tiles = game.tiles.slice();
    tiles[index] = { ...tile, mask: rotateCw(tile.mask) };
    const flow = computeFlow(tiles, game.config);
    const won = flow.powered.every(Boolean);
    const next: GameState = {
      ...game,
      tiles,
      moves: game.moves + 1,
      powered: flow.powered,
      won,
    };
    setGame(next);
    setRotations((prev) => {
      const copy = prev.slice();
      copy[index] += 1;
      return copy;
    });

    // nově napájené dlaždice: světlo do nich vteče kaskádou od místa připojení
    const fresh = flow.powered.map((p, i) => p && !game.powered[i]);
    const anyFresh = fresh.some(Boolean);
    let minDist = Infinity;
    flow.dists.forEach((d, i) => {
      if (fresh[i] && d >= 0 && d < minDist) minDist = d;
    });
    setIgnite((prev) => ({
      gen: anyFresh ? prev.gen + 1 : prev.gen,
      delays: flow.dists.map((d, i) => (fresh[i] ? 120 + (d - minDist) * 70 : -1)),
      entries: flow.entryDirs,
    }));

    if (won) {
      const id = game.config.id;
      const stars = starsFor(next.moves, next.par);
      const prevBest = progress.best[id];
      const newRecord = prevBest === undefined || next.moves < prevBest.moves;
      const bestMoves = newRecord ? next.moves : prevBest.moves;
      setLastWin({ stars, newRecord, bestMoves });

      const completed = progress.completed.includes(id)
        ? progress.completed
        : [...progress.completed, id];
      const updated: Progress = {
        unlocked: Math.max(progress.unlocked, Math.min(id + 1, LEVEL_COUNT)),
        completed,
        best: {
          ...progress.best,
          [id]: newRecord
            ? { moves: next.moves, stars: Math.max(stars, prevBest?.stars ?? 0) }
            : prevBest,
        },
      };
      setProgress(updated);
      saveProgress(updated);

      // výherní vlna: overlay až po doběhnutí rozsvícení
      const maxDist = flow.dists.reduce((m, d) => Math.max(m, d), 0);
      clearWaveTimer();
      waveTimer.current = window.setTimeout(() => {
        setScreen('victory');
      }, maxDist * 40 + 600);
    }
  };

  let content;
  if (screen === 'menu' || game === null) {
    content = (
      <Menu
        unlocked={progress.unlocked}
        completed={progress.completed}
        best={progress.best}
        onSelect={startLevel}
      />
    );
  } else {
    const levelId = game.config.id;
    content = (
      <div className="game-screen">
        <HUD
          levelId={levelId}
          moves={game.moves}
          par={game.par}
          onReset={() => startLevel(levelId)}
          onMenu={goMenu}
        />
        <Board
          game={game}
          rotations={rotations}
          ignite={ignite}
          showOverlay={screen === 'victory'}
          lastWin={lastWin}
          onTileClick={handleTileClick}
          onNext={levelId < LEVEL_COUNT ? () => startLevel(levelId + 1) : null}
          onMenu={goMenu}
        />
      </div>
    );
  }

  return <I18nContext.Provider value={i18n}>{content}</I18nContext.Provider>;
}
