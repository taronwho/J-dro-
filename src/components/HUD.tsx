import { useI18n } from '../i18n/i18n';
import type { RushState } from './App';
import { Icon } from './Icon';

interface HUDProps {
  title: string;
  moves: number;
  par: number;
  moveLimit: number | null;
  hints: number;
  hintMode: boolean;
  rush: RushState | null;
  soundOn: boolean;
  canUndo: boolean;
  undosLeft: number;
  onUndo: () => void;
  onSoundToggle: () => void;
  onHintToggle: () => void;
  onHelp: () => void;
  onReset: () => void;
  onBack: () => void;
  onMenu: () => void;
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function HUD({
  title,
  moves,
  par,
  moveLimit,
  hints,
  hintMode,
  rush,
  soundOn,
  canUndo,
  undosLeft,
  onUndo,
  onSoundToggle,
  onHintToggle,
  onHelp,
  onReset,
  onBack,
  onMenu,
}: HUDProps) {
  const { t } = useI18n();
  const nearLimit = moveLimit !== null && moveLimit - moves <= 3;
  const lowTime = rush !== null && rush.timeLeft <= 10;
  return (
    <header className="hud">
      <div className="hud-top">
        <button
          type="button"
          className="btn icon-btn"
          onClick={onBack}
          aria-label={t('back')}
        >
          <Icon name="back" />
        </button>
        <span className="hud-level">{title}</span>
        <div className="hud-buttons">
          <button
            type="button"
            className={hintMode ? 'btn hint-btn active' : 'btn hint-btn'}
            onClick={onHintToggle}
            aria-label={t('hintTitle')}
            disabled={hints < 1 && !hintMode}
          >
            <Icon name="bulb" className="chip-icon" /> {hints}
          </button>
          <button
            type="button"
            className="btn icon-btn"
            onClick={onUndo}
            aria-label={t('undo')}
            disabled={!canUndo}
          >
            <Icon name="undo" />
            {undosLeft > 0 && <span className="undo-count">{undosLeft}</span>}
          </button>
          <button
            type="button"
            className="btn icon-btn"
            onClick={onReset}
            aria-label={t('reset')}
          >
            <Icon name="reset" />
          </button>
          <button
            type="button"
            className="btn icon-btn"
            onClick={onMenu}
            aria-label={t('menu')}
          >
            <Icon name="home" />
          </button>
        </div>
      </div>
      <div className="hud-bottom">
        {rush !== null ? (
          <span className="hud-moves">
            <span className={lowTime ? 'hud-limit danger' : 'hud-time'}>
              <Icon name="timer" className="inline-icon" /> {formatTime(rush.timeLeft)}
            </span>{' '}
            · {t('score', { n: rush.score })}
          </span>
        ) : (
          <span className="hud-moves">
            {t('moves', { n: moves })} · {t('target', { n: par })}
            {moveLimit !== null && (
              <span className={nearLimit ? 'hud-limit danger' : 'hud-limit'}>
                {' '}
                · {t('limit', { n: moveLimit })}
              </span>
            )}
          </span>
        )}
        <span className="hud-mini-buttons">
          <button
            type="button"
            className="hud-help"
            onClick={onSoundToggle}
            aria-label={t('soundLabel')}
          >
            <Icon name={soundOn ? 'sound' : 'soundOff'} />
          </button>
          <button
            type="button"
            className="hud-help"
            onClick={onHelp}
            aria-label={t('helpTitle')}
          >
            <Icon name="help" />
          </button>
        </span>
      </div>
    </header>
  );
}
