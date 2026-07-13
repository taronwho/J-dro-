import type { LevelConfig } from '../engine/types';
import { PACKS } from '../levels/levels';

type Lang = 'cs' | 'en' | 'de';

export interface AchievementProgress {
  completed: number[];
  best: Record<number, { moves: number; stars: number }>;
  bestStreak: number;
  daily: { last: string; streak: number; total: number };
  endless: { total: number };
  blackout: { total: number };
  rush: { best: number };
}

export interface AchievementDef {
  id: string;
  reward: number; // počet nápověd za odemčení
  name: Record<Lang, string>;
  desc: Record<Lang, string>;
  check: (p: AchievementProgress, levels: LevelConfig[]) => boolean;
}

export function totalStars(p: AchievementProgress): number {
  return Object.values(p.best).reduce((sum, b) => sum + b.stars, 0);
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-step',
    reward: 1,
    name: { cs: 'První krok', en: 'First step', de: 'Erster Schritt' },
    desc: {
      cs: 'Dokonči první level.',
      en: 'Complete your first level.',
      de: 'Schließe dein erstes Level ab.',
    },
    check: (p) => p.completed.length >= 1,
  },
  {
    id: 'first-perfect',
    reward: 1,
    name: { cs: 'Perfekcionista', en: 'Perfectionist', de: 'Perfektionist' },
    desc: {
      cs: 'Dokonči level na cíl — 3 hvězdy.',
      en: 'Finish a level at target — 3 stars.',
      de: 'Schaffe ein Level im Ziel — 3 Sterne.',
    },
    check: (p) => Object.values(p.best).some((b) => b.stars === 3),
  },
  {
    id: 'ten-levels',
    reward: 1,
    name: { cs: 'Zahřívací kolo', en: 'Warm-up lap', de: 'Aufwärmrunde' },
    desc: {
      cs: 'Dokonči 10 levelů.',
      en: 'Complete 10 levels.',
      de: 'Schließe 10 Level ab.',
    },
    check: (p) => p.completed.length >= 10,
  },
  {
    id: 'thirty-levels',
    reward: 2,
    name: { cs: 'V proudu', en: 'In the flow', de: 'Im Fluss' },
    desc: {
      cs: 'Dokonči 30 levelů.',
      en: 'Complete 30 levels.',
      de: 'Schließe 30 Level ab.',
    },
    check: (p) => p.completed.length >= 30,
  },
  {
    id: 'sixty-levels',
    reward: 3,
    name: { cs: 'Síťový inženýr', en: 'Network engineer', de: 'Netzwerkingenieur' },
    desc: {
      cs: 'Dokonči 60 levelů.',
      en: 'Complete 60 levels.',
      de: 'Schließe 60 Level ab.',
    },
    check: (p) => p.completed.length >= 60,
  },
  {
    id: 'hundred-levels',
    reward: 5,
    name: { cs: 'Dokonalá síť', en: 'Perfect grid', de: 'Perfektes Netz' },
    desc: {
      cs: 'Dokonči všech 100 levelů.',
      en: 'Complete all 100 levels.',
      de: 'Schließe alle 100 Level ab.',
    },
    check: (p) => p.completed.length >= 100,
  },
  {
    id: 'stars-50',
    reward: 2,
    name: { cs: 'Sběratel hvězd', en: 'Star collector', de: 'Sternensammler' },
    desc: {
      cs: 'Nasbírej 50 hvězd.',
      en: 'Collect 50 stars.',
      de: 'Sammle 50 Sterne.',
    },
    check: (p) => totalStars(p) >= 50,
  },
  {
    id: 'stars-150',
    reward: 3,
    name: { cs: 'Hvězdná obloha', en: 'Starry sky', de: 'Sternenhimmel' },
    desc: {
      cs: 'Nasbírej 150 hvězd.',
      en: 'Collect 150 stars.',
      de: 'Sammle 150 Sterne.',
    },
    check: (p) => totalStars(p) >= 150,
  },
  {
    id: 'stars-300',
    reward: 5,
    name: { cs: 'Souhvězdí', en: 'Constellation', de: 'Sternbild' },
    desc: {
      cs: 'Nasbírej všech 300 hvězd.',
      en: 'Collect all 300 stars.',
      de: 'Sammle alle 300 Sterne.',
    },
    check: (p) => totalStars(p) >= 300,
  },
  {
    id: 'streak-5',
    reward: 2,
    name: { cs: 'Rozjetý vlak', en: 'On a roll', de: 'Auf Kurs' },
    desc: {
      cs: '5 perfektních řešení v řadě.',
      en: '5 perfect solves in a row.',
      de: '5 perfekte Lösungen in Folge.',
    },
    check: (p) => p.bestStreak >= 5,
  },
  {
    id: 'streak-10',
    reward: 3,
    name: { cs: 'Nezastavitelný', en: 'Unstoppable', de: 'Unaufhaltsam' },
    desc: {
      cs: '10 perfektních řešení v řadě.',
      en: '10 perfect solves in a row.',
      de: '10 perfekte Lösungen in Folge.',
    },
    check: (p) => p.bestStreak >= 10,
  },
  {
    id: 'torus-first',
    reward: 1,
    name: { cs: 'Kolem dokola', en: 'Around the world', de: 'Einmal rundherum' },
    desc: {
      cs: 'Dokonči level na torusu (spoje přes okraj).',
      en: 'Complete a torus level (edges wrap around).',
      de: 'Schließe ein Torus-Level ab (Ränder verbunden).',
    },
    check: (p, levels) => p.completed.some((id) => levels[id - 1]?.wrap === true),
  },
  {
    id: 'limit-first',
    reward: 2,
    name: { cs: 'Pod tlakem', en: 'Under pressure', de: 'Unter Druck' },
    desc: {
      cs: 'Dokonči level s limitem tahů.',
      en: 'Complete a level with a move limit.',
      de: 'Schließe ein Level mit Zuglimit ab.',
    },
    check: (p, levels) =>
      p.completed.some((id) => levels[id - 1]?.movesMargin !== undefined),
  },
  {
    id: 'daily-first',
    reward: 1,
    name: { cs: 'Ranní rituál', en: 'Morning ritual', de: 'Morgenritual' },
    desc: {
      cs: 'Dokonči denní výzvu.',
      en: 'Complete a daily challenge.',
      de: 'Schließe eine Tages-Challenge ab.',
    },
    check: (p) => p.daily.total >= 1,
  },
  {
    id: 'daily-7',
    reward: 3,
    name: { cs: 'Týden v kuse', en: 'Full week', de: 'Volle Woche' },
    desc: {
      cs: '7denní série denních výzev.',
      en: 'A 7-day daily challenge streak.',
      de: 'Eine 7-Tage-Serie der Tages-Challenge.',
    },
    check: (p) => p.daily.streak >= 7,
  },
  {
    id: 'endless-10',
    reward: 2,
    name: { cs: 'Maratonec', en: 'Marathoner', de: 'Marathonläufer' },
    desc: {
      cs: 'Dokonči 10 nekonečných levelů.',
      en: 'Complete 10 endless levels.',
      de: 'Schließe 10 Endlos-Level ab.',
    },
    check: (p) => p.endless.total >= 10,
  },
  {
    id: 'blackout-5',
    reward: 2,
    name: { cs: 'Vidím ve tmě', en: 'Night vision', de: 'Nachtsicht' },
    desc: {
      cs: 'Dokonči 5 levelů v režimu Zatmění.',
      en: 'Complete 5 Blackout levels.',
      de: 'Schließe 5 Blackout-Level ab.',
    },
    check: (p) => p.blackout.total >= 5,
  },
  {
    id: 'rush-5',
    reward: 2,
    name: { cs: 'Sprinter', en: 'Sprinter', de: 'Sprinter' },
    desc: {
      cs: 'Vyřeš 5 polí v jedné Bleskové hře.',
      en: 'Solve 5 grids in one Time rush.',
      de: 'Löse 5 Felder in einem Zeit-Rausch.',
    },
    check: (p) => p.rush.best >= 5,
  },
  {
    id: 'rush-10',
    reward: 3,
    name: { cs: 'Rychlost světla', en: 'Light speed', de: 'Lichtgeschwindigkeit' },
    desc: {
      cs: 'Vyřeš 10 polí v jedné Bleskové hře.',
      en: 'Solve 10 grids in one Time rush.',
      de: 'Löse 10 Felder in einem Zeit-Rausch.',
    },
    check: (p) => p.rush.best >= 10,
  },
  {
    id: 'master',
    reward: 0,
    name: { cs: 'Mistr jádra', en: 'Core master', de: 'Kernmeister' },
    desc: {
      cs: 'Dokonči level 100.',
      en: 'Complete level 100.',
      de: 'Schließe Level 100 ab.',
    },
    check: (p) => p.completed.includes(100),
  },
  {
    id: 'target-first',
    reward: 1,
    name: { cs: 'Přesná muška', en: 'Sharpshooter', de: 'Scharfschütze' },
    desc: {
      cs: 'Dokonči level s barevnými cíli.',
      en: 'Complete a level with colored targets.',
      de: 'Schließe ein Level mit farbigen Zielen ab.',
    },
    check: (p, levels) =>
      p.completed.some((id) => (levels[id - 1]?.targetCount ?? 0) > 0),
  },
  {
    id: 'melt-first',
    reward: 1,
    name: { cs: 'Ledolamka', en: 'Icebreaker', de: 'Eisbrecher' },
    desc: {
      cs: 'Dokonči level se zamrzlou dlaždicí.',
      en: 'Complete a level with a frozen tile.',
      de: 'Schließe ein Level mit gefrorener Kachel ab.',
    },
    check: (p, levels) =>
      p.completed.some((id) => (levels[id - 1]?.frozenCount ?? 0) > 0),
  },
  {
    id: 'sector6',
    reward: 3,
    name: { cs: 'Za hranici', en: 'Beyond the grid', de: 'Jenseits des Netzes' },
    desc: {
      cs: 'Dokonči level 120.',
      en: 'Complete level 120.',
      de: 'Schließe Level 120 ab.',
    },
    check: (p) => p.completed.includes(120),
  },
  {
    id: 'specialist',
    reward: 5,
    name: { cs: 'Specialista', en: 'Specialist', de: 'Spezialist' },
    desc: {
      cs: 'Dokonči všechny levely výzev.',
      en: 'Complete all challenge levels.',
      de: 'Schließe alle Herausforderungs-Level ab.',
    },
    check: (p) =>
      PACKS.every((pack) => pack.levels.every((l) => p.completed.includes(l.id))),
  },
];

export function newlyUnlocked(
  progress: AchievementProgress,
  owned: string[],
  levels: LevelConfig[],
): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => !owned.includes(a.id) && a.check(progress, levels));
}
