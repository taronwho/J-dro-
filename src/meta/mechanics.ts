import type { LevelConfig } from '../engine/types';
import type { TKey } from '../i18n/i18n';

// ---------- Herní mechaniky a jejich první výskyt ----------
// Když se v levelu poprvé objeví nová mechanika (torus, dvě jádra, zdi …),
// hra před startem ukáže krátké vysvětlení. Seznam už viděných mechanik
// se ukládá do postupu, takže se každá vysvětlí právě jednou.

export type MechanicId =
  | 'wrap'
  | 'cores'
  | 'locked'
  | 'limit'
  | 'targets'
  | 'walls'
  | 'frozen'
  | 'portals';

export interface MechanicDef {
  id: MechanicId;
  title: TKey;
  text: TKey;
  color: string; // třída barvy pro ilustraci
}

export const MECHANICS: Record<MechanicId, MechanicDef> = {
  wrap: { id: 'wrap', title: 'helpWrap', text: 'helpWrapText', color: 'c-cyan' },
  cores: { id: 'cores', title: 'helpColors', text: 'helpColorsText', color: 'c-magenta' },
  locked: { id: 'locked', title: 'helpLock', text: 'helpLockText', color: 'c-dim' },
  limit: { id: 'limit', title: 'helpLimit', text: 'helpLimitText', color: 'c-amber' },
  targets: { id: 'targets', title: 'helpTargets', text: 'helpTargetsText', color: 'c-magenta' },
  walls: { id: 'walls', title: 'helpWalls', text: 'helpWallsText', color: 'c-dim' },
  frozen: { id: 'frozen', title: 'helpFrozen', text: 'helpFrozenText', color: 'c-cyan' },
  portals: { id: 'portals', title: 'helpPortals', text: 'helpPortalsText', color: 'c-violet' },
};

// Pořadí, v jakém se karty ukazují, když jich level přinese víc najednou.
const ORDER: MechanicId[] = [
  'cores',
  'targets',
  'wrap',
  'walls',
  'portals',
  'frozen',
  'locked',
  'limit',
];

/** Které mechaniky level obsahuje. */
export function mechanicsIn(config: LevelConfig): MechanicId[] {
  const found: MechanicId[] = [];
  const forest = config.forest === true;
  if (config.wrap) found.push('wrap');
  // víc jader ve sdílené síti; u oddělených sítí to vysvětluje karta „cíle"
  if (config.coreCount >= 2 && !forest) found.push('cores');
  if (config.lockedCount > 0) found.push('locked');
  if (config.movesMargin !== undefined) found.push('limit');
  if ((config.targetCount ?? 0) > 0) found.push('targets');
  if ((config.wallCount ?? 0) > 0) found.push('walls');
  if ((config.frozenCount ?? 0) > 0) found.push('frozen');
  if ((config.portalCount ?? 0) > 0) found.push('portals');
  return ORDER.filter((id) => found.includes(id));
}

/** Mechaniky levelu, které hráč ještě neviděl vysvětlené. */
export function unseenMechanics(config: LevelConfig, seen: string[]): MechanicId[] {
  return mechanicsIn(config).filter((id) => !seen.includes(id));
}
