type Lang = 'cs' | 'en' | 'de';

export interface SectorStory {
  sector: number; // 1–6
  x: number; // pozice uzlu na mapě Kory (viewBox 100×220, cesta zdola nahoru)
  y: number;
  name: Record<Lang, string>;
  text: Record<Lang, string>;
}

// Příběh: planeta Kora po solární bouři přišla o energii. Hráč je
// technik jádra a sektor po sektoru obnovuje planetární síť — mapa
// se s postupem kampaně rozsvěcí.
export const STORY_INTRO: Record<Lang, string> = {
  cs: 'Solární bouře vyřadila energetickou síť planety Kora. Jsi technik jádra — propoj rozvody a vrať světlo, sektor po sektoru.',
  en: 'A solar storm knocked out the power grid of planet Kora. You are a core technician — reconnect the lines and bring back the light, sector by sector.',
  de: 'Ein Sonnensturm hat das Stromnetz des Planeten Kora lahmgelegt. Du bist Kerntechniker — verbinde die Leitungen und bring das Licht zurück, Sektor für Sektor.',
};

export const SECTOR_STORIES: SectorStory[] = [
  {
    sector: 1,
    x: 30,
    y: 193,
    name: { cs: 'Okraj města', en: 'City outskirts', de: 'Stadtrand' },
    text: {
      cs: 'První bloky se probouzejí. Malé rozvody, jedno jádro — nauč se, jak energie teče.',
      en: 'The first blocks wake up. Small grids, one core — learn how the energy flows.',
      de: 'Die ersten Blöcke erwachen. Kleine Netze, ein Kern — lerne, wie die Energie fließt.',
    },
  },
  {
    sector: 2,
    x: 68,
    y: 160,
    name: { cs: 'Průmyslová zóna', en: 'Industrial zone', de: 'Industriezone' },
    text: {
      cs: 'Továrny potřebují proud. Sítě rostou a okraje světa se začínají propojovat dokola.',
      en: 'The factories need power. Grids grow and the edges of the world begin to wrap around.',
      de: 'Die Fabriken brauchen Strom. Die Netze wachsen und die Ränder der Welt verbinden sich.',
    },
  },
  {
    sector: 3,
    x: 28,
    y: 126,
    name: { cs: 'Podzemní kolektory', en: 'Underground collectors', de: 'Untergrundkollektoren' },
    text: {
      cs: 'Hluboko pod městem běží víc jader najednou a části rozvodů jsou pevně zamčené.',
      en: 'Deep under the city several cores run at once and parts of the grid are locked in place.',
      de: 'Tief unter der Stadt laufen mehrere Kerne zugleich und Teile des Netzes sind fest verriegelt.',
    },
  },
  {
    sector: 4,
    x: 63,
    y: 94,
    name: { cs: 'Centrum města', en: 'City center', de: 'Stadtzentrum' },
    text: {
      cs: 'Srdce Kory. Rozvody jsou spletité a každé zaváhání se počítá — energie ubývá.',
      en: 'The heart of Kora. The lines are tangled and every hesitation counts — energy is running out.',
      de: 'Das Herz von Kora. Die Leitungen sind verworren und jedes Zögern zählt — die Energie schwindet.',
    },
  },
  {
    sector: 5,
    x: 38,
    y: 60,
    name: { cs: 'Horské uzly', en: 'Mountain nodes', de: 'Bergknoten' },
    text: {
      cs: 'Přenosové uzly v horách mají přísné limity. Jen přesné zásahy vrátí spojení údolím.',
      en: 'The mountain relay nodes have strict limits. Only precise moves reconnect the valleys.',
      de: 'Die Relaisknoten in den Bergen haben strenge Limits. Nur präzise Züge verbinden die Täler.',
    },
  },
  {
    sector: 6,
    x: 60,
    y: 24,
    name: { cs: 'Polární stanice', en: 'Polar station', de: 'Polarstation' },
    text: {
      cs: 'Poslední výspa: zdi, led a barevné okruhy. Obnov výzkumnou stanici a Kora se rozzáří celá.',
      en: 'The last outpost: walls, ice and colored circuits. Restore the research station and all of Kora lights up.',
      de: 'Der letzte Außenposten: Wände, Eis und farbige Kreise. Stelle die Forschungsstation wieder her und ganz Kora erstrahlt.',
    },
  },
];
