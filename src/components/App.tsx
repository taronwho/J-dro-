import { useEffect, useRef, useState } from 'react';
import { generateLevel, rotateCw } from '../engine/generator';
import { computeFlow } from '../engine/solver';
import type { GameState } from '../engine/types';
import { LEVELS, LEVEL_COUNT } from '../levels/levels';
import { Board } from './Board';
import { HUD } from './HUD';
import { Menu } from './Menu';

type Screen = 'menu' | 'game' | 'victory';

interface Progress {
  unlocked: number;
  completed: number[];
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
        return {
          unlocked: Math.min(Math.max(Math.floor(parsed.unlocked), 1), LEVEL_COUNT),
          completed: parsed.completed.filter((x): x is number => typeof x === 'number'),
        };
      }
    }
  } catch {
    // localStorage nedostupný — hrajeme bez ukládání
  }
  return memoryProgress ?? { unlocked: 1, completed: [] };
}

function saveProgress(progress: Progress): void {
  memoryProgress = progress;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // hra běží dál jen s pamětí
  }
}

export function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [game, setGame] = useState<GameState | null>(null);
  const [rotations, setRotations] = useState<number[]>([]);
  const waveTimer = useRef<number | null>(null);

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
    setGame(state);
    setRotations(new Array(state.tiles.length).fill(0));
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

    if (won) {
      const id = game.config.id;
      setProgress((prev) => {
        const completed = prev.completed.includes(id)
          ? prev.completed
          : [...prev.completed, id];
        const updated: Progress = {
          unlocked: Math.max(prev.unlocked, Math.min(id + 1, LEVEL_COUNT)),
          completed,
        };
        saveProgress(updated);
        return updated;
      });
      // výherní vlna: overlay až po doběhnutí rozsvícení
      const maxDist = flow.dists.reduce((m, d) => Math.max(m, d), 0);
      clearWaveTimer();
      waveTimer.current = window.setTimeout(() => {
        setScreen('victory');
      }, maxDist * 40 + 600);
    }
  };

  if (screen === 'menu' || game === null) {
    return (
      <Menu
        unlocked={progress.unlocked}
        completed={progress.completed}
        onSelect={startLevel}
      />
    );
  }

  const levelId = game.config.id;
  return (
    <div className="game-screen">
      <HUD
        levelId={levelId}
        moves={game.moves}
        onReset={() => startLevel(levelId)}
        onMenu={goMenu}
      />
      <Board
        game={game}
        rotations={rotations}
        showOverlay={screen === 'victory'}
        onTileClick={handleTileClick}
        onNext={levelId < LEVEL_COUNT ? () => startLevel(levelId + 1) : null}
        onMenu={goMenu}
      />
    </div>
  );
}
