type Lang = 'cs' | 'en' | 'de';

export interface RankDef {
  rank: number; // 1–20
  threshold: number; // celkový počet hvězd potřebný pro dosažení
  name: Record<Lang, string>;
}

// 20 hodností podle celkového počtu hvězd (kampaň + výzvy, max 504)
export const RANKS: RankDef[] = [
  { rank: 1, threshold: 0, name: { cs: 'Nováček', en: 'Novice', de: 'Neuling' } },
  { rank: 2, threshold: 6, name: { cs: 'Technik', en: 'Technician', de: 'Techniker' } },
  { rank: 3, threshold: 14, name: { cs: 'Spojař', en: 'Linesman', de: 'Leitungsbauer' } },
  { rank: 4, threshold: 24, name: { cs: 'Elektrikář', en: 'Electrician', de: 'Elektriker' } },
  { rank: 5, threshold: 36, name: { cs: 'Montér sítě', en: 'Grid Fitter', de: 'Netzmonteur' } },
  { rank: 6, threshold: 50, name: { cs: 'Operátor', en: 'Operator', de: 'Operator' } },
  { rank: 7, threshold: 66, name: { cs: 'Dispečer', en: 'Dispatcher', de: 'Dispatcher' } },
  { rank: 8, threshold: 84, name: { cs: 'Inženýr', en: 'Engineer', de: 'Ingenieur' } },
  { rank: 9, threshold: 104, name: { cs: 'Konstruktér', en: 'Constructor', de: 'Konstrukteur' } },
  { rank: 10, threshold: 126, name: { cs: 'Architekt sítě', en: 'Grid Architect', de: 'Netzarchitekt' } },
  { rank: 11, threshold: 150, name: { cs: 'Energetik', en: 'Energist', de: 'Energetiker' } },
  { rank: 12, threshold: 176, name: { cs: 'Reaktorník', en: 'Reactor Hand', de: 'Reaktorwart' } },
  { rank: 13, threshold: 204, name: { cs: 'Mistr proudu', en: 'Current Master', de: 'Strommeister' } },
  { rank: 14, threshold: 234, name: { cs: 'Síťový virtuos', en: 'Grid Virtuoso', de: 'Netzvirtuose' } },
  { rank: 15, threshold: 266, name: { cs: 'Iluminátor', en: 'Illuminator', de: 'Illuminator' } },
  { rank: 16, threshold: 300, name: { cs: 'Vládce jader', en: 'Core Ruler', de: 'Kernherrscher' } },
  { rank: 17, threshold: 340, name: { cs: 'Strážce sítě', en: 'Grid Warden', de: 'Netzwächter' } },
  { rank: 18, threshold: 385, name: { cs: 'Legenda vodičů', en: 'Wire Legend', de: 'Drahtlegende' } },
  { rank: 19, threshold: 435, name: { cs: 'Kvantový mistr', en: 'Quantum Master', de: 'Quantenmeister' } },
  { rank: 20, threshold: 490, name: { cs: 'Absolutní jádro', en: 'Absolute Core', de: 'Absoluter Kern' } },
];

export function currentRank(stars: number): RankDef {
  let result = RANKS[0];
  for (const r of RANKS) {
    if (stars >= r.threshold) result = r;
    else break;
  }
  return result;
}

export function nextRank(stars: number): RankDef | null {
  for (const r of RANKS) {
    if (stars < r.threshold) return r;
  }
  return null;
}
