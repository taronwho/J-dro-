import { useEffect, useMemo, useRef, useState } from 'react';
import { generateLevel, rotateCw } from '../engine/generator';
import { computeFlow } from '../engine/solver';
import type { GameState, LevelConfig } from '../engine/types';
import { detectLang, I18nContext, makeT, persistLang, type Lang } from '../i18n/i18n';
import { LEVELS, LEVEL_COUNT } from '../levels/levels';
import { newlyUnlocked, type AchievementDef } from '../meta/achievements';
import { Board } from './Board';
import { Help, type HelpSection } from './Help';
import { HUD } from './HUD';
import { Menu } from './Menu';

type Screen = 'menu' | 'game' | 'victory';

export type Mode =
  | { kind: 'level'; id: number }
  | { kind: 'daily' }
  | { kind: 'endless' };

export interface BestEntry {
  moves: number;
  stars: number;
}

export interface Progress {
  unlocked: number;
  completed: number[];
  best: Record<number, BestEntry>;
  hints: number;
  hintsEarned: number[]; // levely, které už daly nápovědu za 3 hvězdy
  achievements: string[];
  streak: number; // aktuální série perfektních řešení
  bestStreak: number;
  daily: { last: string; streak: number; total: number };
  endless: { total: number };
}

// Kaskáda rozsvícení: delays[i] v ms (-1 = bez animace), entries[i] = strana vstupu světla
export interface Ignite {
  gen: number;
  delays: number[];
  entries: number[];
}

export interface LastWin {
  stars: number;
  newRecord: boolean;
  bestMoves: number | null; // null = režim bez rekordů (denní / nekonečná)
  hintGained: boolean;
  hintGainedDaily: boolean; // odměna za denní výzvu (jiný text v overlayi)
  hintUsed: boolean;
  achievements: AchievementDef[];
}

const STORAGE_KEY = 'jadro-progress';

const EMPTY_PROGRESS: Progress = {
  unlocked: 1,
  completed: [],
  best: {},
  hints: 0,
  hintsEarned: [],
  achievements: [],
  streak: 0,
  bestStreak: 0,
  daily: { last: '', streak: 0, total: 0 },
  endless: { total: 0 },
};

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
        const nums = (value: unknown): number[] =>
          Array.isArray(value) ? value.filter((x): x is number => typeof x === 'number') : [];
        const daily = parsed.daily;
        const endless = parsed.endless;
        return {
          unlocked: Math.min(Math.max(Math.floor(parsed.unlocked), 1), LEVEL_COUNT),
          completed: nums(parsed.completed),
          best,
          hints: typeof parsed.hints === 'number' ? Math.max(0, parsed.hints) : 0,
          hintsEarned: nums(parsed.hintsEarned),
          achievements: Array.isArray(parsed.achievements)
            ? parsed.achievements.filter((x): x is string => typeof x === 'string')
            : [],
          streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
          bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : 0,
          daily:
            daily &&
            typeof daily.last === 'string' &&
            typeof daily.streak === 'number' &&
            typeof daily.total === 'number'
              ? { last: daily.last, streak: daily.streak, total: daily.total }
              : { last: '', streak: 0, total: 0 },
          endless:
            endless && typeof endless.total === 'number'
              ? { total: endless.total }
              : { total: 0 },
        };
      }
    }
  } catch {
    // localStorage nedostupný — hrajeme bez ukládání
  }
  return memoryProgress ?? EMPTY_PROGRESS;
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

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dailyConfig(date: Date): LevelConfig {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return {
    id: 0,
    seed,
    width: 7,
    height: 7,
    wrap: true,
    coreCount: 2,
    lockedCount: 3,
  };
}

function endlessConfig(): LevelConfig {
  // Náhodný seed smí vzniknout jen tady v UI vrstvě — engine je pro daný seed deterministický
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  const size = 5 + (seed % 3); // 5–7
  return {
    id: 0,
    seed,
    width: size,
    height: size,
    wrap: (seed & 4) !== 0,
    coreCount: ([1, 2, 3] as const)[seed % 3],
    lockedCount: seed % 4,
  };
}

export function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [mode, setMode] = useState<Mode>({ kind: 'level', id: 1 });
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [game, setGame] = useState<GameState | null>(null);
  const [rotations, setRotations] = useState<number[]>([]);
  const [ignite, setIgnite] = useState<Ignite>({ gen: 0, delays: [], entries: [] });
  const [lastWin, setLastWin] = useState<LastWin | null>(null);
  const [hintMode, setHintMode] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [helpSection, setHelpSection] = useState<HelpSection | null>(null);
  const [showHelp, setShowHelp] = useState(false);
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

  // Odemykací odkaz pro testování: …/#unlock-all odemkne všechny levely
  useEffect(() => {
    if (window.location.hash === '#unlock-all') {
      setProgress((prev) => {
        const updated: Progress = {
          ...prev,
          unlocked: LEVEL_COUNT,
          hints: Math.max(prev.hints, 10),
        };
        saveProgress(updated);
        return updated;
      });
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

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

  const startConfig = (config: LevelConfig, nextMode: Mode): void => {
    clearWaveTimer();
    const state = generateLevel(config);
    const flow = computeFlow(state.tiles, state.config);
    setMode(nextMode);
    setGame(state);
    setRotations(new Array(state.tiles.length).fill(0));
    // úvodní kaskáda: světlo se rozlije z jader do už propojených dlaždic
    setIgnite((prev) => ({
      gen: prev.gen + 1,
      delays: flow.dists.map((d) => (d >= 0 ? d * 70 : -1)),
      entries: flow.entryDirs,
    }));
    setLastWin(null);
    setHintMode(false);
    setHintUsed(false);
    setFailed(false);
    setScreen('game');
  };

  const startLevel = (id: number): void =>
    startConfig(LEVELS[id - 1], { kind: 'level', id });
  const startDaily = (): void => startConfig(dailyConfig(new Date()), { kind: 'daily' });
  const startEndless = (): void => startConfig(endlessConfig(), { kind: 'endless' });
  const restart = (): void => {
    if (game !== null) startConfig(game.config, mode);
  };

  const goMenu = (): void => {
    clearWaveTimer();
    setGame(null);
    setScreen('menu');
  };

  const handleWin = (next: GameState, usedHint: boolean, base: Progress): void => {
    const rawStars = starsFor(next.moves, next.par);
    const stars = usedHint ? Math.min(rawStars, 2) : rawStars;

    let updated: Progress;
    let newRecord = false;
    let bestMoves: number | null = null;
    let hintGained = false;

    if (mode.kind === 'level') {
      const id = mode.id;
      const prevBest = base.best[id];
      newRecord = prevBest === undefined || next.moves < prevBest.moves;
      bestMoves = newRecord ? next.moves : prevBest.moves;
      hintGained = stars === 3 && !base.hintsEarned.includes(id);
      const streak = stars === 3 ? base.streak + 1 : 0;
      updated = {
        ...base,
        unlocked: Math.max(base.unlocked, Math.min(id + 1, LEVEL_COUNT)),
        completed: base.completed.includes(id)
          ? base.completed
          : [...base.completed, id],
        best: {
          ...base.best,
          [id]: { moves: bestMoves, stars: Math.max(stars, prevBest?.stars ?? 0) },
        },
        hints: base.hints + (hintGained ? 1 : 0),
        hintsEarned: hintGained ? [...base.hintsEarned, id] : base.hintsEarned,
        streak,
        bestStreak: Math.max(base.bestStreak, streak),
      };
    } else if (mode.kind === 'daily') {
      const today = isoDate(new Date());
      const yesterday = isoDate(new Date(Date.now() - 86400000));
      const already = base.daily.last === today;
      hintGained = !already;
      updated = {
        ...base,
        hints: base.hints + (hintGained ? 1 : 0),
        daily: {
          last: today,
          streak: already
            ? base.daily.streak
            : base.daily.last === yesterday
              ? base.daily.streak + 1
              : 1,
          total: base.daily.total + (already ? 0 : 1),
        },
      };
    } else {
      updated = { ...base, endless: { total: base.endless.total + 1 } };
    }

    const unlockedAchievements = newlyUnlocked(updated, updated.achievements, LEVELS);
    if (unlockedAchievements.length > 0) {
      updated = {
        ...updated,
        achievements: [
          ...updated.achievements,
          ...unlockedAchievements.map((a) => a.id),
        ],
        hints: updated.hints + unlockedAchievements.reduce((s, a) => s + a.reward, 0),
      };
    }

    setProgress(updated);
    saveProgress(updated);
    setLastWin({
      stars,
      newRecord,
      bestMoves,
      hintGained: mode.kind === 'level' && hintGained,
      hintGainedDaily: mode.kind === 'daily' && hintGained,
      hintUsed: usedHint,
      achievements: unlockedAchievements,
    });
  };

  const applyBoardResult = (
    next: GameState,
    prevPowered: boolean[],
    usedHint: boolean,
    baseProgress: Progress,
  ): void => {
    const flow = computeFlow(next.tiles, next.config);
    setGame(next);

    // nově napájené dlaždice: světlo do nich vteče kaskádou od místa připojení
    const fresh = flow.powered.map((p, i) => p && !prevPowered[i]);
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

    if (next.won) {
      handleWin(next, usedHint, baseProgress);
      const maxDist = flow.dists.reduce((m, d) => Math.max(m, d), 0);
      clearWaveTimer();
      waveTimer.current = window.setTimeout(() => {
        setScreen('victory');
      }, maxDist * 40 + 600);
    } else if (next.moveLimit !== null && next.moves >= next.moveLimit) {
      setFailed(true);
    }
  };

  const applyHint = (index: number): void => {
    if (!game || game.won || failed) return;
    const tile = game.tiles[index];
    setHintMode(false);
    if (tile.locked) return;

    const alreadyCorrect = tile.mask === tile.solutionMask;
    if (!alreadyCorrect && progress.hints < 1) return;

    const tiles = game.tiles.slice();
    tiles[index] = { ...tile, mask: tile.solutionMask, locked: true };
    const flow = computeFlow(tiles, game.config);
    const won = flow.powered.every(Boolean);
    const next: GameState = { ...game, tiles, powered: flow.powered, won };

    let baseProgress = progress;
    if (!alreadyCorrect) {
      setHintUsed(true);
      baseProgress = { ...progress, hints: progress.hints - 1 };
      setProgress(baseProgress);
      saveProgress(baseProgress);
    }
    applyBoardResult(next, game.powered, hintUsed || !alreadyCorrect, baseProgress);
  };

  const handleTileClick = (index: number): void => {
    if (!game || game.won || failed) return;
    if (hintMode) {
      applyHint(index);
      return;
    }
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
    setRotations((prev) => {
      const copy = prev.slice();
      copy[index] += 1;
      return copy;
    });
    applyBoardResult(next, game.powered, hintUsed, progress);
  };

  const openHelp = (section: HelpSection | null): void => {
    setHelpSection(section);
    setShowHelp(true);
  };

  let content;
  if (screen === 'menu' || game === null) {
    content = (
      <Menu
        progress={progress}
        onSelect={startLevel}
        onDaily={startDaily}
        onEndless={startEndless}
        onHelp={openHelp}
      />
    );
  } else {
    const title =
      mode.kind === 'level'
        ? i18n.t('level', { n: mode.id })
        : mode.kind === 'daily'
          ? i18n.t('dailyTitle')
          : i18n.t('endlessTitle');
    const onNext =
      mode.kind === 'level'
        ? mode.id < LEVEL_COUNT
          ? () => startLevel(mode.id + 1)
          : null
        : mode.kind === 'endless'
          ? () => startEndless()
          : null;
    content = (
      <div className="game-screen">
        <HUD
          title={title}
          moves={game.moves}
          par={game.par}
          moveLimit={game.moveLimit}
          hints={progress.hints}
          hintMode={hintMode}
          onHintToggle={() => setHintMode((h) => !h)}
          onHelp={() => openHelp('goal')}
          onReset={restart}
          onMenu={goMenu}
        />
        <Board
          game={game}
          rotations={rotations}
          ignite={ignite}
          hintMode={hintMode}
          hints={progress.hints}
          failed={failed}
          showOverlay={screen === 'victory'}
          lastWin={lastWin}
          onTileClick={handleTileClick}
          onNext={onNext}
          onRetry={restart}
          onMenu={goMenu}
        />
      </div>
    );
  }

  return (
    <I18nContext.Provider value={i18n}>
      {content}
      {showHelp && <Help highlight={helpSection} onClose={() => setShowHelp(false)} />}
    </I18nContext.Provider>
  );
}
