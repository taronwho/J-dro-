// Originální vektorové emblémy hodností: 5 tříd (bronz, stříbro, zlato,
// platina, jádro) × 4 stupně (šipky pod znakem). Tvar rámu, kov i vnitřní
// glyf se s hodností vyvíjejí — každý z 20 emblémů je unikátní.

interface Palette {
  main: string;
  deep: string;
  light: string;
}

const PALETTES: Palette[] = [
  { main: '#c98a4b', deep: '#6e4522', light: '#f0b981' }, // bronz
  { main: '#c3cddb', deep: '#66707f', light: '#eef4fb' }, // stříbro
  { main: '#ffd84d', deep: '#8a6b17', light: '#fff0b3' }, // zlato
  { main: '#a5e9ff', deep: '#3f7d99', light: '#e6faff' }, // platina
  { main: '#22e0ff', deep: '#0c3d4a', light: '#b3f4ff' }, // jádro
];

const HEX_POINTS = '50,10 81.2,28 81.2,64 50,82 18.8,64 18.8,28';

const SHIELD_PATH =
  'M50 8 L84 20 V48 C84 68 70 82 50 90 C30 82 16 68 16 48 V20 Z';

const STAR_POINTS =
  '50,8 60.7,20.1 76.9,19.1 75.9,35.3 88,46 75.9,56.7 76.9,72.9 60.7,71.9 ' +
  '50,84 39.3,71.9 23.1,72.9 24.1,56.7 12,46 24.1,35.3 23.1,19.1 39.3,20.1';

interface RankBadgeProps {
  rank: number; // 1–20
  className?: string;
}

export function RankBadge({ rank, className }: RankBadgeProps) {
  const tier = Math.min(4, Math.floor((rank - 1) / 4));
  const sub = (rank - 1) % 4; // 0–3 šipky
  const p = PALETTES[tier];
  const gid = `rankg${rank}`;

  const frame =
    tier === 0 ? (
      <circle cx="50" cy="46" r="35" fill={`url(#${gid})`} stroke={p.deep} strokeWidth="2.5" />
    ) : tier === 1 ? (
      <polygon points={HEX_POINTS} fill={`url(#${gid})`} stroke={p.deep} strokeWidth="2.5" />
    ) : tier === 2 ? (
      <path d={SHIELD_PATH} fill={`url(#${gid})`} stroke={p.deep} strokeWidth="2.5" />
    ) : tier === 3 ? (
      <polygon points={STAR_POINTS} fill={`url(#${gid})`} stroke={p.deep} strokeWidth="2" />
    ) : (
      <>
        <circle cx="50" cy="46" r="37" fill="none" stroke={p.main} strokeWidth="2.5" strokeDasharray="8 5" />
        <circle cx="50" cy="46" r="30" fill={`url(#${gid})`} stroke={p.deep} strokeWidth="2.5" />
      </>
    );

  return (
    <svg
      viewBox="0 0 100 104"
      className={className ? `rank-badge rk-t${tier} ${className}` : `rank-badge rk-t${tier}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="45%" stopColor={p.main} />
          <stop offset="100%" stopColor={p.deep} />
        </linearGradient>
      </defs>

      {frame}

      {/* vnitřní deska */}
      <circle cx="50" cy="46" r={tier === 4 ? 23 : 24} fill="#101018" stroke={p.deep} strokeWidth="1.5" />

      {/* glyf: trubkový kříž, s vyšší třídou složitější */}
      <g stroke={p.main} strokeWidth={tier >= 1 ? 4 : 3} strokeLinecap="round">
        <line x1="50" y1="46" x2="50" y2={46 - 16} />
        <line x1="50" y1="46" x2="50" y2={46 + 16} />
        {tier >= 1 && (
          <>
            <line x1="50" y1="46" x2={50 - 16} y2="46" />
            <line x1="50" y1="46" x2={50 + 16} y2="46" />
          </>
        )}
        {tier >= 3 && (
          <g strokeWidth="2.5">
            <line x1="39" y1="35" x2="43.5" y2="39.5" />
            <line x1="61" y1="35" x2="56.5" y2="39.5" />
            <line x1="39" y1="57" x2="43.5" y2="52.5" />
            <line x1="61" y1="57" x2="56.5" y2="52.5" />
          </g>
        )}
      </g>
      {tier >= 2 && (
        <circle cx="50" cy="46" r="11.5" fill="none" stroke={p.main} strokeWidth="2" />
      )}
      {tier === 4 && (
        <>
          <circle cx="50" cy="46" r="16.5" fill="none" stroke="#ff3df0" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="34" cy="46" r="2.2" fill="#ff3df0" />
          <circle cx="66" cy="46" r="2.2" fill="#ff3df0" />
        </>
      )}
      <circle cx="50" cy="46" r={4 + tier} fill={p.main} />
      <circle cx="50" cy="46" r={1.6 + tier * 0.4} fill="#ffffff" opacity="0.9" />

      {/* stupeň v rámci třídy: šipky pod emblémem */}
      <g stroke={p.main} strokeWidth="3.5" strokeLinecap="round" fill="none">
        {Array.from({ length: sub }, (_, k) => (
          <path key={k} d={`M40 ${88 + k * 5.5} L50 ${92.5 + k * 5.5} L60 ${88 + k * 5.5}`} />
        ))}
      </g>
    </svg>
  );
}
