import { type CSSProperties, useMemo } from 'react';
import { useI18n } from '../i18n/i18n';
import { Icon } from './Icon';

interface SectorClearProps {
  sector: number;
  stars: number;
  maxStars: number;
  reducedMotion: boolean;
  hasNext: boolean;
  onContinue: () => void;
  onMenu: () => void;
}

const SPARK_COLORS = ['var(--core-0)', 'var(--core-1)', 'var(--core-2)', 'var(--gold)'];

// Oslavná obrazovka po dokončení celého sektoru: rozzáří se jádro, kolem
// vystřelí energetické jiskry a roztočí se paprsky.
export function SectorClear({
  sector,
  stars,
  maxStars,
  reducedMotion,
  hasNext,
  onContinue,
  onMenu,
}: SectorClearProps) {
  const { t } = useI18n();

  // jiskry vystřelující z jádra (náhodné směry a vzdálenosti)
  const sparks = useMemo(
    () =>
      Array.from({ length: reducedMotion ? 0 : 22 }, (_, i) => {
        const a = Math.random() * Math.PI * 2;
        const dist = 120 + Math.random() * 170;
        return {
          tx: Math.cos(a) * dist,
          ty: Math.sin(a) * dist,
          size: 4 + Math.random() * 7,
          delay: Math.random() * 0.9,
          dur: 1.1 + Math.random() * 0.9,
          color: SPARK_COLORS[i % SPARK_COLORS.length],
        };
      }),
    [reducedMotion],
  );

  const rays = Array.from({ length: 14 }, (_, i) => (i * 360) / 14);

  return (
    <div className="sector-clear">
      <div className="sc-glow" />

      {/* rotující paprsky */}
      <svg className="sc-rays" viewBox="0 0 400 400" aria-hidden="true">
        <g className="sc-rays-spin">
          {rays.map((deg, i) => (
            <line
              key={i}
              x1="200"
              y1="200"
              x2="200"
              y2="-40"
              transform={`rotate(${deg} 200 200)`}
              style={{ opacity: i % 2 === 0 ? 0.5 : 0.22 }}
            />
          ))}
        </g>
      </svg>

      {/* jiskry */}
      <div className="sc-sparks" aria-hidden="true">
        {sparks.map((s, i) => (
          <span
            key={i}
            className="sc-spark"
            style={{
              '--tx': `${s.tx}px`,
              '--ty': `${s.ty}px`,
              '--d': `${s.delay}s`,
              '--t': `${s.dur}s`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              background: s.color,
              boxShadow: `0 0 10px ${s.color}`,
            } as CSSProperties}
          />
        ))}
      </div>

      {/* zářící jádro s trofejí */}
      <div className="sc-emblem">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <radialGradient id="scCore" cx="50%" cy="42%" r="65%">
              <stop offset="0%" stopColor="#fff7d6" />
              <stop offset="45%" stopColor="var(--gold)" />
              <stop offset="100%" stopColor="#b8791a" />
            </radialGradient>
          </defs>
          <polygon
            className="sc-hex"
            points="60,8 106,34 106,86 60,112 14,86 14,34"
            fill="url(#scCore)"
          />
          <polygon
            className="sc-hex-ring"
            points="60,8 106,34 106,86 60,112 14,86 14,34"
            pathLength={100}
          />
        </svg>
        <span className="sc-trophy">
          <Icon name="trophy" />
        </span>
      </div>

      <p className="sc-kicker">{t('sectorClearKicker')}</p>
      <h1 className="sc-title">{t('sector', { n: sector })}</h1>
      <p className="sc-stars">
        <Icon name="star" className="inline-icon c-gold" />{' '}
        {t('sectorStarsLine', { x: stars, y: maxStars })}
      </p>
      <p className="sc-text">{t('sectorClearText')}</p>

      <div className="sc-buttons">
        <button type="button" className="btn primary" onClick={onContinue}>
          {hasNext ? t('continue') : t('menu')}
        </button>
        {hasNext && (
          <button type="button" className="btn" onClick={onMenu}>
            {t('menu')}
          </button>
        )}
      </div>
    </div>
  );
}
