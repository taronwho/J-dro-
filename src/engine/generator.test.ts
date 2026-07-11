import { describe, expect, it } from 'vitest';
import { LEVELS } from '../levels/levels';
import { generateLevel } from './generator';
import { isWon, neighborIndex } from './solver';
import type { Dir, GameState } from './types';

function solvedCopy(state: GameState): GameState {
  return {
    ...state,
    tiles: state.tiles.map((t) => ({ ...t, mask: t.solutionMask })),
  };
}

describe('generátor levelů', () => {
  for (const config of LEVELS) {
    describe(`level ${config.id} (${config.width}×${config.height}${config.wrap ? ', wrap' : ''})`, () => {
      it('řešitelnost: stav řešení vyhrává', () => {
        const state = generateLevel(config);
        expect(isWon(solvedCopy(state))).toBe(true);
      });

      it('není instantně vyhraný', () => {
        const state = generateLevel(config);
        expect(state.won).toBe(false);
        expect(isWon(state)).toBe(false);
      });

      it('determinismus: dvojí generování je bit-shodné', () => {
        const a = generateLevel(config);
        const b = generateLevel(config);
        expect(a.tiles.map((t) => t.mask)).toEqual(b.tiles.map((t) => t.mask));
        expect(a.tiles.map((t) => t.solutionMask)).toEqual(
          b.tiles.map((t) => t.solutionMask),
        );
      });

      it('konzistence zamčení: zamčené dlaždice mají masku řešení', () => {
        const state = generateLevel(config);
        for (const tile of state.tiles) {
          if (tile.isCore) expect(tile.locked).toBe(true);
          if (tile.locked) expect(tile.mask).toBe(tile.solutionMask);
        }
      });

      it('validní okraje: bez wrapu žádný konektor nemíří ven', () => {
        if (config.wrap) return;
        const state = generateLevel(config);
        state.tiles.forEach((tile, i) => {
          for (let d = 0; d < 4; d++) {
            if (tile.solutionMask & (1 << d)) {
              expect(neighborIndex(i, d as Dir, config)).not.toBe(-1);
            }
          }
        });
      });

      it('netrivialita: aspoň 3 dlaždice se liší od řešení', () => {
        const state = generateLevel(config);
        const diff = state.tiles.filter((t) => t.mask !== t.solutionMask).length;
        expect(diff).toBeGreaterThanOrEqual(3);
      });
    });
  }
});
