import { useState } from 'react';
import { LANGS, useI18n } from '../i18n/i18n';
import { CHAPTER_COUNT, CHAPTER_SIZE, LEVELS } from '../levels/levels';
import { ACHIEVEMENTS, totalStars } from '../meta/achievements';
import type { Progress } from './App';

interface MenuProps {
  progress: Progress;
  onSelect: (id: number) => void;
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

export function Menu({ progress, onSelect }: MenuProps) {
  const { lang, setLang, t } = useI18n();
  const [showAchievements, setShowAchievements] = useState(false);
  const stars = totalStars(progress);
  const maxStars = LEVELS.length * 3;

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
      </div>
      <h1 className="title">JÁDRO</h1>
      <p className="tagline">{t('tagline')}</p>

      <div className="stats-row">
        <span className="stat-chip" title={t('starsTotal', { x: stars, y: maxStars })}>
          <span className="star filled">★</span> {stars} / {maxStars}
        </span>
        <span className="stat-chip" title={t('statHints')}>
          💡 {progress.hints}
        </span>
        <span className="stat-chip" title={t('statLevels')}>
          ⚡ {progress.completed.length} / {LEVELS.length}
        </span>
        <span className="stat-chip" title={t('statStreak')}>
          🔥 {progress.bestStreak}
        </span>
        <button
          type="button"
          className="stat-chip stat-btn"
          onClick={() => setShowAchievements(true)}
        >
          🏆 {progress.achievements.length} / {ACHIEVEMENTS.length}
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
                    {movesMargin !== undefined && (
                      <span className="badge-limit" title={t('limit', { n: '…' })} />
                    )}
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
