import { useI18n } from '../i18n/i18n';
import { Icon } from './Icon';

interface HUDProps {
  title: string;
  moves: number;
  par: number;
  moveLimit: number | null;
  hints: number;
  hintMode: boolean;
  onHintToggle: () => void;
  onHelp: () => void;
  onReset: () => void;
  onMenu: () => void;
}

export function HUD({
  title,
  moves,
  par,
  moveLimit,
  hints,
  hintMode,
  onHintToggle,
  onHelp,
  onReset,
  onMenu,
}: HUDProps) {
  const { t } = useI18n();
  const nearLimit = moveLimit !== null && moveLimit - moves <= 3;
  return (
    <header className="hud">
      <div className="hud-top">
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
          <button type="button" className="btn" onClick={onReset}>
            {t('reset')}
          </button>
          <button type="button" className="btn" onClick={onMenu}>
            {t('menu')}
          </button>
        </div>
      </div>
      <div className="hud-bottom">
        <span className="hud-moves">
          {t('moves', { n: moves })} · {t('target', { n: par })}
          {moveLimit !== null && (
            <span className={nearLimit ? 'hud-limit danger' : 'hud-limit'}>
              {' '}
              · {t('limit', { n: moveLimit })}
            </span>
          )}
        </span>
        <button
          type="button"
          className="hud-help"
          onClick={onHelp}
          aria-label={t('helpTitle')}
        >
          <Icon name="help" />
        </button>
      </div>
    </header>
  );
}
