interface HUDProps {
  levelId: number;
  moves: number;
  onReset: () => void;
  onMenu: () => void;
}

export function HUD({ levelId, moves, onReset, onMenu }: HUDProps) {
  return (
    <header className="hud">
      <div className="hud-info">
        <span className="hud-level">Level {levelId}</span>
        <span className="hud-moves">Tahy: {moves}</span>
      </div>
      <div className="hud-buttons">
        <button type="button" className="btn" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="btn" onClick={onMenu}>
          Menu
        </button>
      </div>
    </header>
  );
}
