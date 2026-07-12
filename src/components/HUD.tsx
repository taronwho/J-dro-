import { useI18n } from '../i18n/i18n';

interface HUDProps {
  levelId: number;
  moves: number;
  par: number;
  onReset: () => void;
  onMenu: () => void;
}

export function HUD({ levelId, moves, par, onReset, onMenu }: HUDProps) {
  const { t } = useI18n();
  return (
    <header className="hud">
      <div className="hud-info">
        <span className="hud-level">{t('level', { n: levelId })}</span>
        <span className="hud-moves">
          {t('moves', { n: moves })} · {t('target', { n: par })}
        </span>
      </div>
      <div className="hud-buttons">
        <button type="button" className="btn" onClick={onReset}>
          {t('reset')}
        </button>
        <button type="button" className="btn" onClick={onMenu}>
          {t('menu')}
        </button>
      </div>
    </header>
  );
}
