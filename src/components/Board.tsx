import { useMemo } from 'react';
import { computeFlow } from '../engine/solver';
import type { GameState } from '../engine/types';
import { TileView } from './Tile';

interface BoardProps {
  game: GameState;
  rotations: number[];
  showOverlay: boolean;
  onTileClick: (index: number) => void;
  onNext: (() => void) | null;
  onMenu: () => void;
}

export function Board({ game, rotations, showOverlay, onTileClick, onNext, onMenu }: BoardProps) {
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
            onClick={() => onTileClick(i)}
          />
        ))}
      </div>
      {showOverlay && (
        <div className="overlay">
          <div className="overlay-card">
            <h2>Level dokončen</h2>
            <p className="overlay-moves">Tahů: {game.moves}</p>
            <div className="overlay-buttons">
              {onNext && (
                <button type="button" className="btn primary" onClick={onNext}>
                  Další level
                </button>
              )}
              <button type="button" className="btn" onClick={onMenu}>
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
