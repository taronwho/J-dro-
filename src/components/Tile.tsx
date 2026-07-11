import { useState } from 'react';
import { bitCount, rotateCcw } from '../engine/generator';
import type { Tile } from '../engine/types';

interface TileProps {
  tile: Tile;
  rotation: number; // kumulativní počet otočení o 90° od načtení levelu
  powered: boolean;
  colorIdx: number;
  dist: number;
  won: boolean;
  onClick: () => void;
}

// Středy hran ve viewBoxu 100×100, pořadí N, E, S, W
const EDGE: ReadonlyArray<readonly [number, number]> = [
  [50, 0],
  [100, 50],
  [50, 100],
  [0, 50],
];

export function TileView({ tile, rotation, powered, colorIdx, dist, won, onClick }: TileProps) {
  const [shaking, setShaking] = useState(false);

  const handleClick = (): void => {
    if (tile.locked) {
      setShaking(true);
      return;
    }
    onClick();
  };

  // SVG kreslí masku v základní orientaci; aktuální mask = base otočená
  // o `rotation` kroků, samotné otočení dělá CSS transform (kumulativní úhel)
  let base = tile.mask;
  for (let k = 0; k < rotation % 4; k++) base = rotateCcw(base);
  const connectors = bitCount(base);

  const classes = ['tile'];
  if (powered) classes.push('powered', `p${colorIdx}`);
  if (tile.locked) classes.push('locked');
  if (tile.isCore) classes.push('core');
  if (shaking) classes.push('shaking');
  if (won && powered) classes.push('win');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={handleClick}
      onAnimationEnd={() => setShaking(false)}
      style={won && powered ? { animationDelay: `${dist * 40}ms` } : undefined}
      aria-label={tile.isCore ? 'Jádro' : tile.locked ? 'Zamčená dlaždice' : 'Dlaždice'}
    >
      <svg
        className="pipes"
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${rotation * 90}deg)` }}
      >
        {EDGE.map(([x, y], d) =>
          base & (1 << d) ? (
            <line key={d} x1={50} y1={50} x2={x} y2={y} />
          ) : null,
        )}
        {connectors === 1 && <circle className="endcap" cx={50} cy={50} r={11} />}
        {connectors >= 3 && <circle className="hub" cx={50} cy={50} r={9} />}
        {tile.isCore && <circle className="core-pulse" cx={50} cy={50} r={16} />}
      </svg>
      {tile.locked && !tile.isCore && (
        <svg className="lock-icon" viewBox="0 0 24 24">
          <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" strokeWidth={2} />
          <rect x={6} y={10} width={12} height={9} rx={2} strokeWidth={2} />
        </svg>
      )}
    </button>
  );
}
