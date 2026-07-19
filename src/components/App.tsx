import { useEffect, useMemo, useRef, useState } from 'react';
import { generateLevel, rotateCw } from '../engine/generator';
import { applyMelt, checkWin, computeFlow } from '../engine/solver';
import type { GameState, LevelConfig, Tile } from '../engine/types';
import { detectLang, I18nContext, makeT, persistLang, type Lang } from '../i18n/i18n';
import { LEVELS, LEVEL_COUNT, PACKS, type PackId } from '../levels/levels';
import { newlyUnlocked, type AchievementDef } from '../meta/achievements';
import { isSoundEnabled, setSoundEnabled, sfx } from '../sound';
import { Board } from './Board';
import { Help, type HelpSection } from './Help';
import { HUD } from './HUD';
import { Menu } from './Menu';

type Screen = 'menu' | 'game' | 'victory';

export type Mode =
  | { kind: 'level'; id: number }
  | { kind: 'pack'; packId: PackId; index: number } // index 1-based v balíčku
  | { kind: 'daily' }
  | { kind: 'endless' }
  | { kind: 'blackout' }
  | { kind: 'rush' };

export interface RushState {
  score: number;
  timeLeft: number; // sekundy
}

export interface RushOver {
  score: number;
  best: number;
  newBest: boolean;
  achievements: AchievementDef[];
}

const RUSH_START_SECONDS = 90;
const RUSH_BONUS_SECONDS = 20;

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
  blackout: { total: number };
  rush: { best: number };
  packs: Record<string, number>; // odemčený index v každém balíčku výzev (1+)
  allUnlocked: boolean; // testovací odemčení (#unlock-all) — platí i pro nové levely
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
  blackout: { total: 0 },
  rush: { best: 0 },
  packs: {},
  allUnlocked: false,
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
        const allUnlocked = parsed.allUnlocked === true;
        return {
          unlocked: allUnlocked
            ? LEVEL_COUNT
            : Math.min(Math.max(Math.floor(parsed.unlocked), 1), LEVEL_COUNT),
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
          blackout:
            parsed.blackout && typeof parsed.blackout.total === 'number'
              ? { total: parsed.blackout.total }
              : { total: 0 },
          rush:
            parsed.rush && typeof parsed.rush.best === 'number'
              ? { best: parsed.rush.best }
              : { best: 0 },
          packs:
            parsed.packs && typeof parsed.packs === 'object'
              ? Object.fromEntries(
                  Object.entries(parsed.packs).filter(
                    ([, v]) => typeof v === 'number',
                  ),
                )
              : {},
          allUnlocked,
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

// Náhodné seedy smí vznikat jen tady v UI vrstvě — engine je pro daný seed deterministický
function randomSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function endlessConfig(): LevelConfig {
  const seed = randomSeed();
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

function blackoutConfig(): LevelConfig {
  const seed = randomSeed();
  const size = 5 + (seed % 2); // 5–6, po paměti je to tak akorát
  return {
    id: 0,
    seed,
    width: size,
    height: size,
    wrap: (seed & 2) !== 0,
    coreCount: 1,
    lockedCount: 0,
  };
}

function rushConfig(solved: number): LevelConfig {
  const seed = randomSeed();
  const size = 4 + Math.min(3, Math.floor(solved / 4)); // 4×4 → 7×7
  return {
    id: 0,
    seed,
    width: size,
    height: size,
    wrap: solved >= 6 && (seed & 1) !== 0,
    coreCount: 1,
    lockedCount: 0,
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
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled);
  const [rush, setRush] = useState<RushState>({ score: 0, timeLeft: RUSH_START_SECONDS });
  const [rushOver, setRushOver] = useState<RushOver | null>(null);
  const [lang, setLangState] = useState<Lang>(detectLang);
  const waveTimer = useRef<number | null>(null);
  const menuScroll = useRef(0); // pozice scrollu menu pro návrat zpět

  // návrat do menu obnoví původní pozici scrollu
  useEffect(() => {
    if (screen === 'menu') {
      window.scrollTo(0, menuScroll.current);
    }
  }, [screen]);

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

  // Odemykací odkaz pro testování: …/#unlock-all odemkne trvale všechny
  // levely (včetně později přidaných sektorů)
  useEffect(() => {
    if (window.location.hash === '#unlock-all') {
      setProgress((prev) => {
        const updated: Progress = {
          ...prev,
          unlocked: LEVEL_COUNT,
          allUnlocked: true,
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
    if (screen === 'menu') menuScroll.current = window.scrollY;
    window.scrollTo(0, 0);
    let state = generateLevel(config);
    // led sousedící s energií své barvy může roztát hned na startu
    const melted = applyMelt(state.tiles, state.config);
    if (melted !== null) state = { ...state, tiles: melted };
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
  const startPack = (packId: PackId, index: number): void => {
    const pack = PACKS.find((p) => p.id === packId);
    if (pack === undefined || index < 1 || index > pack.levels.length) return;
    startConfig(pack.levels[index - 1], { kind: 'pack', packId, index });
  };
  const startDaily = (): void => startConfig(dailyConfig(new Date()), { kind: 'daily' });
  const startEndless = (): void => startConfig(endlessConfig(), { kind: 'endless' });
  const startBlackout = (): void => startConfig(blackoutConfig(), { kind: 'blackout' });
  const startRush = (): void => {
    setRush({ score: 0, timeLeft: RUSH_START_SECONDS });
    setRushOver(null);
    startConfig(rushConfig(0), { kind: 'rush' });
  };
  const restart = (): void => {
    if (game !== null) startConfig(game.config, mode);
  };

  const goMenu = (): void => {
    clearWaveTimer();
    setGame(null);
    setRushOver(null);
    setScreen('menu');
  };

  const toggleSound = (): void => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const endRush = (finalScore: number): void => {
    clearWaveTimer();
    const newBest = finalScore > progress.rush.best;
    let updated: Progress = {
      ...progress,
      rush: { best: Math.max(progress.rush.best, finalScore) },
    };
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
    setRushOver({
      score: finalScore,
      best: updated.rush.best,
      newBest,
      achievements: unlockedAchievements,
    });
    sfx.fail();
  };

  // Odpočet Bleskové hry
  useEffect(() => {
    if (mode.kind !== 'rush' || game === null || rushOver !== null || screen === 'menu') {
      return;
    }
    const interval = window.setInterval(() => {
      setRush((prev) => ({ ...prev, timeLeft: Math.max(0, prev.timeLeft - 0.25) }));
    }, 250);
    return () => window.clearInterval(interval);
  }, [mode.kind, game, rushOver, screen]);

  useEffect(() => {
    if (mode.kind === 'rush' && rush.timeLeft <= 0 && rushOver === null && game !== null) {
      endRush(rush.score);
    }
    // endRush je stabilní v rámci renderu; závislosti pokrývají spouštěcí stav
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rush.timeLeft, mode.kind, rushOver, game]);

  const handleWin = (next: GameState, usedHint: boolean, base: Progress): void => {
    const rawStars = starsFor(next.moves, next.par);
    const stars = usedHint ? Math.min(rawStars, 2) : rawStars;

    let updated: Progress;
    let newRecord = false;
    let bestMoves: number | null = null;
    let hintGained = false;

    if (mode.kind === 'level' || mode.kind === 'pack') {
      // kampaň i balíčky výzev sdílejí postup přes unikátní id levelu
      const id = mode.kind === 'level' ? mode.id : next.config.id;
      const prevBest = base.best[id];
      newRecord = prevBest === undefined || next.moves < prevBest.moves;
      bestMoves = newRecord ? next.moves : prevBest.moves;
      hintGained = stars === 3 && !base.hintsEarned.includes(id);
      const streak = stars === 3 ? base.streak + 1 : 0;
      updated = {
        ...base,
        unlocked:
          mode.kind === 'level'
            ? Math.max(base.unlocked, Math.min(mode.id + 1, LEVEL_COUNT))
            : base.unlocked,
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
        packs:
          mode.kind === 'pack'
            ? {
                ...base.packs,
                [mode.packId]: Math.max(
                  base.packs[mode.packId] ?? 1,
                  Math.min(
                    mode.index + 1,
                    PACKS.find((p) => p.id === mode.packId)?.levels.length ?? 1,
                  ),
                ),
              }
            : base.packs,
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
    } else if (mode.kind === 'blackout') {
      updated = { ...base, blackout: { total: base.blackout.total + 1 } };
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
      window.setTimeout(() => sfx.achievement(), 800);
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
    tilesNext: Tile[],
    movesNext: number,
    prevPowered: boolean[],
    usedHint: boolean,
    baseProgress: Progress,
  ): void => {
    if (game === null) return;
    let tiles = tilesNext;
    const melted = applyMelt(tiles, game.config);
    if (melted !== null) {
      tiles = melted;
      sfx.melt();
    }
    const flow = computeFlow(tiles, game.config);
    const won = checkWin(tiles, game.config);
    const next: GameState = {
      ...game,
      tiles,
      moves: movesNext,
      powered: flow.powered,
      won,
    };
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
      sfx.win();
      const maxDist = flow.dists.reduce((m, d) => Math.max(m, d), 0);
      clearWaveTimer();
      if (mode.kind === 'rush') {
        // Blesková hra: bonusový čas a rovnou další pole, bez overlaye
        const newScore = rush.score + 1;
        setRush((prev) => ({
          score: newScore,
          timeLeft: prev.timeLeft + RUSH_BONUS_SECONDS,
        }));
        waveTimer.current = window.setTimeout(() => {
          startConfig(rushConfig(newScore), { kind: 'rush' });
        }, maxDist * 40 + 500);
      } else {
        handleWin(next, usedHint, baseProgress);
        waveTimer.current = window.setTimeout(() => {
          setScreen('victory');
        }, maxDist * 40 + 600);
      }
    } else {
      if (anyFresh) {
        sfx.connect(fresh.filter(Boolean).length);
      }
      if (next.moveLimit !== null && next.moves >= next.moveLimit) {
        setFailed(true);
        sfx.fail();
      }
    }
  };

  const applyHint = (index: number): void => {
    if (!game || game.won || failed || rushOver !== null) return;
    const tile = game.tiles[index];
    setHintMode(false);
    if (tile.locked || tile.frozen === true) return;

    const alreadyCorrect = tile.mask === tile.solutionMask;
    if (!alreadyCorrect && progress.hints < 1) return;
    sfx.hint();

    const tiles = game.tiles.slice();
    tiles[index] = { ...tile, mask: tile.solutionMask, locked: true };

    let baseProgress = progress;
    if (!alreadyCorrect) {
      setHintUsed(true);
      baseProgress = { ...progress, hints: progress.hints - 1 };
      setProgress(baseProgress);
      saveProgress(baseProgress);
    }
    applyBoardResult(
      tiles,
      game.moves,
      game.powered,
      hintUsed || !alreadyCorrect,
      baseProgress,
    );
  };

  const handleTileClick = (index: number): void => {
    if (!game || game.won || failed || rushOver !== null) return;
    if (hintMode) {
      applyHint(index);
      return;
    }
    const tile = game.tiles[index];
    if (tile.locked || tile.frozen === true) return;
    sfx.rotate();

    const tiles = game.tiles.slice();
    tiles[index] = { ...tile, mask: rotateCw(tile.mask) };
    setRotations((prev) => {
      const copy = prev.slice();
      copy[index] += 1;
      return copy;
    });
    applyBoardResult(tiles, game.moves + 1, game.powered, hintUsed, progress);
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
        onSelectPack={startPack}
        onDaily={startDaily}
        onEndless={startEndless}
        onBlackout={startBlackout}
        onRush={startRush}
        onHelp={openHelp}
        soundOn={soundOn}
        onSoundToggle={toggleSound}
      />
    );
  } else {
    const packNameKey =
      mode.kind === 'pack'
        ? ({
            colors: 'packColors',
            maze: 'packMaze',
            ice: 'packIce',
            portals: 'packPortals',
          } as const)[mode.packId]
        : null;
    const title =
      mode.kind === 'level'
        ? i18n.t('level', { n: mode.id })
        : mode.kind === 'pack' && packNameKey !== null
          ? `${i18n.t(packNameKey)} ${mode.index}`
          : mode.kind === 'daily'
            ? i18n.t('dailyTitle')
            : mode.kind === 'blackout'
              ? i18n.t('blackoutTitle')
              : mode.kind === 'rush'
                ? i18n.t('rushTitle')
                : i18n.t('endlessTitle');
    const packLen =
      mode.kind === 'pack'
        ? (PACKS.find((p) => p.id === mode.packId)?.levels.length ?? 0)
        : 0;
    const onNext =
      mode.kind === 'level'
        ? mode.id < LEVEL_COUNT
          ? () => startLevel(mode.id + 1)
          : null
        : mode.kind === 'pack'
          ? mode.index < packLen
            ? () => startPack(mode.packId, mode.index + 1)
            : null
          : mode.kind === 'endless'
            ? () => startEndless()
            : mode.kind === 'blackout'
              ? () => startBlackout()
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
          rush={mode.kind === 'rush' ? rush : null}
          soundOn={soundOn}
          onSoundToggle={toggleSound}
          onHintToggle={() => setHintMode((h) => !h)}
          onHelp={() => openHelp('goal')}
          onReset={mode.kind === 'rush' ? startRush : restart}
          onMenu={goMenu}
        />
        <Board
          game={game}
          rotations={rotations}
          ignite={ignite}
          hintMode={hintMode}
          hints={progress.hints}
          failed={failed}
          fog={mode.kind === 'blackout'}
          rushOver={rushOver}
          showOverlay={screen === 'victory'}
          lastWin={lastWin}
          onTileClick={handleTileClick}
          onNext={onNext}
          onRetry={restart}
          onRushRetry={startRush}
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
