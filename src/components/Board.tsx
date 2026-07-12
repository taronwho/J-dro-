import { useMemo } from 'react';
import { computeFlow } from '../engine/solver';
import type { GameState } from '../engine/types';
import { useI18n } from '../i18n/i18n';
import { TileView } from './Tile';

interface LastWin {
  stars: number;
  newRecord: boolean;
  bestMoves: number;
}

interface Ignite {
  gen: number;
  delays: number[];
  entries: number[];
}

interface BoardProps {
  game: GameState;
  rotations: number[];
  ignite: Ignite;
  showOverlay: boolean;
  lastWin: LastWin | null;
  onTileClick: (index: number) => void;
  onNext: (() => void) | null;
  onMenu: () => void;
}

export function Board({
  game,
  rotations,
  ignite,
  showOverlay,
  lastWin,
  onTileClick,
  onNext,
  onMenu,
}: BoardProps) {
  const { t } = useI18n();
  const flow = useMemo(
    () => computeFlow(game.tiles, game.config),
    [game.tiles, game.config],
  );
  const { width, height } = game.config;

  return (
    <div className="board-wrap">
      <div
        className="board"
        style={{
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          aspectRatio: `${width} / ${height}`,
        }}
      >
        {game.tiles.map((tile, i) => (
          <TileView
            key={i}
            tile={tile}
            rotation={rotations[i]}
            powered={flow.powered[i]}
            colorIdx={flow.colors[i]}
            dist={flow.dists[i]}
            won={game.won}
            igniteGen={ignite.gen}
            igniteDelay={ignite.delays[i] ?? -1}
            igniteEntry={ignite.entries[i] ?? -1}
            onClick={() => onTileClick(i)}
          />
        ))}
      </div>
      {showOverlay && (
        <div className="overlay">
          <div className="overlay-card">
            <h2>{t('levelDone')}</h2>
            {lastWin && (
              <div className="win-stars" aria-label={`${lastWin.stars}/3`}>
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={i <= lastWin.stars ? 'star big filled pop' : 'star big'}
                    style={{ animationDelay: `${i * 160}ms` }}
                  >
                    ★
                  </span>
                ))}
              </div>
            )}
            <p className="overlay-moves">{t('overlayMoves', { n: game.moves })}</p>
            {lastWin &&
              (lastWin.newRecord ? (
                <p className="overlay-record">{t('newRecord')}</p>
              ) : (
                <p className="overlay-best">{t('best', { n: lastWin.bestMoves })}</p>
              ))}
            <div className="overlay-buttons">
              {onNext && (
                <button type="button" className="btn primary" onClick={onNext}>
                  {t('next')}
                </button>
              )}
              <button type="button" className="btn" onClick={onMenu}>
                {t('menu')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
