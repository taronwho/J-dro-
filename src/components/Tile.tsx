import { useState } from 'react';
import { bitCount, rotateCcw } from '../engine/generator';
import type { Tile } from '../engine/types';
import { useI18n } from '../i18n/i18n';
import { Icon } from './Icon';

interface TileProps {
  tile: Tile;
  rotation: number; // kumulativní počet otočení o 90° od načtení levelu
  powered: boolean;
  colorIdx: number;
  colorsMask: number; // bitmaska všech barev, které dlaždicí protékají
  dist: number;
  won: boolean;
  igniteGen: number; // změna generace restartuje animaci rozlití světla
  igniteDelay: number; // ms; -1 = dlaždice se v této generaci nerozsvěcí
  igniteEntry: number; // světová strana, kterou světlo vteklo (-1 = jádro)
  hintMode: boolean;
  fog: boolean; // režim Zatmění: nenapájené dlaždice jsou skryté
  onClick: () => void;
}

// Středy hran ve viewBoxu 100×100, pořadí N, E, S, W; každá linka má délku 50
const EDGE: ReadonlyArray<readonly [number, number]> = [
  [50, 0],
  [100, 50],
  [50, 100],
  [0, 50],
];

// Pozice nýtů v rozích zamčené dlaždice
const RIVETS: ReadonlyArray<readonly [number, number]> = [
  [13, 13],
  [87, 13],
  [13, 87],
  [87, 87],
];

export function TileView({
  tile,
  rotation,
  powered,
  colorIdx,
  colorsMask,
  dist,
  won,
  igniteGen,
  igniteDelay,
  igniteEntry,
  hintMode,
  fog,
  onClick,
}: TileProps) {
  const { t } = useI18n();
  const [shaking, setShaking] = useState(false);

  const frozen = tile.frozen === true;
  const wallMask = tile.wallMask ?? 0;

  const handleClick = (): void => {
    if ((tile.locked || frozen) && !hintMode) {
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

  const igniting = powered && igniteDelay >= 0;
  // vstupní strana převedená do základní orientace (SVG je otočené o rotation×90°)
  const entryBase =
    igniteEntry >= 0 ? (((igniteEntry - rotation) % 4) + 4) % 4 : -1;

  // další barvy protékající dlaždicí (kromě primární)
  const extraColors: number[] = [];
  if (powered) {
    for (let c = 0; c < 3; c++) {
      if (c !== colorIdx && (colorsMask & (1 << c)) !== 0) extraColors.push(c);
    }
  }

  const targetSatisfied =
    tile.targetColor !== undefined && (colorsMask & (1 << tile.targetColor)) !== 0;

  const classes = ['tile'];
  if (powered) classes.push('powered', `p${colorIdx}`);
  if (tile.locked) classes.push('locked');
  if (tile.isCore) classes.push('core');
  if (frozen) classes.push('frozen');
  if (shaking) classes.push('shaking');
  if (won && powered) classes.push('win');
  if (fog && !powered) classes.push('fogged');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={handleClick}
      onAnimationEnd={() => setShaking(false)}
      style={won && powered ? { animationDelay: `${dist * 40}ms` } : undefined}
      aria-label={tile.isCore ? t('ariaCore') : tile.locked || frozen ? t('ariaLocked') : t('ariaTile')}
    >
      <svg
        className="pipes"
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${rotation * 90}deg)` }}
      >
        {/* kovový plášť trubek — statický podklad */}
        {EDGE.map(([x, y], d) =>
          base & (1 << d) ? (
            <line key={`c${d}`} className="casing" x1={50} y1={50} x2={x} y2={y} />
          ) : null,
        )}
        {connectors >= 1 && <circle className="casing-hub" cx={50} cy={50} r={12} />}

        <g key={igniteGen}>
          {/* energetické linky uvnitř pláště */}
          {EDGE.map(([x, y], d) => {
            if ((base & (1 << d)) === 0) return null;
            if (!igniting) {
              return <line key={d} className="energy" x1={50} y1={50} x2={x} y2={y} />;
            }
            const isEntry = d === entryBase;
            return (
              <line
                key={d}
                className={isEntry ? 'energy line-in' : 'energy line-out'}
                style={{ animationDelay: `${igniteDelay + (isEntry ? 0 : 110)}ms` }}
                x1={50}
                y1={50}
                x2={x}
                y2={y}
              />
            );
          })}

          {/* další barvy proudící stejnou trubkou — tenčí souběžné linky */}
          {extraColors.map((c, order) =>
            EDGE.map(([x, y], d) =>
              base & (1 << d) ? (
                <line
                  key={`x${c}-${d}`}
                  className={`energy-extra e${c}`}
                  strokeWidth={order === 0 ? 3.2 : 1.8}
                  x1={50}
                  y1={50}
                  x2={x}
                  y2={y}
                />
              ) : null,
            ),
          )}

          {/* tekoucí částice energie v napájených trubkách */}
          {powered &&
            EDGE.map(([x, y], d) =>
              base & (1 << d) ? (
                <line
                  key={`f${d}`}
                  className={d === entryBase ? 'flow flow-rev' : 'flow'}
                  x1={50}
                  y1={50}
                  x2={x}
                  y2={y}
                />
              ) : null,
            )}

          {connectors === 1 && (
            <circle
              className={igniting ? 'endcap dot-in' : 'endcap'}
              style={igniting ? { animationDelay: `${igniteDelay + 150}ms` } : undefined}
              cx={50}
              cy={50}
              r={9}
            />
          )}
          {connectors >= 3 && (
            <circle
              className={igniting ? 'hub dot-in' : 'hub'}
              style={igniting ? { animationDelay: `${igniteDelay + 150}ms` } : undefined}
              cx={50}
              cy={50}
              r={8}
            />
          )}

          {/* reaktorové jádro: rotující prstenec + pulzující střed */}
          {tile.isCore && (
            <>
              <circle className="core-ring" cx={50} cy={50} r={22} />
              <circle className="core-pulse" cx={50} cy={50} r={15} />
              <circle className="core-hot" cx={50} cy={50} r={6} />
            </>
          )}
        </g>

        {/* barevný cíl: zásuvka, která musí dostat svou barvu */}
        {tile.targetColor !== undefined && (
          <circle
            className={
              targetSatisfied
                ? `target-ring t${tile.targetColor} sat`
                : `target-ring t${tile.targetColor}`
            }
            cx={50}
            cy={50}
            r={17}
          />
        )}
      </svg>

      {/* zdi mezi dlaždicemi — neprostupné hrany jako v bludišti */}
      {(wallMask & 1) !== 0 && <span className="edge-wall wn" aria-hidden="true" />}
      {(wallMask & 2) !== 0 && <span className="edge-wall we" aria-hidden="true" />}
      {(wallMask & 4) !== 0 && <span className="edge-wall ws" aria-hidden="true" />}
      {(wallMask & 8) !== 0 && <span className="edge-wall ww" aria-hidden="true" />}

      {frozen && tile.frozenColor !== undefined && (
        <Icon name="snowflake" className={`frozen-icon fz${tile.frozenColor}`} />
      )}

      {tile.locked && !tile.isCore && (
        <>
          <svg className="rivets" viewBox="0 0 100 100" aria-hidden="true">
            {RIVETS.map(([x, y], i) => (
              <circle key={i} className="rivet" cx={x} cy={y} r={3.2} />
            ))}
          </svg>
          <svg className="lock-icon" viewBox="0 0 24 24">
            <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" strokeWidth={2} />
            <rect x={6} y={10} width={12} height={9} rx={2} strokeWidth={2} />
          </svg>
        </>
      )}
    </button>
  );
}
