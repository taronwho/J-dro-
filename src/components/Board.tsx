import { useMemo } from 'react';
import { computeFlow } from '../engine/solver';
import type { GameState } from '../engine/types';
import { useI18n } from '../i18n/i18n';
import type { Ignite, LastWin } from './App';
import { TileView } from './Tile';

interface BoardProps {
  game: GameState;
  rotations: number[];
  ignite: Ignite;
  hintMode: boolean;
  hints: number;
  failed: boolean;
  showOverlay: boolean;
  lastWin: LastWin | null;
  onTileClick: (index: number) => void;
  onNext: (() => void) | null;
  onRetry: () => void;
  onMenu: () => void;
}

export function Board({
  game,
  rotations,
  ignite,
  hintMode,
  hints,
  failed,
  showOverlay,
  lastWin,
  onTileClick,
  onNext,
  onRetry,
  onMenu,
}: BoardProps) {
  const { lang, t } = useI18n();
  const flow = useMemo(
    () => computeFlow(game.tiles, game.config),
    [game.tiles, game.config],
  );
  const { width, height } = game.config;

  return (
    <div className="board-wrap">
      {hintMode && (
        <p className="hint-msg">{hints > 0 ? t('hintModeMsg') : t('hintNone')}</p>
      )}
      <div
        className={hintMode ? 'board hint-mode' : 'board'}
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
            hintMode={hintMode}
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
            <p className="overlay-moves">
              {t('overlayMoves', { n: game.moves })} · {t('target', { n: game.par })}
            </p>
            {lastWin &&
              (lastWin.newRecord ? (
                <p className="overlay-record">{t('newRecord')}</p>
              ) : (
                <p className="overlay-best">{t('best', { n: lastWin.bestMoves })}</p>
              ))}
            {lastWin?.hintUsed && <p className="overlay-note">{t('hintCapNote')}</p>}
            {lastWin?.hintGained && (
              <p className="overlay-bonus">💡 {t('hintEarned')}</p>
            )}
            {lastWin && lastWin.achievements.length > 0 && (
              <div className="overlay-achievements">
                <p className="overlay-bonus">🏆 {t('newAchievement')}</p>
                {lastWin.achievements.map((a) => (
                  <p key={a.id} className="overlay-ach-name">
                    {a.name[lang]}
                    {a.reward > 0 && ` (${t('rewardHint', { n: a.reward })})`}
                  </p>
                ))}
              </div>
            )}
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

      {failed && !showOverlay && (
        <div className="overlay">
          <div className="overlay-card fail">
            <h2>{t('failTitle')}</h2>
            <p className="overlay-moves">
              {t('failText', { n: game.moveLimit ?? game.moves })}
            </p>
            <div className="overlay-buttons">
              <button type="button" className="btn primary" onClick={onRetry}>
                {t('retry')}
              </button>
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
