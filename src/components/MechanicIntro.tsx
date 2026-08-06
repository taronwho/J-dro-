import { useI18n } from '../i18n/i18n';
import { MECHANICS, type MechanicId } from '../meta/mechanics';
import { useBackLayer } from './backstack';
import { Icon } from './Icon';

interface MechanicIntroProps {
  ids: MechanicId[];
  onStart: () => void;
  onCancel: () => void;
}

// ---------- Malé ilustrace mechanik (viewBox 120×56) ----------
// Kreslené ve stylu hry: zakulacené dlaždice, svítící trubky.

function Tile({ x, y = 8, w = 34 }: { x: number; y?: number; w?: number }) {
  return <rect className="mi-tile" x={x} y={y} width={w} height={w} rx={7} />;
}

function Illustration({ id }: { id: MechanicId }) {
  switch (id) {
    case 'wrap':
      return (
        <svg viewBox="0 0 120 56" className="mi-art">
          <Tile x={6} />
          <Tile x={43} />
          <Tile x={80} />
          {/* trubka mizí vpravo a vrací se vlevo */}
          <path className="mi-pipe" d="M97 25h17" />
          <path className="mi-pipe" d="M6 25H23" />
          <path className="mi-pipe" d="M60 25h37" />
          <path className="mi-dash" d="M114 25c8-16-8-22-40-22S22 9 6 25" />
          <path className="mi-arrow" d="M6 25l5-4M6 25l5 4" />
        </svg>
      );
    case 'cores':
      return (
        <svg viewBox="0 0 120 56" className="mi-art">
          <path className="mi-pipe" d="M26 28h34M94 28H60M60 28v-8" />
          <circle className="mi-core c0" cx={20} cy={28} r={11} />
          <circle className="mi-core c1" cx={100} cy={28} r={11} />
          <circle className="mi-node" cx={60} cy={28} r={5} />
          <circle className="mi-node" cx={60} cy={17} r={3.5} />
        </svg>
      );
    case 'locked':
      return (
        <svg viewBox="0 0 120 56" className="mi-art">
          <Tile x={16} />
          <Tile x={70} />
          <path className="mi-pipe" d="M33 25h17M87 25h17" />
          {/* nýty + zámek na zamčené dlaždici */}
          {[[22, 14], [44, 14], [22, 36], [44, 36]].map(([cx, cy], i) => (
            <circle key={i} className="mi-rivet" cx={cx} cy={cy} r={2} />
          ))}
          <g className="mi-lock" transform="translate(27 17) scale(0.72)">
            <rect x={2} y={9} width={16} height={12} rx={2.5} />
            <path d="M6 9V6.5a4 4 0 0 1 8 0V9" />
          </g>
          <path className="mi-rot" d="M96 12a10 10 0 1 1-9 6" />
          <path className="mi-rot" d="M96 8v5h-5" />
        </svg>
      );
    case 'limit':
      return (
        <svg viewBox="0 0 120 56" className="mi-art">
          <rect className="mi-bar-bg" x={14} y={22} width={92} height={12} rx={6} />
          <rect className="mi-bar" x={14} y={22} width={30} height={12} rx={6} />
          <text className="mi-num" x={60} y={16}>
            8 / 12
          </text>
          <path className="mi-warn" d="M100 40v-4M100 45.5v.5" />
        </svg>
      );
    case 'targets':
      return (
        <svg viewBox="0 0 120 56" className="mi-art">
          <path className="mi-pipe c0" d="M26 18h32" />
          <path className="mi-pipe c1" d="M26 38h32" />
          <circle className="mi-core c0" cx={18} cy={18} r={9} />
          <circle className="mi-core c1" cx={18} cy={38} r={9} />
          {/* cíl se stejnou barvou svítí, s jinou ne */}
          <circle className="mi-ring c0 on" cx={70} cy={18} r={9} />
          <circle className="mi-ring c1 on" cx={70} cy={38} r={9} />
          <path className="mi-check" d="M86 18l4 4 7-8" />
          <path className="mi-check" d="M86 38l4 4 7-8" />
        </svg>
      );
    case 'walls':
      return (
        <svg viewBox="0 0 120 56" className="mi-art">
          <Tile x={16} />
          <Tile x={70} />
          {/* trubky míří na sebe, ale zeď je nespojí */}
          <path className="mi-pipe" d="M33 25h17M87 25H70" />
          <path className="mi-wall" d="M60 6v44" />
          <path className="mi-cross" d="M55 20l10 10M65 20l-10 10" />
        </svg>
      );
    case 'frozen':
      return (
        <svg viewBox="0 0 120 56" className="mi-art">
          <Tile x={8} />
          <Tile x={70} />
          <path className="mi-pipe c0" d="M8 25h34" />
          <g className="mi-snow" transform="translate(78 17)">
            <path d="M9 0v18M1 4.5l16 9M17 4.5l-16 9" />
          </g>
          <path className="mi-arrow-big" d="M50 25h14M64 25l-5-4M64 25l-5 4" />
        </svg>
      );
    case 'portals':
      return (
        <svg viewBox="0 0 120 56" className="mi-art">
          <Tile x={6} />
          <Tile x={80} />
          <path className="mi-pipe" d="M6 25h17M97 25h17" />
          <g className="mi-portal" transform="translate(34 15)">
            <circle cx={10} cy={10} r={9} />
            <circle cx={10} cy={10} r={4.5} />
          </g>
          <g className="mi-portal" transform="translate(66 15)">
            <circle cx={10} cy={10} r={9} />
            <circle cx={10} cy={10} r={4.5} />
          </g>
          <path className="mi-dash" d="M53 25h14" />
        </svg>
      );
  }
}

export function MechanicIntro({ ids, onStart, onCancel }: MechanicIntroProps) {
  const { t } = useI18n();
  useBackLayer(true, onCancel);

  return (
    <div className="modal-backdrop mi-backdrop">
      <div className="modal mi-modal">
        <p className="mi-kicker">
          {ids.length > 1 ? t('introTitleMulti') : t('introTitle')}
        </p>
        {ids.map((id) => {
          const def = MECHANICS[id];
          return (
            <section key={id} className={`mi-card ${def.color}`}>
              <Illustration id={id} />
              <h2 className="mi-title">{t(def.title)}</h2>
              <p className="mi-text">{t(def.text)}</p>
            </section>
          );
        })}
        <div className="mi-buttons">
          <button type="button" className="btn primary" onClick={onStart}>
            <Icon name="bolt" className="inline-icon" /> {t('introStart')}
          </button>
        </div>
      </div>
    </div>
  );
}
