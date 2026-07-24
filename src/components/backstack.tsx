import { createContext, useContext, useEffect, useRef } from 'react';

// ---------- Vrstvy pro hardwarové tlačítko Zpět ----------
// Každá otevřená vrstva (modal, obrazovka hry) přidá záznam do historie
// prohlížeče. Zpět tak zavře vrstvu místo ukončení celé aplikace — na
// Androidu (TWA) je to zásadní, jinak gesto zpět vyhodí hráče ze hry.

type Fn = () => void;

export interface BackApi {
  push: (fn: Fn) => void;
  pop: (fn: Fn) => void;
}

export const BackContext = createContext<BackApi | null>(null);

/**
 * Zaregistruje vrstvu, dokud je `active`. Když hráč stiskne Zpět, zavolá se
 * `onBack`. Když se vrstva zavře z UI, záznam v historii se sám odstraní,
 * takže historie i UI zůstávají v souladu.
 */
export function useBackLayer(active: boolean, onBack: () => void): void {
  useBackLayerWith(useContext(BackContext), active, onBack);
}

/** Varianta pro App, která zásobník sama vytváří (je nad kontextem). */
export function useBackLayerWith(
  api: BackApi | null,
  active: boolean,
  onBack: () => void,
): void {
  const cb = useRef(onBack);
  cb.current = onBack;

  useEffect(() => {
    if (!active || api === null) return;
    let closedByBack = false;
    const fn = (): void => {
      closedByBack = true;
      cb.current();
    };
    api.push(fn);
    return () => {
      // zavřeno z UI (ne tlačítkem Zpět) → srovnej historii
      if (!closedByBack) api.pop(fn);
    };
  }, [active, api]);
}

interface BackStackOptions {
  // zavolá se, když hráč zkusí odejít z hlavní obrazovky (nabídneme potvrzení)
  onExitAttempt: () => boolean; // true = ukázali jsme výzvu, odchod zrušit
}

/**
 * Vytvoří API zásobníku vrstev a napojí ho na `popstate`.
 * Historie drží jeden „strážní" záznam navíc, aby šlo zachytit i pokus
 * o odchod z hlavní obrazovky.
 */
export function useBackStack({ onExitAttempt }: BackStackOptions): BackApi {
  const layers = useRef<Fn[]>([]);
  const depth = useRef(0);
  // kolik popstate událostí jsme vyvolali sami (zavření vrstvy z UI)
  const ignore = useRef(0);
  const exitRef = useRef(onExitAttempt);
  exitRef.current = onExitAttempt;

  useEffect(() => {
    const pushGuard = (): void => {
      try {
        window.history.pushState({ coreDepth: 0, coreGuard: true }, '');
      } catch {
        // historie nedostupná — hra běží dál bez záchytu
      }
    };
    try {
      window.history.replaceState({ coreDepth: 0 }, '');
    } catch {
      // bez historie
    }
    pushGuard();

    const onPop = (event: PopStateEvent): void => {
      // návrat, který jsme vyvolali sami při zavření vrstvy z UI — stav už sedí
      if (ignore.current > 0) {
        ignore.current -= 1;
        return;
      }
      const state = event.state as { coreDepth?: number } | null;
      const target = typeof state?.coreDepth === 'number' ? state.coreDepth : 0;

      if (depth.current > target) {
        // zavři vrstvy až na cílovou hloubku
        while (depth.current > target) {
          const fn = layers.current.pop();
          depth.current -= 1;
          if (fn !== undefined) fn();
        }
        // strážní záznam znovu, ať je co příště spotřebovat
        if (depth.current === 0) pushGuard();
        return;
      }

      // jsme na hlavní obrazovce a hráč chce odejít
      if (exitRef.current()) pushGuard();
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const api = useRef<BackApi>({
    push: (fn: Fn) => {
      depth.current += 1;
      layers.current.push(fn);
      try {
        window.history.pushState({ coreDepth: depth.current }, '');
      } catch {
        // bez historie
      }
    },
    pop: (fn: Fn) => {
      const i = layers.current.lastIndexOf(fn);
      if (i === -1) return;
      layers.current.splice(i, 1);
      depth.current -= 1;
      ignore.current += 1;
      try {
        window.history.back();
      } catch {
        ignore.current -= 1;
      }
    },
  });

  return api.current;
}
