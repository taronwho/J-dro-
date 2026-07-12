import { useI18n } from '../i18n/i18n';

interface HUDProps {
  levelId: number;
  moves: number;
  par: number;
  moveLimit: number | null;
  hints: number;
  hintMode: boolean;
  onHintToggle: () => void;
  onReset: () => void;
  onMenu: () => void;
}

export function HUD({
  levelId,
  moves,
  par,
  moveLimit,
  hints,
  hintMode,
  onHintToggle,
  onReset,
  onMenu,
}: HUDProps) {
  const { t } = useI18n();
  const nearLimit = moveLimit !== null && moveLimit - moves <= 3;
  return (
    <header className="hud">
      <div className="hud-top">
        <span className="hud-level">{t('level', { n: levelId })}</span>
        <div className="hud-buttons">
          <button
            type="button"
            className={hintMode ? 'btn hint-btn active' : 'btn hint-btn'}
            onClick={onHintToggle}
            aria-label={t('hintTitle')}
            disabled={hints < 1 && !hintMode}
          >
            💡 {hints}
          </button>
          <button type="button" className="btn" onClick={onReset}>
            {t('reset')}
          </button>
          <button type="button" className="btn" onClick={onMenu}>
            {t('menu')}
          </button>
        </div>
      </div>
      <div className="hud-moves">
        {t('moves', { n: moves })} · {t('target', { n: par })}
        {moveLimit !== null && (
          <span className={nearLimit ? 'hud-limit danger' : 'hud-limit'}>
            {' '}
            · {t('limit', { n: moveLimit })}
          </span>
        )}
      </div>
    </header>
  );
}
