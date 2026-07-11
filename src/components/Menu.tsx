import { LEVELS } from '../levels/levels';

interface MenuProps {
  unlocked: number;
  completed: number[];
  onSelect: (id: number) => void;
}

export function Menu({ unlocked, completed, onSelect }: MenuProps) {
  return (
    <div className="menu">
      <h1 className="title">JÁDRO</h1>
      <p className="tagline">Otáčej dlaždice a napoj celou síť na jádro.</p>
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
            >
              <span className="level-num">{id}</span>
              {done && <span className="level-check">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
