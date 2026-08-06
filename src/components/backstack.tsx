import { createContext, useContext, useEffect, useRef } from 'react';

// ---------- Vrstvy pro hardwarové tlačítko Zpět ----------
// Každá otevřená vrstva (modal, obrazovka hry) drží jeden záznam v historii
// prohlížeče. Zpět tak zavře vrstvu místo ukončení celé aplikace — na
// Androidu (TWA) je to zásadní, jinak gesto zpět vyhodí hráče ze hry.
//
// Historie se nesynchronizuje hned při každé změně, ale až v mikroúloze na
// konci překreslení. Když se v jednom kroku jedna vrstva zavře a druhá
// otevře (tutoriál → start levelu), obě změny se vyruší a s historií se
// vůbec nehýbe — jinak by se rozešla se stavem a hra by odnavigovala pryč.

type Fn = () => void;

export interface BackApi {
  push: (fn: Fn) => void;
  pop: (fn: Fn) => void;
}

export const BackContext = createContext<BackApi | null>(null);

/**
 * Zaregistruje vrstvu, dokud je `active`. Po stisku Zpět se zavolá `onBack`.
 * Zavření z UI záznam v historii uklidí samo.
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
      // zavřeno z UI (ne tlačítkem Zpět) → uklidíme záznam v historii
      if (!closedByBack) api.pop(fn);
    };
  }, [active, api]);
}

interface BackStackOptions {
  /** Vrátí true, pokud jsme místo odchodu ukázali výzvu k potvrzení. */
  onExitAttempt: () => boolean;
}

export function useBackStack({ onExitAttempt }: BackStackOptions): BackApi {
  const layers = useRef<Fn[]>([]);
  const hist = useRef(0); // kolik záznamů vrstev jsme vložili nad základ
  const ignore = useRef(0); // popstate události, které jsme vyvolali sami
  const queued = useRef(false);
  const exitRef = useRef(onExitAttempt);
  exitRef.current = onExitAttempt;

  const apiRef = useRef<BackApi | null>(null);
  if (apiRef.current === null) {
    const sync = (): void => {
      queued.current = false;
      const want = layers.current.length;
      try {
        if (want > hist.current) {
          while (hist.current < want) {
            hist.current += 1;
            window.history.pushState({ coreDepth: hist.current }, '');
          }
        } else if (want < hist.current) {
          const delta = hist.current - want;
          hist.current = want;
          ignore.current += 1;
          window.history.go(-delta);
        }
      } catch {
        // historie nedostupná — hra běží dál bez záchytu
      }
    };
    const queueSync = (): void => {
      if (queued.current) return;
      queued.current = true;
      queueMicrotask(sync);
    };
    apiRef.current = {
      push: (fn: Fn) => {
        layers.current.push(fn);
        queueSync();
      },
      pop: (fn: Fn) => {
        const i = layers.current.lastIndexOf(fn);
        if (i === -1) return;
        layers.current.splice(i, 1);
        queueSync();
      },
    };
  }

  useEffect(() => {
    try {
      // pod aplikací necháme jeden záznam navíc, ať zachytíme i pokus o odchod
      window.history.replaceState({ coreDepth: -1 }, '');
      window.history.pushState({ coreDepth: 0 }, '');
    } catch {
      // bez historie
    }

    const onPop = (event: PopStateEvent): void => {
      if (ignore.current > 0) {
        ignore.current -= 1;
        return;
      }
      const state = event.state as { coreDepth?: number } | null;
      const target = typeof state?.coreDepth === 'number' ? state.coreDepth : -1;

      if (target < 0) {
        // hráč je na hlavní obrazovce a chce ze hry ven
        if (exitRef.current()) {
          try {
            window.history.pushState({ coreDepth: 0 }, '');
          } catch {
            // bez historie
          }
        }
        return;
      }

      hist.current = target;
      while (layers.current.length > target) {
        const fn = layers.current.pop();
        if (fn !== undefined) fn();
      }
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return apiRef.current;
}
