import { useI18n } from '../i18n/i18n';

interface MapJourneyProps {
  fromSector: number;
  toSector: number;
  reducedMotion: boolean;
  onContinue: () => void;
  onMenu: () => void;
}

// Vinoucí se cesta mezi dvěma sektory mapy Kory
const PATH_D = 'M150 470 C 46 398 46 322 150 262 C 254 202 254 128 150 74';

// Cinematická animace po dokončení sektoru: po mapě Kory se rozzáří trasa
// a jádro-hráč sklouzne z hotového sektoru k dalšímu.
export function MapJourney({
  fromSector,
  toSector,
  reducedMotion,
  onContinue,
  onMenu,
}: MapJourneyProps) {
  const { t } = useI18n();

  // pár hvězd na pozadí
  const stars = [
    [30, 60],
    [260, 90],
    [70, 200],
    [240, 260],
    [40, 360],
    [270, 420],
    [120, 130],
    [200, 480],
  ];

  return (
    <div className="map-journey">
      <div className="mj-stars" aria-hidden="true">
        {stars.map(([x, y], i) => (
          <span
            key={i}
            style={{ left: `${(x / 300) * 100}%`, top: `${(y / 520) * 100}%` }}
          />
        ))}
      </div>

      <p className="mj-kicker">{t('mapTitle')}</p>

      <svg className="mj-svg" viewBox="0 0 300 520" aria-hidden="true">
        <defs>
          <linearGradient id="mjRoute" x1="150" y1="470" x2="150" y2="74" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--gold)" />
            <stop offset="100%" stopColor="var(--core-0)" />
          </linearGradient>
          <radialGradient id="mjNodeGold" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#fff7d6" />
            <stop offset="55%" stopColor="var(--gold)" />
            <stop offset="100%" stopColor="#b8791a" />
          </radialGradient>
          <radialGradient id="mjNodeCore" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#eafcff" />
            <stop offset="55%" stopColor="var(--core-0)" />
            <stop offset="100%" stopColor="#1c6f80" />
          </radialGradient>
        </defs>

        <path className="mj-casing" d={PATH_D} />
        <path
          id="mjPath"
          className={reducedMotion ? 'mj-route done' : 'mj-route'}
          d={PATH_D}
          pathLength={100}
        />

        {/* hotový sektor */}
        <circle className="mj-node-done" cx="150" cy="470" r="16" />
        <text className="mj-label" x="150" y="504">
          {t('sector', { n: fromSector })}
        </text>

        {/* další sektor */}
        <circle className="mj-node-base" cx="150" cy="74" r="17" />
        <circle
          className={reducedMotion ? 'mj-node-next show' : 'mj-node-next'}
          cx="150"
          cy="74"
          r="17"
        />
        <text
          className={reducedMotion ? 'mj-label-next show' : 'mj-label-next'}
          x="150"
          y="40"
        >
          {t('sector', { n: toSector })}
        </text>

        {/* jádro-hráč klouzající po trase */}
        {reducedMotion ? (
          <circle className="mj-marker-dot" cx="150" cy="74" r="9" />
        ) : (
          <g className="mj-marker">
            <circle r="9" />
            <animateMotion dur="1.9s" begin="0s" fill="freeze" path={PATH_D} />
          </g>
        )}
      </svg>

      <div className="mj-buttons">
        <button type="button" className="btn primary" onClick={onContinue}>
          {t('continue')}
        </button>
        <button type="button" className="btn" onClick={onMenu}>
          {t('menu')}
        </button>
      </div>
    </div>
  );
}
