import { useEffect, useMemo, useRef, useState } from 'react';
import { generateLevel, rotateCw } from '../engine/generator';
import { applyMelt, checkWin, computeFlow } from '../engine/solver';
import type { GameState, LevelConfig, Tile } from '../engine/types';
import { detectLang, I18nContext, makeT, persistLang, type Lang } from '../i18n/i18n';
import { CHAPTER_SIZE, LEVELS, LEVEL_COUNT, PACKS, type PackId } from '../levels/levels';
import { newlyUnlocked, totalStars, type AchievementDef } from '../meta/achievements';
import { collectibleForLevel, COLLECTION_SETS, setItems } from '../meta/collection';
import { EVENT_REWARD_HINTS, isWeekend, weekendEvent } from '../meta/events';
import { unseenMechanics, type MechanicId } from '../meta/mechanics';
import { currentRank, type RankDef } from '../meta/ranks';
import { loadTheme, persistTheme, THEMES } from '../meta/themes';
import { dailyShareText, rushShareText, shareText } from '../share';
import { isSoundEnabled, setSoundEnabled, sfx } from '../sound';
import { haptic, isHapticsEnabled, setHapticsEnabled } from '../haptics';
import { loadReducedMotion, persistReducedMotion } from '../motion';
import { BackContext, useBackLayerWith, useBackStack } from './backstack';
import { Board } from './Board';
import { Help, type HelpSection } from './Help';
import { HUD } from './HUD';
import { Intro } from './Intro';
import { MapView } from './MapView';
import { MechanicIntro } from './MechanicIntro';
import { Menu } from './Menu';
import { SectorClear } from './SectorClear';

type Screen = 'menu' | 'game' | 'victory' | 'sector' | 'journey';

export type Mode =
  | { kind: 'level'; id: number }
  | { kind: 'pack'; packId: PackId; index: number } // index 1-based v balíčku
  | { kind: 'daily' }
  | { kind: 'dailyReplay'; date: string } // přehrání staršího dne z kalendáře (trénink)
  | { kind: 'endless' }
  | { kind: 'blackout' }
  | { kind: 'rush' }
  | { kind: 'event'; index: number }; // 1–3 v rámci víkendového eventu

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
const UNDO_PER_LEVEL = 3; // kolikrát lze vzít tah zpět v jednom poli

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
  daily: { last: string; streak: number; total: number; dates: string[] };
  endless: { total: number };
  blackout: { total: number };
  rush: { best: number };
  packs: Record<string, number>; // odemčený index v každém balíčku výzev (1+)
  freezes: number; // zmrazení denní série
  collection: number[]; // vlastněné součástky alba (0–11)
  setsClaimed: number[]; // vyzvednuté odměny za sady
  eventsDone: number; // počet dokončených víkendových eventů
  event: { week: string; done: number[]; claimed: boolean };
  allUnlocked: boolean; // testovací odemčení (#unlock-all) — platí i pro nové levely
  tutorialDone: boolean; // úvodní tutoriál na 1. levelu dokončen
  seenIntros: string[]; // mechaniky, které už hráč dostal vysvětlené
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
  hintUsed: boolean;
  achievements: AchievementDef[];
  dailyReward: number; // nápovědy za denní výzvu (eskalace dle série)
  dailyStreak: number;
  freezeSaved: boolean; // zmrazení zachránilo sérii
  fragment: { id: number; isNew: boolean } | null; // součástka do alba
  setCompleted: number | null; // dokončená sada alba
  rankUp: RankDef | null; // povýšení hodnosti
  eventDone: boolean; // dokončen celý víkendový event
  shareable: boolean; // zobrazit tlačítko sdílení
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
  daily: { last: '', streak: 0, total: 0, dates: [] },
  endless: { total: 0 },
  blackout: { total: 0 },
  rush: { best: 0 },
  packs: {},
  freezes: 0,
  collection: [],
  setsClaimed: [],
  eventsDone: 0,
  event: { week: '', done: [], claimed: false },
  allUnlocked: false,
  tutorialDone: false,
  seenIntros: [],
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
              ? {
                  last: daily.last,
                  streak: daily.streak,
                  total: daily.total,
                  dates: Array.isArray(daily.dates)
                    ? daily.dates.filter((x): x is string => typeof x === 'string')
                    : [],
                }
              : { last: '', streak: 0, total: 0, dates: [] },
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
          freezes: typeof parsed.freezes === 'number' ? Math.max(0, parsed.freezes) : 0,
          collection: nums(parsed.collection),
          setsClaimed: nums(parsed.setsClaimed),
          eventsDone: typeof parsed.eventsDone === 'number' ? parsed.eventsDone : 0,
          event:
            parsed.event &&
            typeof parsed.event.week === 'string' &&
            Array.isArray(parsed.event.done)
              ? {
                  week: parsed.event.week,
                  done: nums(parsed.event.done),
                  claimed: parsed.event.claimed === true,
                }
              : { week: '', done: [], claimed: false },
          allUnlocked,
          tutorialDone: parsed.tutorialDone === true,
          seenIntros: Array.isArray(parsed.seenIntros)
            ? parsed.seenIntros.filter((x): x is string => typeof x === 'string')
            : [],
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

function dateFromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
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
  const [hapticsOn, setHapticsOn] = useState<boolean>(isHapticsEnabled);
  const [reducedMotion, setReducedMotion] = useState<boolean>(loadReducedMotion);
  const [tutorialStep, setTutorialStep] = useState(0); // 0 = otoč dlaždici, 1 = propoj vše
  const [theme, setTheme] = useState<string>(loadTheme);
  const [shareToast, setShareToast] = useState(false);
  const [exitToast, setExitToast] = useState(false);
  const [pendingIntro, setPendingIntro] = useState<{
    ids: MechanicId[];
    run: () => void;
  } | null>(null);
  const exitAt = useRef(0);
  const [rush, setRush] = useState<RushState>({ score: 0, timeLeft: RUSH_START_SECONDS });
  const [rushOver, setRushOver] = useState<RushOver | null>(null);
  const [lang, setLangState] = useState<Lang>(detectLang);
  const [showIntro, setShowIntro] = useState(() => {
    // intro jednou za spuštění (relaci) — reload stránky ho už neopakuje
    try {
      return window.sessionStorage.getItem('jadro-intro') !== '1';
    } catch {
      return true;
    }
  });
  const [sectorNum, setSectorNum] = useState(1); // číslo dokončeného sektoru pro oslavu
  const sectorClearRef = useRef<number | null>(null);
  const waveTimer = useRef<number | null>(null);
  const menuScroll = useRef(0); // pozice scrollu menu pro návrat zpět
  // historie tahů pro krok zpět: snapshoty stavu před posledními tahy
  const undoStack = useRef<{ tiles: Tile[]; moves: number; rotations: number[] }[]>([]);
  const [undosLeft, setUndosLeft] = useState(UNDO_PER_LEVEL);

  // Hardwarové tlačítko Zpět: zavírá vrstvy, na hlavní obrazovce se ptá
  // podruhé (jinak by gesto zpět rovnou ukončilo hru).
  const backApi = useBackStack({
    onExitAttempt: () => {
      const now = Date.now();
      if (now - exitAt.current < 2500) return false; // druhé stisknutí → ven
      exitAt.current = now;
      setExitToast(true);
      window.setTimeout(() => setExitToast(false), 2200);
      return true;
    },
  });

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

  useEffect(() => {
    try {
      window.sessionStorage.setItem('jadro-intro', '1');
    } catch {
      // sessionStorage nedostupný — intro se ukáže i po reloadu
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';
  }, [reducedMotion]);

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
    undoStack.current = [];
    setUndosLeft(UNDO_PER_LEVEL);
    setTutorialStep(0);
    setScreen('game');
  };

  // Před levelem s dosud nevysvětlenou mechanikou ukážeme krátký tutoriál.
  const gateIntro = (config: LevelConfig, run: () => void): void => {
    const ids = unseenMechanics(config, progress.seenIntros);
    if (ids.length === 0) {
      run();
      return;
    }
    setPendingIntro({ ids, run });
  };

  const startLevel = (id: number): void => {
    const config = LEVELS[id - 1];
    gateIntro(config, () => startConfig(config, { kind: 'level', id }));
  };
  const startPack = (packId: PackId, index: number): void => {
    const pack = PACKS.find((p) => p.id === packId);
    if (pack === undefined || index < 1 || index > pack.levels.length) return;
    const config = pack.levels[index - 1];
    gateIntro(config, () => startConfig(config, { kind: 'pack', packId, index }));
  };

  const confirmIntro = (): void => {
    if (pendingIntro === null) return;
    const updated: Progress = {
      ...progress,
      seenIntros: [...progress.seenIntros, ...pendingIntro.ids],
    };
    setProgress(updated);
    saveProgress(updated);
    const { run } = pendingIntro;
    setPendingIntro(null);
    run();
  };
  const startDaily = (): void => startConfig(dailyConfig(new Date()), { kind: 'daily' });
  // přehrání staršího dne (trénink) — bez odměn, jen puzzle daného data
  const startDailyReplay = (date: string): void =>
    startConfig(dailyConfig(dateFromIso(date)), { kind: 'dailyReplay', date });
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

  // po oslavě sektoru: nejdřív cinematika posunu po mapě, pak další level
  const afterSector = (): void => {
    if (sectorNum * CHAPTER_SIZE + 1 <= LEVEL_COUNT) setScreen('journey');
    else goMenu();
  };

  // po cinematice mapy: pokračuj prvním levelem dalšího sektoru
  const continueAfterSector = (): void => {
    const nextId = sectorNum * CHAPTER_SIZE + 1;
    if (nextId <= LEVEL_COUNT) startLevel(nextId);
    else goMenu();
  };

  // krok zpět: vrátí poslední tah (i po vyčerpání limitu) z omezené zásoby
  const undo = (): void => {
    if (game === null || game.won || rushOver !== null) return;
    if (undosLeft < 1) return;
    const snap = undoStack.current.pop();
    if (snap === undefined) return;
    clearWaveTimer();
    const flow = computeFlow(snap.tiles, game.config);
    setGame({
      ...game,
      tiles: snap.tiles,
      moves: snap.moves,
      powered: flow.powered,
      won: false,
    });
    setRotations(snap.rotations);
    // bez rozsvěcovací kaskády — jen usadíme aktuální stav
    setIgnite((prev) => ({
      gen: prev.gen,
      delays: flow.dists.map(() => -1),
      entries: flow.entryDirs,
    }));
    setFailed(false);
    setHintMode(false);
    setUndosLeft((n) => n - 1);
    haptic.undo();
  };

  // šipka zpět: návrat do menu na původní pozici scrollu
  const goBack = (): void => {
    clearWaveTimer();
    setGame(null);
    setRushOver(null);
    setScreen('menu');
  };

  // Menu: návrat do menu na výchozí pozici (nahoru)
  const goMenu = (): void => {
    menuScroll.current = 0;
    goBack();
  };

  // vše mimo hlavní obrazovku je vrstva → Zpět vrací do menu, ne ven ze hry
  useBackLayerWith(backApi, screen !== 'menu', goBack);
  useBackLayerWith(backApi, showHelp, () => setShowHelp(false));

  const toggleSound = (): void => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const toggleHaptics = (): void => {
    const next = !hapticsOn;
    setHapticsOn(next);
    setHapticsEnabled(next);
    if (next) haptic.test();
  };

  const toggleMotion = (): void => {
    const next = !reducedMotion;
    setReducedMotion(next);
    persistReducedMotion(next);
  };

  const changeTheme = (id: string): void => {
    const def = THEMES.find((th) => th.id === id);
    if (def === undefined) return;
    if (currentRank(totalStars(progress)).rank < def.minRank) return;
    setTheme(id);
    persistTheme(id);
  };

  const buyFreeze = (): void => {
    const COST = 3;
    if (progress.hints < COST || progress.freezes >= 3) return;
    const updated: Progress = {
      ...progress,
      hints: progress.hints - COST,
      freezes: progress.freezes + 1,
    };
    setProgress(updated);
    saveProgress(updated);
    sfx.hint();
  };

  const startEvent = (index: number): void => {
    const event = weekendEvent(new Date());
    if (!isWeekend(new Date()) || index < 1 || index > event.levels.length) return;
    startConfig(event.levels[index - 1], { kind: 'event', index });
  };

  const handleShare = async (): Promise<void> => {
    let text: string | null = null;
    if (rushOver !== null) {
      text = rushShareText(rushOver.score, rushOver.best);
    } else if (game !== null && lastWin !== null && mode.kind === 'daily') {
      const label = new Date().toLocaleDateString(
        lang === 'cs' ? 'cs-CZ' : lang === 'de' ? 'de-DE' : 'en-GB',
      );
      text = dailyShareText(game, lastWin.stars, progress.daily.streak, label);
    }
    if (text === null) return;
    const result = await shareText(text);
    if (result.copied) {
      setShareToast(true);
      window.setTimeout(() => setShareToast(false), 2200);
    }
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
    sectorClearRef.current = null;

    let updated: Progress;
    let newRecord = false;
    let bestMoves: number | null = null;
    let hintGained = false;
    let dailyReward = 0;
    let dailyStreak = base.daily.streak;
    let freezeSaved = false;
    let fragment: { id: number; isNew: boolean } | null = null;
    let setCompleted: number | null = null;
    let eventDone = false;

    if (mode.kind === 'level' || mode.kind === 'pack') {
      // kampaň i balíčky výzev sdílejí postup přes unikátní id levelu
      const id = mode.kind === 'level' ? mode.id : next.config.id;
      const prevBest = base.best[id];
      newRecord = prevBest === undefined || next.moves < prevBest.moves;
      bestMoves = newRecord ? next.moves : prevBest.moves;
      hintGained = stars === 3 && !base.hintsEarned.includes(id);
      const streak = stars === 3 ? base.streak + 1 : 0;

      // album: fragment za první perfektní řešení; duplikát = +1 nápověda
      let collection = base.collection;
      let setsClaimed = base.setsClaimed;
      let extraHints = 0;
      if (hintGained) {
        const itemId = collectibleForLevel(id);
        if (!collection.includes(itemId)) {
          collection = [...collection, itemId];
          fragment = { id: itemId, isNew: true };
          for (const set of COLLECTION_SETS) {
            if (setsClaimed.includes(set.id)) continue;
            if (setItems(set.id).every((it) => collection.includes(it.id))) {
              setsClaimed = [...setsClaimed, set.id];
              extraHints += set.reward;
              setCompleted = set.id;
            }
          }
        } else {
          fragment = { id: itemId, isNew: false };
          extraHints += 1;
        }
      }

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
        hints: base.hints + (hintGained ? 1 : 0) + extraHints,
        hintsEarned: hintGained ? [...base.hintsEarned, id] : base.hintsEarned,
        streak,
        bestStreak: Math.max(base.bestStreak, streak),
        tutorialDone:
          mode.kind === 'level' && mode.id === 1 ? true : base.tutorialDone,
        collection,
        setsClaimed,
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

      // dokončení sektoru kampaně → velká oslava. Spustí se buď při dohrání
      // posledního levelu sektoru, nebo když se sektor právě celý zkompletuje.
      if (mode.kind === 'level') {
        const sector = Math.floor((id - 1) / CHAPTER_SIZE) + 1;
        const from = (sector - 1) * CHAPTER_SIZE + 1;
        const to = Math.min(sector * CHAPTER_SIZE, LEVEL_COUNT);
        let allDone = true;
        let baseAll = true;
        for (let lv = from; lv <= to; lv++) {
          if (!updated.completed.includes(lv)) allDone = false;
          if (!base.completed.includes(lv)) baseAll = false;
        }
        // finále sektoru (poslední level) oslavíme vždy, i při opětovném dohrání;
        // stejně tak když se sektor právě celý zkompletuje mimo pořadí
        const finishedFinale = id === to;
        if (finishedFinale || (allDone && !baseAll)) sectorClearRef.current = sector;
      }
    } else if (mode.kind === 'daily') {
      const today = isoDate(new Date());
      const yesterday = isoDate(new Date(Date.now() - 86400000));
      const dayBefore = isoDate(new Date(Date.now() - 2 * 86400000));
      const already = base.daily.last === today;
      let freezes = base.freezes;
      if (already) {
        dailyStreak = base.daily.streak;
      } else if (base.daily.last === yesterday) {
        dailyStreak = base.daily.streak + 1;
      } else if (base.daily.last === dayBefore && freezes > 0) {
        // zmrazení automaticky zachrání sérii při jednom vynechaném dni
        freezes -= 1;
        freezeSaved = true;
        dailyStreak = base.daily.streak + 1;
      } else {
        dailyStreak = 1;
      }
      // eskalující odměna podle série: 1 → až 3 nápovědy
      dailyReward = already ? 0 : Math.min(3, 1 + Math.floor(dailyStreak / 3));
      updated = {
        ...base,
        hints: base.hints + dailyReward,
        freezes,
        daily: {
          last: today,
          streak: dailyStreak,
          total: base.daily.total + (already ? 0 : 1),
          dates: already
            ? base.daily.dates
            : [...base.daily.dates.slice(-119), today],
        },
      };
    } else if (mode.kind === 'dailyReplay') {
      // trénink staršího dne — žádné odměny ani zápis postupu
      updated = base;
    } else if (mode.kind === 'event') {
      const event = weekendEvent(new Date());
      const cur =
        base.event.week === event.weekId
          ? base.event
          : { week: event.weekId, done: [], claimed: false };
      const done = cur.done.includes(mode.index)
        ? cur.done
        : [...cur.done, mode.index];
      let claimed = cur.claimed;
      let hintsAdd = 0;
      let eventsDone = base.eventsDone;
      if (!claimed && done.length >= event.levels.length) {
        claimed = true;
        eventDone = true;
        hintsAdd = EVENT_REWARD_HINTS;
        eventsDone += 1;
      }
      updated = {
        ...base,
        hints: base.hints + hintsAdd,
        event: { week: event.weekId, done, claimed },
        eventsDone,
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

    // povýšení hodnosti = bonusové nápovědy
    let rankUp: RankDef | null = null;
    const rankAfter = currentRank(totalStars(updated));
    if (rankAfter.rank > currentRank(totalStars(base)).rank) {
      rankUp = rankAfter;
      updated = { ...updated, hints: updated.hints + 2 };
    }

    setProgress(updated);
    saveProgress(updated);
    setLastWin({
      stars,
      newRecord,
      bestMoves,
      hintGained: (mode.kind === 'level' || mode.kind === 'pack') && hintGained,
      hintUsed: usedHint,
      achievements: unlockedAchievements,
      dailyReward,
      dailyStreak,
      freezeSaved,
      fragment,
      setCompleted,
      rankUp,
      eventDone,
      shareable: mode.kind === 'daily',
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
      haptic.melt();
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
      haptic.win();
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
        const cleared = sectorClearRef.current;
        waveTimer.current = window.setTimeout(() => {
          if (cleared !== null) {
            setSectorNum(cleared);
            setScreen('sector');
          } else {
            setScreen('victory');
          }
        }, maxDist * 40 + 600);
      }
    } else {
      if (anyFresh) {
        sfx.connect(fresh.filter(Boolean).length);
        haptic.connect();
      }
      if (next.moveLimit !== null && next.moves >= next.moveLimit) {
        setFailed(true);
        sfx.fail();
        haptic.fail();
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

    // nápovědu nelze vrátit krokem zpět — jinak by se zaplacená nápověda
    // ztratila (undo by obnovil stav před ní)
    undoStack.current = [];

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
    haptic.rotate();

    // uložíme stav před tahem pro krok zpět (omezená hloubka)
    undoStack.current.push({ tiles: game.tiles, moves: game.moves, rotations });
    if (undoStack.current.length > UNDO_PER_LEVEL) undoStack.current.shift();
    if (tutorialStep === 0) setTutorialStep(1);

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
  if (screen === 'sector') {
    const secFrom = (sectorNum - 1) * CHAPTER_SIZE + 1;
    const secTo = Math.min(sectorNum * CHAPTER_SIZE, LEVEL_COUNT);
    let secStars = 0;
    for (let lv = secFrom; lv <= secTo; lv++) {
      secStars += progress.best[lv]?.stars ?? 0;
    }
    content = (
      <SectorClear
        sector={sectorNum}
        stars={secStars}
        maxStars={(secTo - secFrom + 1) * 3}
        reducedMotion={reducedMotion}
        hasNext={sectorNum * CHAPTER_SIZE + 1 <= LEVEL_COUNT}
        onContinue={afterSector}
        onMenu={goMenu}
      />
    );
  } else if (screen === 'journey') {
    content = (
      <MapView
        progress={progress}
        onSelect={startLevel}
        onClose={goMenu}
        journey={{
          from: sectorNum,
          to: sectorNum + 1,
          onContinue: continueAfterSector,
        }}
        reducedMotion={reducedMotion}
      />
    );
  } else if (screen === 'menu' || game === null) {
    content = (
      <Menu
        progress={progress}
        theme={theme}
        onSelect={startLevel}
        onSelectPack={startPack}
        onDaily={startDaily}
        onReplayDay={startDailyReplay}
        onEndless={startEndless}
        onBlackout={startBlackout}
        onRush={startRush}
        onEvent={startEvent}
        onBuyFreeze={buyFreeze}
        onSetTheme={changeTheme}
        onHelp={openHelp}
        soundOn={soundOn}
        onSoundToggle={toggleSound}
        hapticsOn={hapticsOn}
        onHapticsToggle={toggleHaptics}
        reducedMotion={reducedMotion}
        onMotionToggle={toggleMotion}
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
                : mode.kind === 'event'
                  ? `${i18n.t('eventTitle')} ${mode.index}/3`
                  : mode.kind === 'dailyReplay'
                    ? i18n.t('dailyReplayTitle', {
                        d: dateFromIso(mode.date).toLocaleDateString(
                          lang === 'cs' ? 'cs-CZ' : lang === 'de' ? 'de-DE' : 'en-GB',
                          { day: 'numeric', month: 'numeric' },
                        ),
                      })
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
          : mode.kind === 'event'
            ? mode.index < 3
              ? () => startEvent(mode.index + 1)
              : null
            : mode.kind === 'endless'
              ? () => startEndless()
              : mode.kind === 'blackout'
                ? () => startBlackout()
                : null;
    const showTutorial =
      mode.kind === 'level' &&
      mode.id === 1 &&
      !progress.tutorialDone &&
      !game.won &&
      !failed;
    const tutorialTarget =
      showTutorial && tutorialStep === 0
        ? game.tiles.findIndex(
            (tl) =>
              !tl.locked &&
              tl.isCore !== true &&
              tl.frozen !== true &&
              tl.mask !== tl.solutionMask,
          )
        : -1;
    const tutorial = showTutorial
      ? {
          index: tutorialTarget,
          text: tutorialStep === 0 ? i18n.t('tutorialTap') : i18n.t('tutorialConnect'),
        }
      : null;
    // v Bleskové hře krok zpět nedává smysl (žádný limit tahů) a kazil by režim
    const canUndo =
      mode.kind !== 'rush' &&
      undosLeft > 0 &&
      undoStack.current.length > 0 &&
      !game.won &&
      rushOver === null;
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
          canUndo={canUndo}
          undosLeft={undosLeft}
          onUndo={undo}
          onSoundToggle={toggleSound}
          onHintToggle={() => setHintMode((h) => !h)}
          onHelp={() => openHelp('goal')}
          onReset={mode.kind === 'rush' ? startRush : restart}
          onBack={goBack}
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
          tutorial={tutorial}
          onTileClick={handleTileClick}
          onNext={onNext}
          onRetry={restart}
          onRushRetry={startRush}
          onShare={() => void handleShare()}
          onMenu={goMenu}
        />
      </div>
    );
  }

  return (
    <I18nContext.Provider value={i18n}>
      <BackContext.Provider value={backApi}>
        {content}
        {showHelp && <Help highlight={helpSection} onClose={() => setShowHelp(false)} />}
        {shareToast && <div className="toast">{i18n.t('shareCopied')}</div>}
        {exitToast && <div className="toast">{i18n.t('exitConfirm')}</div>}
        {pendingIntro !== null && (
          <MechanicIntro
            ids={pendingIntro.ids}
            onStart={confirmIntro}
            onCancel={() => setPendingIntro(null)}
          />
        )}
        {showIntro && (
          <Intro reducedMotion={reducedMotion} onDone={() => setShowIntro(false)} />
        )}
      </BackContext.Provider>
    </I18nContext.Provider>
  );
}
