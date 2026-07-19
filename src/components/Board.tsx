import { useMemo } from 'react';
import { computeColors, computeFlow } from '../engine/solver';
import type { GameState } from '../engine/types';
import { useI18n } from '../i18n/i18n';
import type { Ignite, LastWin, RushOver } from './App';
import { Icon } from './Icon';
import { TileView } from './Tile';

interface BoardProps {
  game: GameState;
  rotations: number[];
  ignite: Ignite;
  hintMode: boolean;
  hints: number;
  failed: boolean;
  fog: boolean;
  rushOver: RushOver | null;
  showOverlay: boolean;
  lastWin: LastWin | null;
  onTileClick: (index: number) => void;
  onNext: (() => void) | null;
  onRetry: () => void;
  onRushRetry: () => void;
  onMenu: () => void;
}

export function Board({
  game,
  rotations,
  ignite,
  hintMode,
  hints,
  failed,
  fog,
  rushOver,
  showOverlay,
  lastWin,
  onTileClick,
  onNext,
  onRetry,
  onRushRetry,
  onMenu,
}: BoardProps) {
  const { lang, t } = useI18n();
  const flow = useMemo(
    () => computeFlow(game.tiles, game.config),
    [game.tiles, game.config],
  );
  const colors = useMemo(
    () => computeColors(game.tiles, game.config),
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
            colorsMask={colors[i]}
            dist={flow.dists[i]}
            won={game.won}
            igniteGen={ignite.gen}
            igniteDelay={ignite.delays[i] ?? -1}
            igniteEntry={ignite.entries[i] ?? -1}
            hintMode={hintMode}
            fog={fog}
            onClick={() => onTileClick(i)}
          />
        ))}
      </div>

      {/* zdi mezi dlaždicemi: souvislé linky ve spárách mřížky */}
      {game.tiles.some((t) => (t.wallMask ?? 0) !== 0) && (
        <div
          className="walls-layer"
          style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}
          aria-hidden="true"
        >
          {game.tiles.map((tile, i) => {
            const wm = tile.wallMask ?? 0;
            return (
              <span key={i} className="wcell">
                {(wm & 1) !== 0 && <i className="wseg n" />}
                {(wm & 2) !== 0 && <i className="wseg e" />}
                {(wm & 4) !== 0 && <i className="wseg s" />}
                {(wm & 8) !== 0 && <i className="wseg w" />}
              </span>
            );
          })}
        </div>
      )}

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
                    <Icon name="star" />
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
              ) : lastWin.bestMoves !== null ? (
                <p className="overlay-best">{t('best', { n: lastWin.bestMoves })}</p>
              ) : null)}
            {lastWin?.hintUsed && <p className="overlay-note">{t('hintCapNote')}</p>}
            {lastWin?.hintGained && (
              <p className="overlay-bonus">
                <Icon name="bulb" className="inline-icon c-amber" /> {t('hintEarned')}
              </p>
            )}
            {lastWin?.hintGainedDaily && (
              <p className="overlay-bonus">
                <Icon name="bulb" className="inline-icon c-amber" />{' '}
                {t('hintEarnedDaily')}
              </p>
            )}
            {lastWin && lastWin.achievements.length > 0 && (
              <div className="overlay-achievements">
                <p className="overlay-bonus">
                  <Icon name="trophy" className="inline-icon c-gold" />{' '}
                  {t('newAchievement')}
                </p>
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

      {rushOver !== null && (
        <div className="overlay">
          <div className="overlay-card fail">
            <h2>{t('rushOver')}</h2>
            <p className="overlay-moves">{t('rushSolved', { n: rushOver.score })}</p>
            {rushOver.newBest ? (
              <p className="overlay-record">{t('newRecord')}</p>
            ) : (
              <p className="overlay-best">{t('best', { n: rushOver.best })}</p>
            )}
            {rushOver.achievements.length > 0 && (
              <div className="overlay-achievements">
                <p className="overlay-bonus">
                  <Icon name="trophy" className="inline-icon c-gold" />{' '}
                  {t('newAchievement')}
                </p>
                {rushOver.achievements.map((a) => (
                  <p key={a.id} className="overlay-ach-name">
                    {a.name[lang]}
                    {a.reward > 0 && ` (${t('rewardHint', { n: a.reward })})`}
                  </p>
                ))}
              </div>
            )}
            <div className="overlay-buttons">
              <button type="button" className="btn primary" onClick={onRushRetry}>
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
