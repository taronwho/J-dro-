import { LANGS, useI18n } from '../i18n/i18n';
import { LEVELS } from '../levels/levels';
import type { BestEntry } from './App';

interface MenuProps {
  unlocked: number;
  completed: number[];
  best: Record<number, BestEntry>;
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

export function Menu({ unlocked, completed, best, onSelect }: MenuProps) {
  const { lang, setLang, t } = useI18n();
  const totalStars = Object.values(best).reduce((sum, entry) => sum + entry.stars, 0);
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
      <p className="stars-total">
        <span className="star filled">★</span>{' '}
        {t('starsTotal', { x: totalStars, y: maxStars })}
      </p>
      <div className="level-grid">
        {LEVELS.map(({ id }) => {
          const done = completed.includes(id);
          const isUnlocked = id <= unlocked;
          const cls = done ? 'level-btn done' : isUnlocked ? 'level-btn open' : 'level-btn';
          return (
            <button
              key={id}
              type="button"
              className={cls}
              disabled={!isUnlocked}
              onClick={() => onSelect(id)}
              aria-label={isUnlocked ? t('level', { n: id }) : t('ariaLockedLevel')}
            >
              <span className="level-num">{id}</span>
              {done && <Stars count={best[id]?.stars ?? 1} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
