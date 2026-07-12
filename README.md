# CORE

Logická hra žánru „Net/Pipes“ (pracovní název JÁDRO). Otáčej dlaždice tak, aby byla celá síť napájená z jádra. 100 levelů s garantovanou řešitelností (deterministický generátor ze seedu — kostrový strom randomizovaným Primovým algoritmem), denní výzva, nekonečný režim, nápovědy, úspěchy a tři jazyky (CS/EN/DE).

**Hraj online:** https://taronwho.github.io/J-dro-/

## Ovládání

- Klik/tap na dlaždici ji otočí o 90° po směru hodinových ručiček.
- Level je vyhraný, když je každá dlaždice propojená s jádrem (u více jader stačí libovolné — všechna napájejí společnou síť, barvy jen ukazují nejbližší jádro).
- Od levelu 17 jsou levely na torusu (okraje se propojují dokola), od 25 přibývají další jádra a zamčené dlaždice, od 61 limity tahů.
- Nápověda (💡) otočí vybranou dlaždici do správné polohy a zamkne ji; získává se za perfektní řešení (3★) a úspěchy.
- Vysvětlení všech ikon a mechanik je ve hře pod tlačítkem „?“.

## Vývoj

```sh
npm install
npm run dev    # vývojový server
npm run test   # testy generátoru (Vitest, 800 testů)
npm run build  # testy + typecheck + produkční build do dist/
```

Postup hráče se ukládá do `localStorage` (klíč `jadro-progress`), s fallbackem do paměti. Odkaz `…/#unlock-all` odemkne všechny levely (pro testování).

## Nasazení webu

Čistě statický build s PWA podporou (manifest + service worker = funguje offline a jde „nainstalovat“ z prohlížeče).

- **GitHub Pages**: nasazuje se automaticky při každém pushi (`.github/workflows/deploy.yml`).
- **Netlify**: stačí připojit repo, `netlify.toml` nastaví vše sám.

## Google Play (TWA)

Hra je připravená k zabalení do Android aplikace přes [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) (Trusted Web Activity). Postup hráče se v aplikaci ukládá stejně jako na webu (localStorage v profilu aplikace) a přežívá restarty i aktualizace.

Předpoklady: Node.js, JDK 17, Android SDK (Bubblewrap si je umí stáhnout sám), účet [Google Play Console](https://play.google.com/console) (jednorázově 25 USD).

```sh
npm i -g @bubblewrap/cli

# 1. Inicializace z manifestu (předvyplněno v twa-manifest.json v kořeni repa)
bubblewrap init --manifest https://taronwho.github.io/J-dro-/manifest.webmanifest

# 2. Build — vytvoří app-release-bundle.aab (a .apk na testování)
bubblewrap build

# 3. Nahraj .aab do Play Console (Production nebo Internal testing)
```

Po prvním nahrání do Play Console:

1. V Play Console otevři **Setup → App signing** a zkopíruj **SHA-256 certificate fingerprint**.
2. Vlož ho do `public/.well-known/assetlinks.json` (nahraď `REPLACE_WITH_SHA256_FINGERPRINT_FROM_PLAY_CONSOLE`).
3. Pushni — web se přenasadí a aplikace pak poběží celoobrazovkově bez lišty prohlížeče.

Ikony (`public/icons/`) i barvy jsou připravené, `twa-manifest.json` obsahuje doporučenou konfiguraci balíčku (`io.github.taronwho.core`).
