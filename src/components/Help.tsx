import { useEffect, useRef } from 'react';
import { useI18n, type TKey } from '../i18n/i18n';
import { Icon, type IconName } from './Icon';

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
  | 'endless'
  | 'blackout'
  | 'rush'
  | 'targets'
  | 'walls'
  | 'frozen';

interface SectionDef {
  id: HelpSection;
  icon: IconName;
  color: string;
  title: TKey;
  text: TKey;
}

const SECTIONS: SectionDef[] = [
  { id: 'goal', icon: 'bolt', color: 'c-cyan', title: 'helpGoal', text: 'helpGoalText' },
  { id: 'colors', icon: 'cores', color: 'c-dim', title: 'helpColors', text: 'helpColorsText' },
  { id: 'target', icon: 'target', color: 'c-gold', title: 'helpTarget', text: 'helpTargetText' },
  { id: 'wrap', icon: 'torus', color: 'c-cyan', title: 'helpWrap', text: 'helpWrapText' },
  { id: 'lock', icon: 'lock', color: 'c-dim', title: 'helpLock', text: 'helpLockText' },
  { id: 'targets', icon: 'target', color: 'c-magenta', title: 'helpTargets', text: 'helpTargetsText' },
  { id: 'walls', icon: 'wall', color: 'c-dim', title: 'helpWalls', text: 'helpWallsText' },
  { id: 'frozen', icon: 'snowflake', color: 'c-cyan', title: 'helpFrozen', text: 'helpFrozenText' },
  { id: 'limit', icon: 'hourglass', color: 'c-amber', title: 'helpLimit', text: 'helpLimitText' },
  { id: 'hints', icon: 'bulb', color: 'c-amber', title: 'helpHints', text: 'helpHintsText' },
  { id: 'streak', icon: 'flame', color: 'c-flame', title: 'helpStreak', text: 'helpStreakText' },
  { id: 'achievements', icon: 'trophy', color: 'c-gold', title: 'achievements', text: 'helpAchText' },
  { id: 'daily', icon: 'calendar', color: 'c-cyan', title: 'dailyTitle', text: 'helpDailyText' },
  { id: 'endless', icon: 'infinity', color: 'c-magenta', title: 'endlessTitle', text: 'helpEndlessText' },
  { id: 'blackout', icon: 'moon', color: 'c-dim', title: 'blackoutTitle', text: 'helpBlackoutText' },
  { id: 'rush', icon: 'timer', color: 'c-flame', title: 'rushTitle', text: 'helpRushText' },
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
        <h2>
          <Icon name="help" className="c-cyan heading-icon" /> {t('helpTitle')}
        </h2>
        <ul className="help-list" ref={listRef}>
          {SECTIONS.map((s) => (
            <li
              key={s.id}
              data-section={s.id}
              className={highlight === s.id ? 'help-item highlight' : 'help-item'}
            >
              <span className={`help-icon ${s.color}`}>
                <Icon name={s.icon} />
              </span>
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
