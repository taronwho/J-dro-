import { describe, expect, it } from 'vitest';
import { LEVELS, PACKS } from '../levels/levels';
import { bitCount, generateLevel, rotateCw } from './generator';
import { applyMelt, computeColors, isWon, neighborIndex, opposite } from './solver';
import type { Dir, GameState } from './types';

function solvedCopy(state: GameState): GameState {
  return {
    ...state,
    tiles: state.tiles.map((t) => ({ ...t, mask: t.solutionMask })),
  };
}

const ALL_CONFIGS = [...LEVELS, ...PACKS.flatMap((p) => p.levels)];

describe('generátor levelů', () => {
  it('id všech levelů (kampaň + balíčky) jsou unikátní', () => {
    const ids = ALL_CONFIGS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const config of ALL_CONFIGS) {
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

      it('validní okraje: bez wrapu míří ven jen portály', () => {
        if (config.wrap) return;
        const state = generateLevel(config);
        state.tiles.forEach((tile, i) => {
          for (let d = 0; d < 4; d++) {
            if (tile.solutionMask & (1 << d)) {
              if (tile.portalDir === d) continue; // portál vede ven záměrně
              expect(neighborIndex(i, d as Dir, config)).not.toBe(-1);
            }
          }
        });
      });

      it('portály: páry na okraji, směr ven, řešení jimi vede', () => {
        const state = generateLevel(config);
        const portalTiles = state.tiles
          .map((t, i) => ({ t, i }))
          .filter(({ t }) => t.portalPair !== undefined);
        expect(portalTiles.length).toBe((config.portalCount ?? 0) * 2);
        const byPair = new Map<number, number[]>();
        for (const { t, i } of portalTiles) {
          const dir = t.portalDir;
          expect(dir).toBeDefined();
          // portál je na okraji a míří ven z pole
          expect(neighborIndex(i, dir as Dir, config)).toBe(-1);
          // řešení portál skutečně používá
          expect(t.solutionMask & (1 << (dir as number))).not.toBe(0);
          const pair = t.portalPair as number;
          byPair.set(pair, [...(byPair.get(pair) ?? []), i]);
        }
        for (const cells of byPair.values()) {
          expect(cells.length).toBe(2);
        }
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

      it('zdi: symetrické hrany, řešení přes ně nevede', () => {
        const state = generateLevel(config);
        let canonical = 0;
        state.tiles.forEach((tile, i) => {
          const wm = tile.wallMask ?? 0;
          // spoj v řešení nikdy nekříží zeď
          expect(tile.solutionMask & wm).toBe(0);
          for (let d = 0; d < 4; d++) {
            if ((wm & (1 << d)) === 0) continue;
            const nb = neighborIndex(i, d as Dir, config);
            expect(nb).not.toBe(-1);
            // zeď je oboustranná
            expect(
              (state.tiles[nb].wallMask ?? 0) & (1 << opposite(d as Dir)),
            ).not.toBe(0);
            if (d === 1 || d === 2) canonical++;
          }
        });
        if ((config.wallCount ?? 0) === 0) expect(canonical).toBe(0);
        else expect(canonical).toBeGreaterThan(0);
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
