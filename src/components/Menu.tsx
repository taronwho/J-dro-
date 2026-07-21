import { useState } from 'react';
import { LANGS, useI18n, type TKey } from '../i18n/i18n';
import {
  CHAPTER_COUNT,
  CHAPTER_SIZE,
  LEVELS,
  PACKS,
  PACK_LEVEL_TOTAL,
  type PackId,
} from '../levels/levels';
import { ACHIEVEMENTS, totalStars } from '../meta/achievements';
import { EVENT_REWARD_HINTS, isWeekend, weekendEvent } from '../meta/events';
import { currentRank, nextRank, RANKS } from '../meta/ranks';
import type { Progress } from './App';
import { CalendarModal, CollectionModal, SettingsModal, StatsModal, ThemeModal } from './Extras';
import { MapView } from './MapView';
import { Flag } from './Flag';
import type { HelpSection } from './Help';
import { Icon, type IconName } from './Icon';
import { RankBadge } from './RankBadge';

interface MenuProps {
  progress: Progress;
  theme: string;
  onSelect: (id: number) => void;
  onSelectPack: (packId: PackId, index: number) => void;
  onDaily: () => void;
  onReplayDay: (date: string) => void;
  onEndless: () => void;
  onBlackout: () => void;
  onRush: () => void;
  onEvent: (index: number) => void;
  onBuyFreeze: () => void;
  onSetTheme: (id: string) => void;
  onHelp: (section: HelpSection | null) => void;
  soundOn: boolean;
  onSoundToggle: () => void;
  hapticsOn: boolean;
  onHapticsToggle: () => void;
  reducedMotion: boolean;
  onMotionToggle: () => void;
}

const PACK_META: Record<PackId, { name: TKey; icon: IconName; color: string; help: HelpSection }> = {
  colors: { name: 'packColors', icon: 'cores', color: 'c-magenta', help: 'targets' },
  maze: { name: 'packMaze', icon: 'wall', color: 'c-dim', help: 'walls' },
  ice: { name: 'packIce', icon: 'snowflake', color: 'c-cyan', help: 'frozen' },
  portals: { name: 'packPortals', icon: 'portal', color: 'c-violet', help: 'portals' },
};

function Stars({ count }: { count: number }) {
  return (
    <span className="lvl-stars" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= count ? 'star filled' : 'star'}>
          <Icon name="star" />
        </span>
      ))}
    </span>
  );
}

function isoToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function Menu({
  progress,
  theme,
  onSelect,
  onSelectPack,
  onDaily,
  onReplayDay,
  onEndless,
  onBlackout,
  onRush,
  onEvent,
  onBuyFreeze,
  onSetTheme,
  onHelp,
  soundOn,
  onSoundToggle,
  hapticsOn,
  onHapticsToggle,
  reducedMotion,
  onMotionToggle,
}: MenuProps) {
  const { lang, setLang, t } = useI18n();
  const [showAchievements, setShowAchievements] = useState(false);
  const [showRanks, setShowRanks] = useState(false);
  const [modesModalOpen, setModesModalOpen] = useState(false);
  const [openPack, setOpenPack] = useState<PackId | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const weekend = isWeekend(new Date());
  const event = weekendEvent(new Date());
  const eventState =
    progress.event.week === event.weekId
      ? progress.event
      : { week: event.weekId, done: [] as number[], claimed: false };
  const stars = totalStars(progress);
  const totalLevels = LEVELS.length + PACK_LEVEL_TOTAL;
  const maxStars = totalLevels * 3;
  const dailyDoneToday = progress.daily.last === isoToday();
  const rank = currentRank(stars);
  const upcoming = nextRank(stars);
  const progressPct =
    upcoming === null
      ? 100
      : Math.round(
          ((stars - rank.threshold) / (upcoming.threshold - rank.threshold)) * 100,
        );

  return (
    <div className="menu">
      <div className="lang-switch" role="group">
        <div className="lang-select">
          <button
            type="button"
            className="lang-current"
            onClick={() => setLangOpen((o) => !o)}
            aria-label={t('langLabel')}
            aria-expanded={langOpen}
          >
            <Flag lang={lang} />
            <span className="lang-caret">{langOpen ? '▴' : '▾'}</span>
          </button>
          {langOpen && (
            <div className="lang-menu">
              {LANGS.map((code) => (
                <button
                  key={code}
                  type="button"
                  className={code === lang ? 'lang-opt active' : 'lang-opt'}
                  onClick={() => {
                    setLang(code);
                    setLangOpen(false);
                  }}
                >
                  <Flag lang={code} />
                  <span>{code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="lang-btn help-open"
          onClick={onSoundToggle}
          aria-label={t('soundLabel')}
        >
          <Icon name={soundOn ? 'sound' : 'soundOff'} />
        </button>
        <button
          type="button"
          className="lang-btn help-open"
          onClick={() => setShowSettings(true)}
          aria-label={t('settingsTitle')}
        >
          <Icon name="gear" />
        </button>
        <button
          type="button"
          className="lang-btn help-open"
          onClick={() => onHelp(null)}
          aria-label={t('helpTitle')}
        >
          <Icon name="help" />
        </button>
      </div>
      <h1 className="title">CORE</h1>
      <p className="tagline">{t('tagline')}</p>

      <div className="stats-row">
        <button
          type="button"
          className="stat-chip stat-btn c-gold"
          onClick={() => onHelp('target')}
        >
          <Icon name="star" className="chip-icon" /> {stars} / {maxStars}
        </button>
        <button
          type="button"
          className="stat-chip stat-btn c-amber"
          onClick={() => onHelp('hints')}
        >
          <Icon name="bulb" className="chip-icon" /> {progress.hints}
        </button>
        <button
          type="button"
          className="stat-chip stat-btn c-cyan"
          onClick={() => onHelp('goal')}
        >
          <Icon name="bolt" className="chip-icon" /> {progress.completed.length} /{' '}
          {totalLevels}
        </button>
        <button
          type="button"
          className="stat-chip stat-btn c-flame"
          onClick={() => onHelp('streak')}
        >
          <Icon name="flame" className="chip-icon" /> {progress.bestStreak}
        </button>
        <button
          type="button"
          className="stat-chip stat-btn c-gold"
          onClick={() => setShowAchievements(true)}
        >
          <Icon name="trophy" className="chip-icon" /> {progress.achievements.length} /{' '}
          {ACHIEVEMENTS.length}
        </button>
      </div>

      {/* karta hodnosti hráče */}
      <button type="button" className="rank-card" onClick={() => setShowRanks(true)}>
        <RankBadge rank={rank.rank} className="rank-card-badge" />
        <span className="rank-card-text">
          <small>
            {t('rankTitle')} {rank.rank} / {RANKS.length}
          </small>
          <strong>{rank.name[lang]}</strong>
          <span className="rank-bar">
            <span className="rank-bar-fill" style={{ width: `${progressPct}%` }} />
          </span>
          <small>
            {upcoming === null
              ? t('rankMax')
              : t('rankProgress', { n: upcoming.threshold - stars })}
          </small>
        </span>
      </button>

      {/* denní výzva — vždy viditelná (ritual) */}
      <div className="daily-card">
        <button type="button" className="daily-main" onClick={onDaily}>
          <span className="mode-icon c-cyan">
            <Icon name="calendar" />
          </span>
          <span className="mode-text">
            <strong>{t('dailyTitle')}</strong>
            <small>
              {dailyDoneToday ? (
                <>
                  <Icon name="check" className="inline-icon c-cyan" /> {t('dailyDone')}
                </>
              ) : (
                <>
                  <Icon name="flame" className="inline-icon c-flame" />{' '}
                  {progress.daily.streak}
                </>
              )}
              {progress.freezes > 0 && (
                <>
                  {' '}
                  · <Icon name="shield" className="inline-icon c-cyan" />{' '}
                  {progress.freezes}
                </>
              )}
            </small>
          </span>
        </button>
        <button
          type="button"
          className="daily-cal"
          onClick={() => setShowCalendar(true)}
          aria-label={t('calendarTitle')}
        >
          <Icon name="calendar" />
        </button>
      </div>

      {/* víkendový event */}
      {weekend && (
        <div className="event-card">
          <header>
            <Icon name="gift" className="inline-icon c-gold" />{' '}
            <strong>{event.name[lang]}</strong>
          </header>
          <div className="event-levels">
            {[1, 2, 3].map((i) => {
              const done = eventState.done.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  className={done ? 'level-btn done' : 'level-btn open'}
                  onClick={() => onEvent(i)}
                >
                  {done ? <Icon name="check" /> : i}
                </button>
              );
            })}
          </div>
          <small>
            {eventState.claimed
              ? t('eventClaimed', { n: EVENT_REWARD_HINTS })
              : t('eventReward', { n: EVENT_REWARD_HINTS })}
          </small>
        </div>
      )}

      {/* dlaždice: mapa příběhu, album, témata */}
      <div className="menu-tiles">
        <button type="button" className="menu-tile c-cyan" onClick={() => setShowMap(true)}>
          <Icon name="map" />
          <small>{t('mapTitle')}</small>
        </button>
        <button
          type="button"
          className="menu-tile c-violet"
          onClick={() => setShowAlbum(true)}
        >
          <Icon name="album" />
          <small>{t('albumTitle')}</small>
        </button>
        <button
          type="button"
          className="menu-tile c-magenta"
          onClick={() => setShowThemes(true)}
        >
          <Icon name="palette" />
          <small>{t('themesTitle')}</small>
        </button>
        <button
          type="button"
          className="menu-tile c-gold"
          onClick={() => setShowStats(true)}
        >
          <Icon name="chart" />
          <small>{t('statsTitle')}</small>
        </button>
      </div>

      {/* spouštěč režimů a výzev — otevře modal, nerozhrne kampaň */}
      <button
        type="button"
        className="modes-toggle"
        onClick={() => {
          setOpenPack(null);
          setModesModalOpen(true);
        }}
      >
        <Icon name="infinity" className="inline-icon c-magenta" /> {t('moreModes')}
        <span className="modes-arrow">▾</span>
      </button>

      <h2 className="menu-section">{t('campaignTitle')}</h2>
      {Array.from({ length: CHAPTER_COUNT }, (_, c) => {
        const from = c * CHAPTER_SIZE + 1;
        const to = from + CHAPTER_SIZE - 1;
        const chapterLevels = LEVELS.slice(from - 1, to);
        const chapterStars = chapterLevels.reduce(
          (sum, { id }) => sum + (progress.best[id]?.stars ?? 0),
          0,
        );
        return (
          <section key={c} className="chapter">
            <header className="chapter-head">
              <h2>{t('sector', { n: c + 1 })}</h2>
              <span className="chapter-stars">
                <span className="star filled">
                  <Icon name="star" />
                </span>{' '}
                {chapterStars} / {CHAPTER_SIZE * 3}
              </span>
            </header>
            <div className="level-grid">
              {chapterLevels.map(({ id, movesMargin, wrap }) => {
                const done = progress.completed.includes(id);
                const isUnlocked = id <= progress.unlocked;
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
                    {done && <Stars count={progress.best[id]?.stars ?? 1} />}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {showMap && (
        <MapView
          progress={progress}
          onSelect={onSelect}
          onClose={() => setShowMap(false)}
        />
      )}
      {showAlbum && (
        <CollectionModal progress={progress} onClose={() => setShowAlbum(false)} />
      )}
      {showThemes && (
        <ThemeModal
          progress={progress}
          theme={theme}
          onSetTheme={onSetTheme}
          onClose={() => setShowThemes(false)}
        />
      )}
      {showCalendar && (
        <CalendarModal
          progress={progress}
          onBuyFreeze={onBuyFreeze}
          onReplayDay={(date) => {
            setShowCalendar(false);
            onReplayDay(date);
          }}
          onClose={() => setShowCalendar(false)}
        />
      )}
      {showSettings && (
        <SettingsModal
          soundOn={soundOn}
          onSoundToggle={onSoundToggle}
          hapticsOn={hapticsOn}
          onHapticsToggle={onHapticsToggle}
          reducedMotion={reducedMotion}
          onMotionToggle={onMotionToggle}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showStats && (
        <StatsModal progress={progress} onClose={() => setShowStats(false)} />
      )}

      {modesModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setModesModalOpen(false);
            setOpenPack(null);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {openPack === null ? (
              <>
                <h2>
                  <Icon name="infinity" className="c-magenta heading-icon" />{' '}
                  {t('moreModes')}
                </h2>
                <div className="modes-modal-list">
                  <button
                    type="button"
                    className="mode-btn"
                    onClick={() => {
                      setModesModalOpen(false);
                      onEndless();
                    }}
                  >
                    <span className="mode-icon c-magenta">
                      <Icon name="infinity" />
                    </span>
                    <span className="mode-text">
                      <strong>{t('endlessTitle')}</strong>
                      <small>
                        <Icon name="bolt" className="inline-icon c-cyan" />{' '}
                        {progress.endless.total}
                      </small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="mode-btn"
                    onClick={() => {
                      setModesModalOpen(false);
                      onBlackout();
                    }}
                  >
                    <span className="mode-icon c-dim">
                      <Icon name="moon" />
                    </span>
                    <span className="mode-text">
                      <strong>{t('blackoutTitle')}</strong>
                      <small>
                        <Icon name="bolt" className="inline-icon c-cyan" />{' '}
                        {progress.blackout.total}
                      </small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="mode-btn"
                    onClick={() => {
                      setModesModalOpen(false);
                      onRush();
                    }}
                  >
                    <span className="mode-icon c-flame">
                      <Icon name="timer" />
                    </span>
                    <span className="mode-text">
                      <strong>{t('rushTitle')}</strong>
                      <small>
                        <Icon name="trophy" className="inline-icon c-gold" />{' '}
                        {progress.rush.best}
                      </small>
                    </span>
                  </button>

                  {PACKS.map((pack) => {
                    const meta = PACK_META[pack.id];
                    const packStars = pack.levels.reduce(
                      (sum, { id }) => sum + (progress.best[id]?.stars ?? 0),
                      0,
                    );
                    return (
                      <button
                        key={pack.id}
                        type="button"
                        className="mode-btn"
                        onClick={() => setOpenPack(pack.id)}
                      >
                        <span className={`mode-icon ${meta.color}`}>
                          <Icon name={meta.icon} />
                        </span>
                        <span className="mode-text">
                          <strong>{t(meta.name)}</strong>
                          <small>
                            <Icon name="star" className="inline-icon c-gold" />{' '}
                            {packStars} / {pack.levels.length * 3}
                          </small>
                        </span>
                        <span className="mode-go" aria-hidden="true">
                          ›
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setModesModalOpen(false)}
                >
                  {t('close')}
                </button>
              </>
            ) : (
              (() => {
                const pack = PACKS.find((p) => p.id === openPack);
                const meta = PACK_META[openPack];
                if (pack === undefined) return null;
                const unlockedIdx = progress.allUnlocked
                  ? pack.levels.length
                  : (progress.packs[openPack] ?? 1);
                return (
                  <>
                    <div className="modal-head">
                      <button
                        type="button"
                        className="btn icon-btn"
                        onClick={() => setOpenPack(null)}
                        aria-label={t('back')}
                      >
                        <Icon name="back" />
                      </button>
                      <h2 className="modal-head-title">
                        <Icon name={meta.icon} className={`${meta.color} heading-icon`} />{' '}
                        {t(meta.name)}
                      </h2>
                      <button
                        type="button"
                        className="btn icon-btn"
                        onClick={() => onHelp(meta.help)}
                        aria-label={t('helpTitle')}
                      >
                        <Icon name="help" />
                      </button>
                    </div>
                    <div className="level-grid pack-grid">
                      {pack.levels.map(({ id }, k) => {
                        const index = k + 1;
                        const done = progress.completed.includes(id);
                        const isUnlocked = index <= unlockedIdx;
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
                            onClick={() => {
                              setModesModalOpen(false);
                              setOpenPack(null);
                              onSelectPack(pack.id, index);
                            }}
                            aria-label={
                              isUnlocked
                                ? `${t(meta.name)} ${index}`
                                : t('ariaLockedLevel')
                            }
                          >
                            <span className="level-num">{index}</span>
                            {done && <Stars count={progress.best[id]?.stars ?? 1} />}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setModesModalOpen(false);
                        setOpenPack(null);
                      }}
                    >
                      {t('close')}
                    </button>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {showRanks && (
        <div className="modal-backdrop" onClick={() => setShowRanks(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('rankTitle')}</h2>
            <ul className="rank-list">
              {RANKS.map((r) => {
                const achieved = stars >= r.threshold;
                return (
                  <li key={r.rank} className={achieved ? 'rank-item owned' : 'rank-item'}>
                    <RankBadge rank={r.rank} className="rank-item-badge" />
                    <span className="rank-item-text">
                      <strong>
                        {r.rank}. {r.name[lang]}
                      </strong>
                      <small>
                        <Icon name="star" className="inline-icon c-gold" /> {r.threshold}
                      </small>
                    </span>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="btn" onClick={() => setShowRanks(false)}>
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {showAchievements && (
        <div className="modal-backdrop" onClick={() => setShowAchievements(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              <Icon name="trophy" className="c-gold heading-icon" /> {t('achievements')}
            </h2>
            <ul className="ach-list">
              {ACHIEVEMENTS.map((a) => {
                const owned = progress.achievements.includes(a.id);
                return (
                  <li key={a.id} className={owned ? 'ach owned' : 'ach'}>
                    <span className={owned ? 'ach-icon c-gold' : 'ach-icon c-dim'}>
                      <Icon name={owned ? 'trophy' : 'lock'} />
                    </span>
                    <span className="ach-text">
                      <strong>{a.name[lang]}</strong>
                      <small>{a.desc[lang]}</small>
                    </span>
                    {a.reward > 0 && (
                      <span className="ach-reward">
                        {t('rewardHint', { n: a.reward })}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              className="btn"
              onClick={() => setShowAchievements(false)}
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
