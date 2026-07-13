import { describe, expect, it } from 'vitest';
import { LEVELS } from '../levels/levels';
import { bitCount, generateLevel, rotateCw } from './generator';
import { applyMelt, computeColors, isWon, neighborIndex } from './solver';
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

      it('par: odpovídá minimálním rotacím a vede k výhře', () => {
        const state = generateLevel(config);
        let sum = 0;
        for (const t of state.tiles) {
          if (t.locked) continue;
          let m = t.mask;
          let r = 0;
          while (m !== t.solutionMask && r < 4) {
            m = rotateCw(m);
            r++;
          }
          sum += r;
        }
        expect(state.par).toBe(sum);
        expect(state.par).toBeGreaterThanOrEqual(3);
        expect(isWon(solvedCopy(state))).toBe(true);
      });

      it('limit tahů: odpovídá konfiguraci a je dosažitelný', () => {
        const state = generateLevel(config);
        if (config.movesMargin === undefined) {
          expect(state.moveLimit).toBeNull();
        } else {
          expect(state.moveLimit).toBe(state.par + config.movesMargin);
          expect(state.moveLimit).toBeGreaterThan(state.par);
        }
      });

      it('zdi: správný počet, bez konektorů, zamčené', () => {
        const state = generateLevel(config);
        const wallTiles = state.tiles.filter((t) => t.isWall === true);
        expect(wallTiles.length).toBe(config.wallCount ?? 0);
        for (const wall of wallTiles) {
          expect(wall.mask).toBe(0);
          expect(wall.solutionMask).toBe(0);
          expect(wall.locked).toBe(true);
        }
      });

      it('barevné cíle: správný počet, koncovky, splněné v řešení', () => {
        const state = generateLevel(config);
        const targets = state.tiles
          .map((t, i) => ({ t, i }))
          .filter(({ t }) => t.targetColor !== undefined);
        expect(targets.length).toBe(config.targetCount ?? 0);
        const solved = solvedCopy(state);
        const colors = computeColors(solved.tiles, config);
        for (const { t, i } of targets) {
          expect(bitCount(t.solutionMask)).toBe(1);
          expect(colors[i] & (1 << (t.targetColor ?? 0))).not.toBe(0);
        }
      });

      it('zamrzlé dlaždice: rozmrazitelné bez vlastního otočení', () => {
        const state = generateLevel(config);
        const frozen = state.tiles.filter((t) => t.frozen === true);
        expect(frozen.length).toBeLessThanOrEqual(config.frozenCount ?? 0);
        if ((config.frozenCount ?? 0) === 0) return;
        expect(frozen.length).toBeGreaterThan(0);
        // Nastav vše kromě zamrzlých na řešení — každý led musí roztát
        const tiles = state.tiles.map((t) =>
          t.frozen === true ? t : { ...t, mask: t.solutionMask },
        );
        const melted = applyMelt(tiles, config);
        expect(melted).not.toBeNull();
        expect(melted?.some((t) => t.frozen === true)).toBe(false);
        // a po dotočení rozmrzlých je level vyhraný
        const finished = (melted ?? tiles).map((t) => ({ ...t, mask: t.solutionMask }));
        expect(isWon({ ...state, tiles: finished })).toBe(true);
      });
    });
  }
});
