import { useEffect, useRef } from 'react';
import { useI18n, type TKey } from '../i18n/i18n';

export type HelpSection =
  | 'goal'
  | 'colors'
  | 'target'
  | 'wrap'
  | 'lock'
  | 'limit'
  | 'hints'
  | 'streak'
  | 'achievements'
  | 'daily'
  | 'endless';

interface SectionDef {
  id: HelpSection;
  icon: string;
  title: TKey;
  text: TKey;
}

const SECTIONS: SectionDef[] = [
  { id: 'goal', icon: '⚡', title: 'helpGoal', text: 'helpGoalText' },
  { id: 'colors', icon: '🎨', title: 'helpColors', text: 'helpColorsText' },
  { id: 'target', icon: '🎯', title: 'helpTarget', text: 'helpTargetText' },
  { id: 'wrap', icon: '🌐', title: 'helpWrap', text: 'helpWrapText' },
  { id: 'lock', icon: '🔒', title: 'helpLock', text: 'helpLockText' },
  { id: 'limit', icon: '⏳', title: 'helpLimit', text: 'helpLimitText' },
  { id: 'hints', icon: '💡', title: 'helpHints', text: 'helpHintsText' },
  { id: 'streak', icon: '🔥', title: 'helpStreak', text: 'helpStreakText' },
  { id: 'achievements', icon: '🏆', title: 'achievements', text: 'helpAchText' },
  { id: 'daily', icon: '🗓️', title: 'dailyTitle', text: 'helpDailyText' },
  { id: 'endless', icon: '♾️', title: 'endlessTitle', text: 'helpEndlessText' },
];

interface HelpProps {
  highlight: HelpSection | null;
  onClose: () => void;
}

export function Help({ highlight, onClose }: HelpProps) {
  const { t } = useI18n();
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (highlight === null || listRef.current === null) return;
    const el = listRef.current.querySelector(`[data-section="${highlight}"]`);
    el?.scrollIntoView({ block: 'center' });
  }, [highlight]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>❓ {t('helpTitle')}</h2>
        <ul className="help-list" ref={listRef}>
          {SECTIONS.map((s) => (
            <li
              key={s.id}
              data-section={s.id}
              className={highlight === s.id ? 'help-item highlight' : 'help-item'}
            >
              <span className="help-icon">{s.icon}</span>
              <span className="help-text">
                <strong>{t(s.title)}</strong>
                <small>{t(s.text)}</small>
              </span>
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
