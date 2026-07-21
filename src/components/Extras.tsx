import { useI18n } from '../i18n/i18n';
import { isHapticsSupported } from '../haptics';
import { LEVELS, PACK_LEVEL_TOTAL } from '../levels/levels';
import { ACHIEVEMENTS } from '../meta/achievements';
import { COLLECTIBLES, COLLECTION_SETS, setItems } from '../meta/collection';
import { currentRank } from '../meta/ranks';
import { THEMES } from '../meta/themes';
import type { Progress } from './App';
import { Icon, type IconName } from './Icon';

// ---------- Album součástek ----------

function CollectibleGlyph({ id }: { id: number }) {
  const glyphs = [
    // pojistka
    <g key="g"><rect x="5" y="9" width="14" height="6" rx="3" /><path d="M2 12h3M19 12h3M8 12h8" /></g>,
    // relé
    <g key="g"><rect x="4" y="6" width="16" height="12" rx="2" /><path d="M8 15l5-5M13 10h3" /><circle className="fill" cx="8" cy="15" r="1.3" /></g>,
    // kondenzátor
    <g key="g"><path d="M2 12h7M15 12h7M9 5v14M15 5v14" /></g>,
    // cívka
    <g key="g"><path d="M2 12h3M19 12h3M5 12a2.4 2.4 0 0 1 4.8 0 2.4 2.4 0 0 1 4.7 0 2.4 2.4 0 0 1 4.7 0" /></g>,
    // transformátor
    <g key="g"><path d="M7 5v14M9.5 5v14" /><path d="M2 8a2 2 0 0 1 4 0 2 2 0 0 1-4 0zm0 8a2 2 0 0 1 4 0 2 2 0 0 1-4 0z" /><path d="M18 8a2 2 0 0 1 4 0 2 2 0 0 1-4 0zm0 8a2 2 0 0 1 4 0 2 2 0 0 1-4 0z" /></g>,
    // dioda
    <g key="g"><path d="M2 12h5M17 12h5M7 6l10 6-10 6zM17 6v12" /></g>,
    // rezistor
    <g key="g"><path d="M2 12h3l2-5 3 10 3-10 3 10 2-5h4" /></g>,
    // jistič
    <g key="g"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 16l6-8" /><circle className="fill" cx="9" cy="16" r="1.4" /><circle className="fill" cx="15" cy="8" r="1.4" /></g>,
    // krystal
    <g key="g"><path d="M12 2l6 7-6 13-6-13z" /><path d="M6 9h12" /></g>,
    // supravodič
    <g key="g"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.4" /><circle className="fill" cx="18.5" cy="6" r="1.5" /></g>,
    // fúzní článek
    <g key="g"><path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z" /><circle className="fill" cx="12" cy="12" r="2.6" /><path d="M12 6v3M12 15v3M7 9.5l2.5 1.5M17 9.5 14.5 11" /></g>,
    // kvantový čip
    <g key="g"><rect x="6" y="6" width="12" height="12" rx="1.5" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /><circle className="fill" cx="12" cy="12" r="2" /></g>,
  ];
  return (
    <svg viewBox="0 0 24 24" className="collect-glyph">
      {glyphs[id]}
    </svg>
  );
}

export function CollectionModal({
  progress,
  onClose,
}: {
  progress: Progress;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          <Icon name="album" className="c-violet heading-icon" /> {t('albumTitle')}
        </h2>
        <p className="album-what">{t('albumWhat')}</p>
        <p className="story-intro">{t('albumHint')}</p>
        <div className="collect-sets">
          {COLLECTION_SETS.map((set) => {
            const items = setItems(set.id);
            const claimed = progress.setsClaimed.includes(set.id);
            return (
              <section key={set.id} className="collect-set">
                <header>
                  <strong>{set.name[lang]}</strong>
                  <span className={claimed ? 'ach-reward' : 'story-pct'}>
                    {claimed ? '✓ ' : ''}
                    {t('rewardHint', { n: set.reward })}
                  </span>
                </header>
                <div className="collect-grid">
                  {items.map((item) => {
                    const owned = progress.collection.includes(item.id);
                    return (
                      <div key={item.id} className={owned ? 'collect-item owned' : 'collect-item'}>
                        <CollectibleGlyph id={item.id} />
                        <small>{owned ? item.name[lang] : '???'}</small>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
        <button type="button" className="btn" onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </div>
  );
}

// ---------- Témata ----------

export function ThemeModal({
  progress,
  theme,
  onSetTheme,
  onClose,
}: {
  progress: Progress;
  theme: string;
  onSetTheme: (id: string) => void;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  const rank = currentRank(
    Object.values(progress.best).reduce((s, b) => s + b.stars, 0),
  ).rank;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          <Icon name="palette" className="c-magenta heading-icon" /> {t('themesTitle')}
        </h2>
        <ul className="theme-list">
          {THEMES.map((th) => {
            const unlocked = rank >= th.minRank;
            const active = theme === th.id;
            return (
              <li key={th.id}>
                <button
                  type="button"
                  className={
                    active ? 'theme-row active' : unlocked ? 'theme-row' : 'theme-row locked'
                  }
                  disabled={!unlocked}
                  onClick={() => onSetTheme(th.id)}
                >
                  <span className="theme-dots">
                    {th.colors.map((c) => (
                      <i key={c} style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
                    ))}
                  </span>
                  <strong>{th.name[lang]}</strong>
                  <small>
                    {active
                      ? '✓'
                      : unlocked
                        ? ''
                        : t('themeLocked', { n: th.minRank })}
                  </small>
                </button>
              </li>
            );
          })}
        </ul>
        <button type="button" className="btn" onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </div>
  );
}

// ---------- Denní kalendář + zmrazení ----------

export function CalendarModal({
  progress,
  onBuyFreeze,
  onReplayDay,
  onClose,
}: {
  progress: Progress;
  onBuyFreeze: () => void;
  onReplayDay: (date: string) => void;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (first.getDay() + 6) % 7; // pondělí = 0
  const doneSet = new Set(progress.daily.dates);
  const monthLabel = now.toLocaleDateString(
    lang === 'cs' ? 'cs-CZ' : lang === 'de' ? 'de-DE' : 'en-GB',
    { month: 'long', year: 'numeric' },
  );
  const todayDay = now.getDate();
  const iso = (day: number): string =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          <Icon name="calendar" className="c-cyan heading-icon" /> {t('calendarTitle')}
        </h2>
        <p className="story-intro cal-month">{monthLabel}</p>
        <div className="cal-grid">
          {Array.from({ length: startOffset }, (_, i) => (
            <span key={`e${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const done = doneSet.has(iso(day));
            const today = day === todayDay;
            const playable = day <= todayDay; // dnešek i minulé dny lze přehrát
            const cls = done
              ? 'cal-day done'
              : today
                ? 'cal-day today'
                : 'cal-day';
            if (!playable) {
              return (
                <span key={day} className={cls}>
                  {day}
                </span>
              );
            }
            return (
              <button
                key={day}
                type="button"
                className={`${cls} playable`}
                onClick={() => onReplayDay(iso(day))}
                aria-label={`${t('dailyReplayTitle', { d: String(day) })}`}
              >
                {done ? <Icon name="check" /> : day}
              </button>
            );
          })}
        </div>
        <p className="cal-replay-hint">{t('calReplayHint')}</p>
        <div className="freeze-box">
          <span className="freeze-count">
            <Icon name="shield" className="c-cyan" /> ×{progress.freezes}
          </span>
          <div className="freeze-text">
            <strong>{t('freezeTitle')}</strong>
            <small>{t('freezeDesc')}</small>
          </div>
          <button
            type="button"
            className="btn"
            disabled={progress.hints < 3 || progress.freezes >= 3}
            onClick={onBuyFreeze}
          >
            {t('freezeBuy', { n: 3 })}
          </button>
        </div>
        <button type="button" className="btn" onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </div>
  );
}

// ---------- Nastavení (zvuk / vibrace / animace) ----------

function Switch({ on }: { on: boolean }) {
  return (
    <span className={on ? 'switch on' : 'switch'} aria-hidden="true">
      <i />
    </span>
  );
}

export function SettingsModal({
  soundOn,
  onSoundToggle,
  hapticsOn,
  onHapticsToggle,
  reducedMotion,
  onMotionToggle,
  onClose,
}: {
  soundOn: boolean;
  onSoundToggle: () => void;
  hapticsOn: boolean;
  onHapticsToggle: () => void;
  reducedMotion: boolean;
  onMotionToggle: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const hapticsSupported = isHapticsSupported();
  const rows: {
    icon: IconName;
    label: string;
    desc: string;
    on: boolean;
    toggle: () => void;
    disabled?: boolean;
  }[] = [
    {
      icon: soundOn ? 'sound' : 'soundOff',
      label: t('soundLabel'),
      desc: t('setSoundDesc'),
      on: soundOn,
      toggle: onSoundToggle,
    },
    {
      icon: 'vibrate',
      label: t('setHaptics'),
      desc: hapticsSupported ? t('setHapticsDesc') : t('setHapticsUnsupported'),
      on: hapticsOn && hapticsSupported,
      toggle: onHapticsToggle,
      disabled: !hapticsSupported,
    },
    {
      icon: 'bolt',
      label: t('setMotion'),
      desc: t('setMotionDesc'),
      on: reducedMotion,
      toggle: onMotionToggle,
    },
  ];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          <Icon name="gear" className="c-cyan heading-icon" /> {t('settingsTitle')}
        </h2>
        <ul className="settings-list">
          {rows.map((r) => (
            <li key={r.label}>
              <button
                type="button"
                className="settings-row"
                onClick={r.toggle}
                disabled={r.disabled}
              >
                <span className="settings-ic">
                  <Icon name={r.icon} />
                </span>
                <span className="settings-text">
                  <strong>{r.label}</strong>
                  <small>{r.desc}</small>
                </span>
                <Switch on={r.on} />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn" onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </div>
  );
}

// ---------- Statistiky ----------

export function StatsModal({
  progress,
  onClose,
}: {
  progress: Progress;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const totalLevels = LEVELS.length + PACK_LEVEL_TOTAL;
  const bestEntries = Object.values(progress.best);
  const starsSum = bestEntries.reduce((s, b) => s + b.stars, 0);
  const perfect = bestEntries.filter((b) => b.stars === 3).length;
  const avg =
    bestEntries.length > 0 ? (starsSum / bestEntries.length).toFixed(2) : '0';

  const cards: { icon: IconName; color: string; label: string; value: string }[] = [
    {
      icon: 'bolt',
      color: 'c-cyan',
      label: t('statSolved'),
      value: `${progress.completed.length} / ${totalLevels}`,
    },
    {
      icon: 'star',
      color: 'c-gold',
      label: t('statTotalStars'),
      value: `${starsSum} / ${totalLevels * 3}`,
    },
    {
      icon: 'star',
      color: 'c-gold',
      label: t('statPerfect'),
      value: String(perfect),
    },
    {
      icon: 'chart',
      color: 'c-cyan',
      label: t('statAvgStars'),
      value: avg,
    },
    {
      icon: 'flame',
      color: 'c-flame',
      label: t('statStreak'),
      value: String(progress.bestStreak),
    },
    {
      icon: 'calendar',
      color: 'c-cyan',
      label: t('statDailyStreak'),
      value: String(progress.daily.streak),
    },
    {
      icon: 'calendar',
      color: 'c-cyan',
      label: t('statDailyTotal'),
      value: String(progress.daily.total),
    },
    {
      icon: 'infinity',
      color: 'c-magenta',
      label: t('statEndless'),
      value: String(progress.endless.total),
    },
    {
      icon: 'moon',
      color: 'c-dim',
      label: t('statBlackout'),
      value: String(progress.blackout.total),
    },
    {
      icon: 'timer',
      color: 'c-flame',
      label: t('statRushBest'),
      value: String(progress.rush.best),
    },
    {
      icon: 'album',
      color: 'c-violet',
      label: t('statCollected'),
      value: `${progress.collection.length} / ${COLLECTIBLES.length}`,
    },
    {
      icon: 'trophy',
      color: 'c-gold',
      label: t('statAchievements'),
      value: `${progress.achievements.length} / ${ACHIEVEMENTS.length}`,
    },
  ];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          <Icon name="chart" className="c-gold heading-icon" /> {t('statsTitle')}
        </h2>
        <div className="stats-grid">
          {cards.map((c) => (
            <div key={c.label} className="stat-card">
              <span className={`stat-card-ic ${c.color}`}>
                <Icon name={c.icon} />
              </span>
              <strong>{c.value}</strong>
              <small>{c.label}</small>
            </div>
          ))}
        </div>
        <button type="button" className="btn" onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </div>
  );
}
