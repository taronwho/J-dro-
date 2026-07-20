// Sdílení výsledků (Wordle styl): emoji mřížka finální desky + skóre.
// Web Share API s fallbackem do schránky.

import type { GameState } from './engine/types';
import { computeColors, computeFlow } from './engine/solver';

const GAME_URL = 'https://taronwho.github.io/J-dro-/';

const COLOR_EMOJI = ['🟦', '🟪', '🟨'];

// Emoji mřížka vyřešené desky podle barev energie
export function boardEmoji(state: GameState): string {
  const { width } = state.config;
  const flow = computeFlow(state.tiles, state.config);
  const colors = computeColors(state.tiles, state.config);
  const rows: string[] = [];
  for (let i = 0; i < state.tiles.length; i += width) {
    let row = '';
    for (let x = 0; x < width; x++) {
      const idx = i + x;
      if (!flow.powered[idx]) {
        row += '⬛';
        continue;
      }
      // víc barev naráz → bílá
      const mask = colors[idx];
      const bits = [0, 1, 2].filter((c) => (mask & (1 << c)) !== 0);
      row += bits.length > 1 ? '⬜' : COLOR_EMOJI[bits[0] ?? 0];
    }
    rows.push(row);
  }
  return rows.join('\n');
}

export interface ShareResult {
  ok: boolean;
  copied: boolean; // true = šlo do schránky (zobraz potvrzení)
}

export async function shareText(text: string): Promise<ShareResult> {
  try {
    if (navigator.share !== undefined) {
      await navigator.share({ text });
      return { ok: true, copied: false };
    }
  } catch {
    // uživatel zrušil sdílení, nebo není povolené — zkus schránku
  }
  try {
    await navigator.clipboard.writeText(text);
    return { ok: true, copied: true };
  } catch {
    return { ok: false, copied: false };
  }
}

export function dailyShareText(
  state: GameState,
  stars: number,
  streak: number,
  dateLabel: string,
): string {
  const starLine = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  return [
    `CORE — ${dateLabel}`,
    `${starLine}  ${state.moves} / ${state.par}`,
    `🔥 ${streak}`,
    boardEmoji(state),
    GAME_URL,
  ].join('\n');
}

export function rushShareText(score: number, best: number): string {
  return [`CORE — Time Rush`, `⚡ ${score}  🏆 ${best}`, GAME_URL].join('\n');
}
