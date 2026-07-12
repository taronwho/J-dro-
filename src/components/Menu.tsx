import { useState } from 'react';
import { LANGS, useI18n } from '../i18n/i18n';
import { CHAPTER_COUNT, CHAPTER_SIZE, LEVELS } from '../levels/levels';
import { ACHIEVEMENTS, totalStars } from '../meta/achievements';
import type { Progress } from './App';
import type { HelpSection } from './Help';

interface MenuProps {
  progress: Progress;
  onSelect: (id: number) => void;
  onDaily: () => void;
  onEndless: () => void;
  onHelp: (section: HelpSection | null) => void;
}

function Stars({ count }: { count: number }) {
  return (
    <span className="lvl-stars" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= count ? 'star filled' : 'star'}>
          ★
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

export function Menu({ progress, onSelect, onDaily, onEndless, onHelp }: MenuProps) {
  const { lang, setLang, t } = useI18n();
  const [showAchievements, setShowAchievements] = useState(false);
  const stars = totalStars(progress);
  const maxStars = LEVELS.length * 3;
  const dailyDoneToday = progress.daily.last === isoToday();

  return (
    <div className="menu">
      <div className="lang-switch" role="group">
        {LANGS.map((code) => (
          <button
            key={code}
            type="button"
            className={code === lang ? 'lang-btn active' : 'lang-btn'}
            onClick={() => setLang(code)}
          >
            {code.toUpperCase()}
          </button>
        ))}
        <button
          type="button"
          className="lang-btn help-open"
          onClick={() => onHelp(null)}
          aria-label={t('helpTitle')}
        >
          ?
        </button>
      </div>
      <h1 className="title">CORE</h1>
      <p className="tagline">{t('tagline')}</p>

      <div className="stats-row">
        <button
          type="button"
          className="stat-chip stat-btn"
          onClick={() => onHelp('target')}
        >
          <span className="star filled">★</span> {stars} / {maxStars}
        </button>
        <button
          type="button"
          className="stat-chip stat-btn"
          onClick={() => onHelp('hints')}
        >
          💡 {progress.hints}
        </button>
        <button
          type="button"
          className="stat-chip stat-btn"
          onClick={() => onHelp('goal')}
        >
          ⚡ {progress.completed.length} / {LEVELS.length}
        </button>
        <button
          type="button"
          className="stat-chip stat-btn"
          onClick={() => onHelp('streak')}
        >
          🔥 {progress.bestStreak}
        </button>
        <button
          type="button"
          className="stat-chip stat-btn"
          onClick={() => setShowAchievements(true)}
        >
          🏆 {progress.achievements.length} / {ACHIEVEMENTS.length}
        </button>
      </div>

      <div className="modes-row">
        <button type="button" className="mode-btn" onClick={onDaily}>
          <span className="mode-icon">🗓️</span>
          <span className="mode-text">
            <strong>{t('dailyTitle')}</strong>
            <small>
              {dailyDoneToday ? `✓ ${t('dailyDone')}` : `🔥 ${progress.daily.streak}`}
            </small>
          </span>
        </button>
        <button type="button" className="mode-btn" onClick={onEndless}>
          <span className="mode-icon">♾️</span>
          <span className="mode-text">
            <strong>{t('endlessTitle')}</strong>
            <small>⚡ {progress.endless.total}</small>
          </span>
        </button>
      </div>

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
                <span className="star filled">★</span> {chapterStars} /{' '}
                {CHAPTER_SIZE * 3}
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

      {showAchievements && (
        <div className="modal-backdrop" onClick={() => setShowAchievements(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>🏆 {t('achievements')}</h2>
            <ul className="ach-list">
              {ACHIEVEMENTS.map((a) => {
                const owned = progress.achievements.includes(a.id);
                return (
                  <li key={a.id} className={owned ? 'ach owned' : 'ach'}>
                    <span className="ach-icon">{owned ? '🏆' : '🔒'}</span>
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
