import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/i18n';
import { CHAPTER_SIZE, LEVELS } from '../levels/levels';
import { SECTOR_STORIES, STORY_INTRO } from '../meta/story';
import type { Progress } from './App';
import { useBackLayer } from './backstack';
import { Icon } from './Icon';

// ---------- Celoobrazovková kampaňová mapa planety Kora ----------
// Vertikální cesta zdola (Okraj města) nahoru (Polární stanice).
// Ručně kreslená vektorová scenérie: moře, městské bloky, továrny,
// kaňon s krystaly, metropole, hory s vysílači, ledovec s polární září.

interface MapViewProps {
  progress: Progress;
  onSelect: (id: number) => void;
  onClose: () => void;
  // cinematický režim po dokončení sektoru: hráč sklouzne z „from" do „to"
  journey?: { from: number; to: number; onContinue: () => void } | null;
  reducedMotion?: boolean;
}

function sectorStars(progress: Progress, sector: number): number {
  const from = (sector - 1) * CHAPTER_SIZE;
  return LEVELS.slice(from, from + CHAPTER_SIZE).reduce(
    (sum, { id }) => sum + (progress.best[id]?.stars ?? 0),
    0,
  );
}

function sectorCompleted(progress: Progress, sector: number): number {
  const from = (sector - 1) * CHAPTER_SIZE;
  return LEVELS.slice(from, from + CHAPTER_SIZE).filter(({ id }) =>
    progress.completed.includes(id),
  ).length;
}

// hladká cesta mezi uzly (kubické křivky se svislými tečnami)
function routeSegment(x1: number, y1: number, x2: number, y2: number): string {
  const bend = (y1 - y2) * 0.55;
  return `M ${x1} ${y1} C ${x1} ${y1 - bend}, ${x2} ${y2 + bend}, ${x2} ${y2}`;
}

export function MapView({
  progress,
  onSelect,
  onClose,
  journey = null,
  reducedMotion = false,
}: MapViewProps) {
  const { lang, t } = useI18n();
  const [selected, setSelected] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const max = CHAPTER_SIZE * 3;
  const stars = SECTOR_STORIES.map((s) => sectorStars(progress, s.sector));
  const pcts = stars.map((v) => v / max);
  const doneCounts = SECTOR_STORIES.map((s) => sectorCompleted(progress, s.sector));
  const unlockedSector = SECTOR_STORIES.map(
    (s) => progress.allUnlocked || progress.unlocked >= (s.sector - 1) * CHAPTER_SIZE + 1,
  );
  const complete = doneCounts.map((c) => c >= CHAPTER_SIZE);
  // aktuální sektor: první odemčený nedokončený
  const currentIdx = complete.findIndex((c, i) => !c && unlockedSector[i]);

  // po otevření sjeď na aktuální sektor (nebo na cestu v cinematickém režimu)
  useEffect(() => {
    const el = scrollRef.current;
    if (el === null) return;
    let y: number;
    if (journey !== null) {
      const a = SECTOR_STORIES[journey.from - 1];
      const b = SECTOR_STORIES[journey.to - 1];
      y = a && b ? (a.y + b.y) / 2 / 220 : 0.5;
    } else {
      const idx = currentIdx === -1 ? SECTOR_STORIES.length - 1 : currentIdx;
      y = SECTOR_STORIES[idx].y / 220;
    }
    el.scrollTop = Math.max(0, y * el.scrollHeight - el.clientHeight * 0.5);
  }, [currentIdx, journey]);

  // Zpět zavře panel sektoru dřív, než celou mapu
  useBackLayer(selected !== null, () => setSelected(null));

  const sel = selected === null ? null : SECTOR_STORIES[selected];

  return (
    <div className="mapview">
      <header className="mapview-head">
        <button type="button" className="btn icon-btn" onClick={onClose} aria-label={t('back')}>
          <Icon name="back" />
        </button>
        <span className="mapview-title">{t('mapTitle')}</span>
        <span className="mapview-stars">
          <span className="star filled">
            <Icon name="star" />
          </span>{' '}
          {stars.reduce((a, b) => a + b, 0)} / {max * 6}
        </span>
      </header>

      <div className="mapview-scroll" ref={scrollRef}>
        <svg className="kora" viewBox="0 0 100 220" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="kbg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b1526" />
              <stop offset="35%" stopColor="#0a0e1c" />
              <stop offset="75%" stopColor="#0a0a14" />
              <stop offset="100%" stopColor="#061018" />
            </linearGradient>
            <linearGradient id="ksea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a1a30" />
              <stop offset="100%" stopColor="#04101e" />
            </linearGradient>
            <linearGradient id="kice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c3a52" />
              <stop offset="100%" stopColor="#0e1e33" />
            </linearGradient>
            <linearGradient id="kaurora1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22e0ff" stopOpacity="0" />
              <stop offset="50%" stopColor="#4dff9e" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#b26bff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="kaurora2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#b26bff" stopOpacity="0" />
              <stop offset="50%" stopColor="#22e0ff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4dff9e" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="kglow-cyan" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22e0ff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#22e0ff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="kglow-amber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffb52e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffb52e" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="kglow-magenta" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff3df0" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ff3df0" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* pozadí a hvězdy */}
          <rect width="100" height="220" fill="url(#kbg)" />
          {[
            [8, 8], [22, 4], [37, 12], [55, 6], [72, 10], [88, 5], [94, 16],
            [14, 22], [46, 20], [80, 24], [65, 15], [28, 16], [92, 34], [6, 38],
          ].map(([x, y], i) => (
            <circle key={`s${i}`} cx={x} cy={y} r={i % 3 === 0 ? 0.5 : 0.3} className="k-star" />
          ))}

          {/* polární záře */}
          <path d="M10 14 Q 35 4 60 12 T 96 8 L 96 18 Q 65 24 40 18 T 10 22 Z" fill="url(#kaurora1)" className="k-aurora a1" />
          <path d="M4 24 Q 30 16 58 22 T 98 20 L 98 28 Q 62 34 36 28 T 4 32 Z" fill="url(#kaurora2)" className="k-aurora a2" />

          {/* moře dole s vlnami a molem */}
          <rect x="0" y="196" width="100" height="24" fill="url(#ksea)" />
          {[201, 206, 211, 216].map((y, i) => (
            <path
              key={`w${i}`}
              d={`M -4 ${y} q 6 ${i % 2 ? 1.6 : -1.6} 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0`}
              className="k-wave"
            />
          ))}
          <rect x="24" y="197" width="14" height="1.2" className="k-pier" />
          <rect x="30" y="197" width="1" height="5" className="k-pier" />

          {/* ledová čepice nahoře */}
          <path d="M0 34 Q 18 26 38 30 T 74 26 T 100 32 L 100 0 L 0 0 Z" fill="url(#kice)" />
          <path d="M0 34 Q 18 26 38 30 T 74 26 T 100 32" className="k-iceline" />

          {/* pevnina: jemné vrstevnice */}
          <path d="M6 190 Q 30 176 24 160 T 40 128 T 30 100 T 58 70 T 46 44" className="k-contour" />
          <path d="M94 186 Q 70 172 78 154 T 60 122 T 74 92 T 50 62 T 68 40" className="k-contour" />

          {/* ---- Sektor 1: pobřežní čtvrť ---- */}
          <g className="k-scene">
            <circle cx="30" cy="192" r="14" fill="url(#kglow-cyan)" opacity={0.3 + 0.7 * pcts[0]} />
            {[[20, 187, 4, 5], [26, 185, 3, 7], [31, 186, 4, 6], [37, 188, 3, 4], [42, 186, 4, 6]].map(([x, y, w, h], i) => (
              <g key={`c1${i}`}>
                <rect x={x} y={y} width={w} height={h} className="k-bld" />
                <rect x={x + 0.7} y={y + 1} width={0.9} height={0.9} className={pcts[0] > i / 5 ? 'k-win on' : 'k-win'} />
                <rect x={x + w - 1.6} y={y + 2.4} width={0.9} height={0.9} className={pcts[0] > (i + 0.5) / 5 ? 'k-win on' : 'k-win'} />
              </g>
            ))}
          </g>

          {/* ---- Sektor 2: továrny ---- */}
          <g className="k-scene">
            <circle cx="68" cy="159" r="14" fill="url(#kglow-amber)" opacity={0.3 + 0.7 * pcts[1]} />
            {[[58, 154], [67, 152], [76, 155]].map(([x, y], i) => (
              <g key={`f${i}`}>
                <path d={`M${x} ${y + 8} v-5 l3 2 v-2 l3 2 v-2 l3 2 v3 z`} className="k-bld" />
                <rect x={x + 1} y={y - 2} width={1.4} height={5} className="k-bld" />
                <path d={`M${x + 1.7} ${y - 3} q 1 -1.5 0 -3 q -1 -1.5 0 -3`} className="k-smoke" />
                <rect x={x + 4.5} y={y + 4.5} width={1.1} height={1.1} className={pcts[1] > i / 3 ? 'k-win amber on' : 'k-win'} />
                <rect x={x + 6.5} y={y + 4.5} width={1.1} height={1.1} className={pcts[1] > (i + 0.5) / 3 ? 'k-win amber on' : 'k-win'} />
              </g>
            ))}
          </g>

          {/* ---- Sektor 3: kaňon s krystaly ---- */}
          <g className="k-scene">
            <circle cx="28" cy="125" r="14" fill="url(#kglow-magenta)" opacity={0.3 + 0.7 * pcts[2]} />
            <path d="M14 132 L 22 118 L 30 132 Z M 26 133 L 34 117 L 42 133 Z" className="k-canyon" />
            {[[19, 126, 2.4], [30, 124, 3], [38, 127, 2]].map(([x, y, s], i) => (
              <path
                key={`k${i}`}
                d={`M${x} ${y} l ${s * 0.5} ${-s * 1.4} l ${s * 0.5} ${s * 1.4} l ${-s * 0.5} ${s * 0.8} z`}
                className={pcts[2] > i / 3 ? 'k-crystal on' : 'k-crystal'}
              />
            ))}
          </g>

          {/* ---- Sektor 4: metropole ---- */}
          <g className="k-scene">
            <circle cx="63" cy="93" r="16" fill="url(#kglow-cyan)" opacity={0.3 + 0.7 * pcts[3]} />
            {[[52, 88, 3, 8], [56, 84, 3.4, 12], [60.5, 86, 3, 10], [64.5, 82, 3.6, 14], [69, 87, 3, 9], [73, 89, 3, 7]].map(
              ([x, y, w, h], i) => (
                <g key={`m${i}`}>
                  <rect x={x} y={y} width={w} height={h} className="k-bld tall" />
                  {[0, 1, 2].map((r) => (
                    <rect
                      key={r}
                      x={x + 0.6}
                      y={y + 1.2 + r * 2.6}
                      width={w - 1.2}
                      height={0.8}
                      className={pcts[3] > (i + r) / 8 ? 'k-win on' : 'k-win'}
                    />
                  ))}
                </g>
              ),
            )}
            <circle cx="65" cy="80" r="1" className={pcts[3] >= 1 ? 'k-beacon on' : 'k-beacon'} />
          </g>

          {/* ---- Sektor 5: hory s vysílači ---- */}
          <g className="k-scene">
            <path d="M18 70 L 30 52 L 40 66 L 50 48 L 62 68" className="k-ridge far" />
            <path d="M12 74 L 26 58 L 36 70 L 48 54 L 58 72 L 68 60 L 78 74" className="k-ridge" />
            {[[30, 52], [48, 54]].map(([x, y], i) => (
              <g key={`t${i}`}>
                <path d={`M${x - 1.6} ${y} L ${x} ${y - 5} L ${x + 1.6} ${y} Z`} className="k-tower" />
                <line x1={x} y1={y - 5} x2={x} y2={y - 7} className="k-tower" />
                <circle cx={x} cy={y - 7.4} r="0.7" className={pcts[4] > i / 2 ? 'k-blink on' : 'k-blink'} />
              </g>
            ))}
          </g>

          {/* ---- Sektor 6: polární stanice ---- */}
          <g className="k-scene">
            <circle cx="60" cy="24" r="13" fill="url(#kglow-cyan)" opacity={0.3 + 0.7 * pcts[5]} />
            <path d="M52 28 a 8 8 0 0 1 16 0 z" className="k-dome" />
            <line x1="60" y1="20" x2="60" y2="14" className="k-tower" />
            <circle cx="60" cy="13.4" r="0.7" className={pcts[5] >= 1 ? 'k-blink on' : 'k-blink'} />
            <rect x="70" y="25" width="5" height="3" className="k-bld" />
          </g>

          {/* ---- Trasa mezi sektory ---- */}
          {SECTOR_STORIES.slice(0, -1).map((s, i) => {
            const nxt = SECTOR_STORIES[i + 1];
            const d = routeSegment(s.x, s.y, nxt.x, nxt.y);
            const lit = complete[i];
            return (
              <g key={`r${i}`}>
                <path d={d} className="k-route casing" />
                <path d={d} className={lit ? 'k-route lit' : 'k-route dim'} />
                {lit && <path d={d} className="k-route pulse" />}
              </g>
            );
          })}

          {/* ---- Uzly sektorů ---- */}
          {SECTOR_STORIES.map((s, i) => {
            const unlocked = unlockedSector[i];
            const isCurrent = i === currentIdx;
            return (
              <g
                key={s.sector}
                className={unlocked ? 'k-node-g' : 'k-node-g locked'}
                onClick={() => journey === null && unlocked && setSelected(i)}
              >
                {isCurrent && <circle cx={s.x} cy={s.y} r="8.5" className="k-halo" />}
                <circle cx={s.x} cy={s.y} r="6.4" className="k-node-bg" />
                {/* prstenec postupu */}
                <circle
                  cx={s.x}
                  cy={s.y}
                  r="6.4"
                  className={complete[i] ? 'k-ring full' : 'k-ring'}
                  pathLength={100}
                  strokeDasharray={`${Math.max(pcts[i] * 100, 2)} 100`}
                  transform={`rotate(-90 ${s.x} ${s.y})`}
                />
                <circle cx={s.x} cy={s.y} r="4.6" className="k-node-inner" />
                {unlocked ? (
                  <text x={s.x} y={s.y + 1.7} className="k-node-num">
                    {s.sector}
                  </text>
                ) : (
                  <g
                    className="k-node-lock"
                    transform={`translate(${s.x - 1.7} ${s.y - 2}) scale(0.16)`}
                  >
                    <rect x="2" y="10" width="18" height="12" rx="2.5" />
                    <path d="M6 10V7a5 5 0 0 1 10 0v3" fill="none" />
                  </g>
                )}
              </g>
            );
          })}

          {/* ---- Cinematika: jádro-hráč klouže po trase k dalšímu sektoru ---- */}
          {journey !== null &&
            (() => {
              const a = SECTOR_STORIES[journey.from - 1];
              const b = SECTOR_STORIES[journey.to - 1];
              if (a === undefined || b === undefined) return null;
              const d = routeSegment(a.x, a.y, b.x, b.y);
              return (
                <g>
                  <path
                    d={d}
                    className={reducedMotion ? 'k-journey-route done' : 'k-journey-route'}
                    pathLength={100}
                  />
                  {reducedMotion ? (
                    <circle cx={b.x} cy={b.y} r="2.8" className="k-journey-dot" />
                  ) : (
                    <g className="k-journey-marker">
                      <circle r="2.8" />
                      <animateMotion dur="1.9s" begin="0.2s" fill="freeze" path={d} />
                    </g>
                  )}
                </g>
              );
            })()}
        </svg>

        {journey === null && <p className="mapview-intro">{STORY_INTRO[lang]}</p>}
      </div>

      {journey !== null && (
        <div className="mapview-journey-bar">
          <button type="button" className="btn primary" onClick={journey.onContinue}>
            {t('continue')}
          </button>
          <button type="button" className="btn" onClick={onClose}>
            {t('menu')}
          </button>
        </div>
      )}

      {/* panel vybraného sektoru */}
      {sel !== null && selected !== null && (
        <div className="sector-sheet-backdrop" onClick={() => setSelected(null)}>
          <div className="sector-sheet" onClick={(e) => e.stopPropagation()}>
            <header>
              <strong>
                {sel.sector}. {sel.name[lang]}
              </strong>
              <span className="chapter-stars">
                <span className="star filled">
                  <Icon name="star" />
                </span>{' '}
                {stars[selected]} / {max}
              </span>
            </header>
            <p className="sector-story">{sel.text[lang]}</p>
            <div className="level-grid">
              {LEVELS.slice(
                (sel.sector - 1) * CHAPTER_SIZE,
                sel.sector * CHAPTER_SIZE,
              ).map(({ id, movesMargin, wrap }) => {
                const done = progress.completed.includes(id);
                const isUnlocked = id <= progress.unlocked || progress.allUnlocked;
                const cls = done
                  ? 'level-btn done'
                  : isUnlocked
                    ? 'level-btn open'
                    : 'level-btn';
                return (
                  <button
                    key={id}
                    type="button"
                    className={cls}
                    disabled={!isUnlocked}
                    onClick={() => onSelect(id)}
                    aria-label={isUnlocked ? t('level', { n: id }) : t('ariaLockedLevel')}
                  >
                    {movesMargin !== undefined && <span className="badge-limit" />}
                    {wrap && <span className="badge-wrap" aria-hidden="true" />}
                    <span className="level-num">{id}</span>
                    {done && (
                      <span className="lvl-stars" aria-hidden="true">
                        {[1, 2, 3].map((k) => (
                          <span
                            key={k}
                            className={
                              k <= (progress.best[id]?.stars ?? 1) ? 'star filled' : 'star'
                            }
                          >
                            <Icon name="star" />
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
