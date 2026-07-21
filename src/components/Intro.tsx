import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/i18n';

interface IntroProps {
  reducedMotion: boolean;
  onDone: () => void;
}

// Spouštěcí obrazovka: energie se sbíhá trubkami do jádra, jádro se zažehne
// a vynoří se nápis CORE. Klepnutím kdekoliv lze přeskočit.
export function Intro({ reducedMotion, onDone }: IntroProps) {
  const { t } = useI18n();
  const [leaving, setLeaving] = useState(false);
  const total = reducedMotion ? 1000 : 2700;

  useEffect(() => {
    const t1 = window.setTimeout(() => setLeaving(true), total - 460);
    const t2 = window.setTimeout(onDone, total);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [total, onDone]);

  const skip = (): void => {
    setLeaving(true);
    window.setTimeout(onDone, 260);
  };

  // šest trubek sbíhajících se z okraje do jádra (šestiúhelníkové směry)
  const R = 96;
  const rInner = 28;
  const pipes = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return {
      x1: 100 + R * Math.cos(a),
      y1: 100 + R * Math.sin(a),
      x2: 100 + rInner * Math.cos(a),
      y2: 100 + rInner * Math.sin(a),
      nx: 100 + R * Math.cos(a),
      ny: 100 + R * Math.sin(a),
    };
  });
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return `${100 + 22 * Math.cos(a)},${100 + 22 * Math.sin(a)}`;
  }).join(' ');

  return (
    <div
      className={leaving ? 'intro leaving' : 'intro'}
      onClick={skip}
      role="button"
      aria-label={t('introSkip')}
    >
      <div className="intro-stage">
        <svg className="intro-svg" viewBox="0 0 200 200" aria-hidden="true">
          {/* rozpínavé energetické prstence */}
          <circle className="intro-ring" cx="100" cy="100" r="30" />
          <circle className="intro-ring d2" cx="100" cy="100" r="30" />

          {/* trubky nabíjející jádro */}
          <g className="intro-pipes">
            {pipes.map((p, i) => (
              <line
                key={i}
                className="intro-pipe"
                x1={p.x1}
                y1={p.y1}
                x2={p.x2}
                y2={p.y2}
                pathLength={100}
                style={{ animationDelay: `${180 + i * 90}ms` }}
              />
            ))}
            {pipes.map((p, i) => (
              <circle
                key={`n${i}`}
                className="intro-node"
                cx={p.nx}
                cy={p.ny}
                r="4.2"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              />
            ))}
          </g>

          {/* rotující technický kroužek */}
          <circle className="intro-halo" cx="100" cy="100" r="34" pathLength={100} />

          {/* jádro */}
          <g className="intro-core">
            <polygon className="intro-hex" points={hex} />
            <circle className="intro-spark" cx="100" cy="100" r="9" />
          </g>
        </svg>

        <div className="intro-word" aria-label="CORE">
          {['C', 'O', 'R', 'E'].map((ch, i) => (
            <span key={i} style={{ animationDelay: `${1000 + i * 110}ms` }}>
              {ch}
            </span>
          ))}
        </div>
        <p className="intro-tagline">{t('tagline')}</p>
      </div>
      <span className="intro-skip">{t('introSkip')}</span>
    </div>
  );
}
