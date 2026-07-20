type Lang = 'cs' | 'en' | 'de';

export interface CollectibleDef {
  id: number; // 0–11
  set: number; // 0–2
  name: Record<Lang, string>;
}

export interface CollectionSetDef {
  id: number;
  reward: number; // nápovědy za zkompletování
  name: Record<Lang, string>;
}

// Sběratelské album: součástky sítě. Fragment padá za první perfektní
// (3★) řešení levelu — item = levelId % 12; duplikát se promění v nápovědu.
export const COLLECTION_SETS: CollectionSetDef[] = [
  {
    id: 0,
    reward: 4,
    name: { cs: 'Základní součástky', en: 'Basic parts', de: 'Grundbauteile' },
  },
  {
    id: 1,
    reward: 4,
    name: { cs: 'Silnoproud', en: 'Heavy current', de: 'Starkstrom' },
  },
  {
    id: 2,
    reward: 4,
    name: { cs: 'Kvantové jádro', en: 'Quantum core', de: 'Quantenkern' },
  },
];

export const COLLECTIBLES: CollectibleDef[] = [
  { id: 0, set: 0, name: { cs: 'Pojistka', en: 'Fuse', de: 'Sicherung' } },
  { id: 1, set: 0, name: { cs: 'Relé', en: 'Relay', de: 'Relais' } },
  { id: 2, set: 0, name: { cs: 'Kondenzátor', en: 'Capacitor', de: 'Kondensator' } },
  { id: 3, set: 0, name: { cs: 'Cívka', en: 'Coil', de: 'Spule' } },
  { id: 4, set: 1, name: { cs: 'Transformátor', en: 'Transformer', de: 'Transformator' } },
  { id: 5, set: 1, name: { cs: 'Dioda', en: 'Diode', de: 'Diode' } },
  { id: 6, set: 1, name: { cs: 'Rezistor', en: 'Resistor', de: 'Widerstand' } },
  { id: 7, set: 1, name: { cs: 'Jistič', en: 'Breaker', de: 'Schutzschalter' } },
  { id: 8, set: 2, name: { cs: 'Krystal', en: 'Crystal', de: 'Kristall' } },
  { id: 9, set: 2, name: { cs: 'Supravodič', en: 'Superconductor', de: 'Supraleiter' } },
  { id: 10, set: 2, name: { cs: 'Fúzní článek', en: 'Fusion cell', de: 'Fusionszelle' } },
  { id: 11, set: 2, name: { cs: 'Kvantový čip', en: 'Quantum chip', de: 'Quantenchip' } },
];

export function collectibleForLevel(levelId: number): number {
  return ((levelId % 12) + 12) % 12;
}

export function setItems(setId: number): CollectibleDef[] {
  return COLLECTIBLES.filter((c) => c.set === setId);
}
