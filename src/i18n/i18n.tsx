import { createContext, useContext } from 'react';

export type Lang = 'cs' | 'en' | 'de';

export const LANGS: readonly Lang[] = ['cs', 'en', 'de'];

const STRINGS = {
  tagline: {
    cs: 'Otáčej dlaždice a napoj celou síť na jádro.',
    en: 'Rotate the tiles and connect the whole grid to the core.',
    de: 'Drehe die Kacheln und verbinde das ganze Netz mit dem Kern.',
  },
  level: { cs: 'Level {n}', en: 'Level {n}', de: 'Level {n}' },
  moves: { cs: 'Tahy: {n}', en: 'Moves: {n}', de: 'Züge: {n}' },
  target: { cs: 'Cíl: {n}', en: 'Target: {n}', de: 'Ziel: {n}' },
  reset: { cs: 'Reset', en: 'Reset', de: 'Reset' },
  menu: { cs: 'Menu', en: 'Menu', de: 'Menü' },
  back: { cs: 'Zpět', en: 'Back', de: 'Zurück' },
  langLabel: { cs: 'Jazyk', en: 'Language', de: 'Sprache' },
  levelDone: { cs: 'Level dokončen', en: 'Level complete', de: 'Level geschafft' },
  overlayMoves: { cs: 'Počet tahů: {n}', en: 'Moves used: {n}', de: 'Benötigte Züge: {n}' },
  best: { cs: 'Nejlepší: {n}', en: 'Best: {n}', de: 'Bestwert: {n}' },
  newRecord: { cs: 'Nový rekord!', en: 'New record!', de: 'Neuer Rekord!' },
  next: { cs: 'Další level', en: 'Next level', de: 'Nächstes Level' },
  starsTotal: { cs: '{x} / {y} hvězd', en: '{x} / {y} stars', de: '{x} / {y} Sterne' },
  limit: { cs: 'Limit: {n}', en: 'Limit: {n}', de: 'Limit: {n}' },
  sector: { cs: 'Sektor {n}', en: 'Sector {n}', de: 'Sektor {n}' },
  hintTitle: { cs: 'Nápověda', en: 'Hint', de: 'Hinweis' },
  hintModeMsg: {
    cs: 'Vyber dlaždici — otočí se správně a zamkne se.',
    en: 'Pick a tile — it will rotate into place and lock.',
    de: 'Wähle eine Kachel — sie dreht sich richtig und wird gesperrt.',
  },
  hintNone: {
    cs: 'Žádné nápovědy. Získáš je za perfektní řešení a úspěchy.',
    en: 'No hints left. Earn them with perfect solves and achievements.',
    de: 'Keine Hinweise. Verdiene sie mit perfekten Lösungen und Erfolgen.',
  },
  hintCapNote: {
    cs: 'Použita nápověda — nejvýše 2 hvězdy',
    en: 'Hint used — capped at 2 stars',
    de: 'Hinweis genutzt — höchstens 2 Sterne',
  },
  hintEarned: {
    cs: '+1 nápověda za perfektní řešení',
    en: '+1 hint for a perfect solve',
    de: '+1 Hinweis für eine perfekte Lösung',
  },
  hintEarnedDaily: {
    cs: '+1 nápověda za denní výzvu',
    en: '+1 hint for the daily challenge',
    de: '+1 Hinweis für die Tages-Challenge',
  },
  failTitle: { cs: 'Došly tahy', en: 'Out of moves', de: 'Keine Züge mehr' },
  failText: {
    cs: 'Limit {n} tahů je vyčerpán. Zkus to znovu.',
    en: 'The limit of {n} moves is used up. Try again.',
    de: 'Das Limit von {n} Zügen ist aufgebraucht. Versuch es nochmal.',
  },
  retry: { cs: 'Zkusit znovu', en: 'Try again', de: 'Nochmal' },
  achievements: { cs: 'Úspěchy', en: 'Achievements', de: 'Erfolge' },
  newAchievement: { cs: 'Nový úspěch!', en: 'New achievement!', de: 'Neuer Erfolg!' },
  close: { cs: 'Zavřít', en: 'Close', de: 'Schließen' },
  statLevels: { cs: 'Levely', en: 'Levels', de: 'Level' },
  statHints: { cs: 'Nápovědy', en: 'Hints', de: 'Hinweise' },
  statStreak: { cs: 'Nejlepší série', en: 'Best streak', de: 'Beste Serie' },
  rewardHint: { cs: '+{n} nápověda', en: '+{n} hint', de: '+{n} Hinweis' },
  dailyTitle: { cs: 'Denní výzva', en: 'Daily challenge', de: 'Tages-Challenge' },
  endlessTitle: { cs: 'Nekonečná hra', en: 'Endless mode', de: 'Endlos-Modus' },
  blackoutTitle: { cs: 'Zatmění', en: 'Blackout', de: 'Blackout' },
  rushTitle: { cs: 'Blesková hra', en: 'Time rush', de: 'Zeit-Rausch' },
  packsTitle: { cs: 'Výzvy', en: 'Challenges', de: 'Herausforderungen' },
  campaignTitle: { cs: 'Kampaň', en: 'Campaign', de: 'Kampagne' },
  moreModes: {
    cs: 'Další režimy a výzvy',
    en: 'More modes & challenges',
    de: 'Weitere Modi & Herausforderungen',
  },
  rankTitle: { cs: 'Hodnost', en: 'Rank', de: 'Rang' },
  rankProgress: {
    cs: 'Do další hodnosti: {n} ★',
    en: 'Next rank in: {n} ★',
    de: 'Bis zum nächsten Rang: {n} ★',
  },
  rankMax: { cs: 'Nejvyšší hodnost!', en: 'Highest rank!', de: 'Höchster Rang!' },
  share: { cs: 'Sdílet', en: 'Share', de: 'Teilen' },
  shareCopied: {
    cs: 'Zkopírováno do schránky!',
    en: 'Copied to clipboard!',
    de: 'In die Zwischenablage kopiert!',
  },
  dailyRewardLine: {
    cs: 'Denní výzva: nápovědy +{n} (série {s})',
    en: 'Daily challenge: hints +{n} (streak {s})',
    de: 'Tages-Challenge: Hinweise +{n} (Serie {s})',
  },
  freezeUsed: {
    cs: 'Zmrazení zachránilo tvou sérii!',
    en: 'A freeze saved your streak!',
    de: 'Ein Einfrieren hat deine Serie gerettet!',
  },
  freezeTitle: { cs: 'Zmrazení série', en: 'Streak freeze', de: 'Serien-Einfrieren' },
  freezeDesc: {
    cs: 'Zachrání denní sérii při jednom vynechaném dni. Spotřebuje se automaticky.',
    en: 'Saves your daily streak when you miss one day. Used automatically.',
    de: 'Rettet deine Tages-Serie bei einem verpassten Tag. Wird automatisch verbraucht.',
  },
  freezeBuy: {
    cs: 'Koupit za {n} nápovědy',
    en: 'Buy for {n} hints',
    de: 'Für {n} Hinweise kaufen',
  },
  calendarTitle: { cs: 'Denní kalendář', en: 'Daily calendar', de: 'Tageskalender' },
  themesTitle: { cs: 'Témata', en: 'Themes', de: 'Themen' },
  themeLocked: {
    cs: 'Od hodnosti {n}',
    en: 'From rank {n}',
    de: 'Ab Rang {n}',
  },
  albumTitle: { cs: 'Album součástek', en: 'Parts album', de: 'Bauteile-Album' },
  albumHint: {
    cs: 'Fragmenty získáš za první perfektní řešení levelu (3★). Duplikát = +1 nápověda.',
    en: 'Earn fragments for the first perfect solve of a level (3★). Duplicate = +1 hint.',
    de: 'Fragmente gibt es für die erste perfekte Lösung eines Levels (3★). Duplikat = +1 Hinweis.',
  },
  fragmentNew: {
    cs: 'Nová součástka: {name}',
    en: 'New part: {name}',
    de: 'Neues Bauteil: {name}',
  },
  fragmentDup: {
    cs: 'Duplikát ({name}) → +1 nápověda',
    en: 'Duplicate ({name}) → +1 hint',
    de: 'Duplikat ({name}) → +1 Hinweis',
  },
  setComplete: {
    cs: 'Sada „{name}“ kompletní! +{n} nápověd',
    en: 'Set “{name}” complete! +{n} hints',
    de: 'Set „{name}“ vollständig! +{n} Hinweise',
  },
  rankUp: {
    cs: 'Nová hodnost: {name}! +{n} nápovědy',
    en: 'New rank: {name}! +{n} hints',
    de: 'Neuer Rang: {name}! +{n} Hinweise',
  },
  mapTitle: { cs: 'Mapa Kory', en: 'Map of Kora', de: 'Karte von Kora' },
  eventTitle: { cs: 'Víkendový event', en: 'Weekend event', de: 'Wochenend-Event' },
  eventReward: {
    cs: 'Dokonči všechny 3 levely: +{n} nápovědy',
    en: 'Finish all 3 levels: +{n} hints',
    de: 'Schaffe alle 3 Level: +{n} Hinweise',
  },
  eventClaimed: {
    cs: 'Event splněn! +{n} nápovědy',
    en: 'Event complete! +{n} hints',
    de: 'Event geschafft! +{n} Hinweise',
  },
  eventOnlyWeekend: {
    cs: 'Jen o víkendu',
    en: 'Weekends only',
    de: 'Nur am Wochenende',
  },
  packColors: { cs: 'Barevné sítě', en: 'Color grids', de: 'Farbnetze' },
  packMaze: { cs: 'Bludiště', en: 'Maze', de: 'Labyrinth' },
  packIce: { cs: 'Ledové jádro', en: 'Frozen core', de: 'Eiskern' },
  packPortals: { cs: 'Portály', en: 'Portals', de: 'Portale' },
  dailyDone: { cs: 'Dnes splněno', en: 'Done today', de: 'Heute geschafft' },
  score: { cs: 'Skóre: {n}', en: 'Score: {n}', de: 'Punkte: {n}' },
  rushOver: { cs: 'Konec času', en: 'Time is up', de: 'Zeit abgelaufen' },
  rushSolved: { cs: 'Vyřešená pole: {n}', en: 'Grids solved: {n}', de: 'Gelöste Felder: {n}' },
  soundLabel: { cs: 'Zvuk', en: 'Sound', de: 'Ton' },
  helpTitle: { cs: 'Jak hrát', en: 'How to play', de: 'Spielanleitung' },
  helpGoal: { cs: 'Cíl hry', en: 'Goal', de: 'Ziel' },
  helpGoalText: {
    cs: 'Klikáním otáčej dlaždice po směru hodinových ručiček. Vyhraješ, když je každá dlaždice propojená s jádrem — energie pak proudí celou sítí.',
    en: 'Tap tiles to rotate them clockwise. You win when every tile is connected to a core — energy then flows through the whole grid.',
    de: 'Tippe Kacheln, um sie im Uhrzeigersinn zu drehen. Du gewinnst, wenn jede Kachel mit einem Kern verbunden ist — dann fließt Energie durchs ganze Netz.',
  },
  helpColors: {
    cs: 'Více jader a barvy',
    en: 'Multiple cores & colors',
    de: 'Mehrere Kerne & Farben',
  },
  helpColorsText: {
    cs: 'Některé levely mají 2–3 jádra. Všechna napájejí jednu společnou síť — je jedno, ke kterému jádru se dlaždice připojí. Barva jen ukazuje, které jádro je dané dlaždici nejblíž. Stačí, aby byla každá dlaždice napojená na libovolné jádro.',
    en: 'Some levels have 2–3 cores. They all power one shared network — it does not matter which core a tile connects to. The color only shows which core is closest to that tile. Every tile just needs a connection to any core.',
    de: 'Manche Level haben 2–3 Kerne. Alle speisen ein gemeinsames Netz — egal, mit welchem Kern eine Kachel verbunden ist. Die Farbe zeigt nur den nächstgelegenen Kern. Jede Kachel braucht nur eine Verbindung zu irgendeinem Kern.',
  },
  helpTarget: { cs: 'Cíl tahů a hvězdy', en: 'Move target & stars', de: 'Zugziel & Sterne' },
  helpTargetText: {
    cs: 'Cíl je minimální počet tahů. Zvládneš-li ho, získáš 3 hvězdy; do 1,5násobku cíle 2 hvězdy; jinak 1. Za první perfektní řešení levelu dostaneš nápovědu.',
    en: 'Target is the minimum number of moves. Match it for 3 stars; up to 1.5× the target earns 2 stars; otherwise 1. Your first perfect solve of a level earns a hint.',
    de: 'Das Ziel ist die minimale Zugzahl. Erreichst du es, gibt es 3 Sterne; bis zum 1,5-Fachen 2 Sterne; sonst 1. Die erste perfekte Lösung eines Levels bringt einen Hinweis.',
  },
  helpWrap: { cs: 'Torus', en: 'Torus', de: 'Torus' },
  helpWrapText: {
    cs: 'Levely s kroužkem v rohu jsou na torusu: levý okraj sousedí s pravým a horní s dolním. Spoj může vést „ven“ z pole a pokračuje na protější straně.',
    en: 'Levels with a small ring in the corner are on a torus: the left edge borders the right one and the top borders the bottom. A connection can leave the board and continue on the opposite side.',
    de: 'Level mit kleinem Ring in der Ecke liegen auf einem Torus: linker und rechter sowie oberer und unterer Rand grenzen aneinander. Eine Verbindung kann das Feld verlassen und auf der Gegenseite weiterlaufen.',
  },
  helpLock: { cs: 'Zamčené dlaždice', en: 'Locked tiles', de: 'Gesperrte Kacheln' },
  helpLockText: {
    cs: 'Dlaždice se zámkem a nýty nejde otočit — už jsou ve správné poloze. Ber je jako pevné body sítě.',
    en: 'Tiles with a lock and rivets cannot be rotated — they are already in the correct position. Use them as fixed anchors of the network.',
    de: 'Kacheln mit Schloss und Nieten lassen sich nicht drehen — sie sind bereits richtig ausgerichtet. Nutze sie als Fixpunkte des Netzes.',
  },
  helpLimit: { cs: 'Limit tahů', en: 'Move limit', de: 'Zuglimit' },
  helpLimitText: {
    cs: 'Těžké levely (oranžový roh) mají omezený počet tahů. Když limit vyčerpáš, level se nepovede a můžeš to zkusit znovu. Limit je vždy dosažitelný.',
    en: 'Hard levels (orange corner) have a limited number of moves. If you run out, the level fails and you can retry. The limit is always achievable.',
    de: 'Schwere Level (orange Ecke) haben eine begrenzte Zugzahl. Ist das Limit aufgebraucht, scheitert das Level und du kannst neu starten. Das Limit ist immer erreichbar.',
  },
  helpHints: { cs: 'Nápovědy', en: 'Hints', de: 'Hinweise' },
  helpHintsText: {
    cs: 'Nápověda otočí vybranou dlaždici do správné polohy a zamkne ji. Získáváš je za perfektní řešení a úspěchy. Použití nápovědy omezí hodnocení levelu na 2 hvězdy.',
    en: 'A hint rotates a chosen tile into its correct position and locks it. Earn hints with perfect solves and achievements. Using a hint caps the level rating at 2 stars.',
    de: 'Ein Hinweis dreht eine gewählte Kachel in die richtige Position und sperrt sie. Hinweise gibt es für perfekte Lösungen und Erfolge. Ein genutzter Hinweis begrenzt die Wertung auf 2 Sterne.',
  },
  helpStreak: { cs: 'Série', en: 'Streak', de: 'Serie' },
  helpStreakText: {
    cs: 'Počet perfektních řešení (3 hvězdy) v řadě za sebou. Nejlepší série se počítá do úspěchů.',
    en: 'The number of perfect (3-star) solves in a row. Your best streak counts toward achievements.',
    de: 'Anzahl perfekter (3-Sterne-)Lösungen in Folge. Die beste Serie zählt für Erfolge.',
  },
  helpAchText: {
    cs: 'Odznaky za milníky ve hře. Většina z nich odměňuje nápovědami.',
    en: 'Badges for milestones in the game. Most of them reward you with hints.',
    de: 'Abzeichen für Meilensteine im Spiel. Die meisten belohnen dich mit Hinweisen.',
  },
  helpDailyText: {
    cs: 'Každý den jeden speciální level — stejný pro všechny hráče. Za dokončení je nápověda a buduješ si denní sérii.',
    en: 'One special level every day — the same for all players. Completing it earns a hint and builds your daily streak.',
    de: 'Jeden Tag ein Spezial-Level — für alle gleich. Der Abschluss bringt einen Hinweis und verlängert deine Tages-Serie.',
  },
  helpEndlessText: {
    cs: 'Náhodně generované levely bez konce. Ideální na trénink a odpočinek.',
    en: 'Randomly generated levels without end. Great for practice and relaxing.',
    de: 'Endlos zufällig generierte Level. Ideal zum Üben und Entspannen.',
  },
  helpBlackoutText: {
    cs: 'Vidíš jen napájené dlaždice — zbytek pole je ve tmě. Otáčíš naslepo a síť postupně odhaluješ od jádra. Pamatuj si, co už jsi zkusil!',
    en: 'You only see powered tiles — the rest of the board is dark. You rotate blind and reveal the network from the core outwards. Remember what you already tried!',
    de: 'Du siehst nur versorgte Kacheln — der Rest liegt im Dunkeln. Du drehst blind und deckst das Netz vom Kern aus auf. Merk dir, was du schon probiert hast!',
  },
  helpTargets: { cs: 'Barevné cíle', en: 'Colored targets', de: 'Farbige Ziele' },
  helpTargetsText: {
    cs: 'Od Sektoru 6 napájí každé jádro vlastní síť. Koncovka s barevným kroužkem musí dostat energii jádra stejné barvy — kroužek se pak rozsvítí. Jednou trubkou může proudit i víc barev najednou; uvidíš je jako souběžné linky.',
    en: 'From Sector 6 on, each core powers its own network. An endpoint with a colored ring must receive energy from the core of the same color — the ring then lights up. A single pipe can carry several colors at once; you will see them as parallel lines.',
    de: 'Ab Sektor 6 speist jeder Kern sein eigenes Netz. Ein Endstück mit farbigem Ring muss Energie vom gleichfarbigen Kern erhalten — der Ring leuchtet dann auf. Ein Rohr kann mehrere Farben gleichzeitig führen; du siehst sie als parallele Linien.',
  },
  helpWalls: { cs: 'Zdi', en: 'Walls', de: 'Wände' },
  helpWallsText: {
    cs: 'Mezi některými dlaždicemi stojí zeď — tudy spoj nevede, i když na sebe trubky míří. Síť ji musí obejít jako v bludišti.',
    en: 'Some tiles have a wall between them — a connection cannot pass there even if the pipes point at each other. The network must go around it, maze-style.',
    de: 'Zwischen manchen Kacheln steht eine Wand — dort führt keine Verbindung hindurch, selbst wenn die Rohre aufeinander zeigen. Das Netz muss sie wie in einem Labyrinth umgehen.',
  },
  helpPortalsText: {
    cs: 'Trubka vedoucí do víru na okraji dlaždice pokračuje z párového portálu stejné barvy — klidně na druhém konci pole. Energie i barvy jím proudí úplně normálně.',
    en: 'A pipe leading into a vortex at the edge of a tile continues from the paired portal of the same color — possibly on the other side of the board. Energy and colors flow through it just like a normal pipe.',
    de: 'Ein Rohr, das in einen Wirbel am Kachelrand führt, setzt sich am gleichfarbigen Partnerportal fort — auch am anderen Ende des Feldes. Energie und Farben fließen ganz normal hindurch.',
  },
  helpFrozen: { cs: 'Zamrzlé dlaždice', en: 'Frozen tiles', de: 'Gefrorene Kacheln' },
  helpFrozenText: {
    cs: 'Zamrzlou dlaždicí nejde otáčet. Roztaje, když na ni namíříš napájenou trubku s barvou z její vločky. Pak s ní otáčíš normálně.',
    en: 'A frozen tile cannot be rotated. It melts when you point a powered pipe carrying the color on its snowflake at it. Then it rotates normally.',
    de: 'Eine gefrorene Kachel lässt sich nicht drehen. Sie taut, wenn du ein versorgtes Rohr mit der Farbe ihrer Schneeflocke auf sie richtest. Danach dreht sie sich normal.',
  },
  helpRushText: {
    cs: 'Vyřeš co nejvíc polí, než vyprší čas. Start: 90 sekund, každé vyřešené pole přidá 20 sekund. Pole se postupně zvětšují.',
    en: 'Solve as many grids as you can before time runs out. Start: 90 seconds, each solved grid adds 20 seconds. Grids grow over time.',
    de: 'Löse so viele Felder wie möglich, bevor die Zeit abläuft. Start: 90 Sekunden, jedes gelöste Feld bringt 20 Sekunden. Die Felder werden größer.',
  },
  ariaCore: { cs: 'Jádro', en: 'Core', de: 'Kern' },
  ariaLocked: { cs: 'Zamčená dlaždice', en: 'Locked tile', de: 'Gesperrte Kachel' },
  ariaTile: { cs: 'Dlaždice', en: 'Tile', de: 'Kachel' },
  ariaLockedLevel: { cs: 'Zamčený level', en: 'Locked level', de: 'Gesperrtes Level' },
} as const;

export type TKey = keyof typeof STRINGS;

export type TFunc = (key: TKey, vars?: Record<string, string | number>) => string;

export function makeT(lang: Lang): TFunc {
  return (key, vars) => {
    let text: string = STRINGS[key][lang];
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replace(`{${name}}`, String(value));
      }
    }
    return text;
  };
}

const LANG_KEY = 'jadro-lang';

export function detectLang(): Lang {
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === 'cs' || saved === 'en' || saved === 'de') return saved;
  } catch {
    // localStorage nedostupný
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  if (nav.startsWith('cs') || nav.startsWith('sk')) return 'cs';
  if (nav.startsWith('de')) return 'de';
  return 'en';
}

export function persistLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    // běžíme dál bez ukládání
  }
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFunc;
}

export const I18nContext = createContext<I18nValue | null>(null);

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (value === null) throw new Error('useI18n mimo I18nContext');
  return value;
}
