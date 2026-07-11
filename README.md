# JÁDRO

Logická hra žánru „Net/Pipes“. Otáčej dlaždice tak, aby byla celá síť napájená z jádra. 32 levelů s garantovanou řešitelností (levely se generují deterministicky ze seedu přes kostrový strom — randomizovaný Primův algoritmus).

## Ovládání

- Klik/tap na dlaždici ji otočí o 90° po směru hodinových ručiček.
- Level je vyhraný, když je každá dlaždice propojená s jádrem.
- Od levelu 17 jsou levely na torusu (okraje se propojují dokola), později přibývají další jádra a zamčené dlaždice.

## Vývoj

```sh
npm install
npm run dev    # vývojový server
npm run test   # testy generátoru (Vitest)
npm run build  # testy + typecheck + produkční build do dist/
```

## Nasazení

Čistě statický build. Repo stačí připojit na Netlify — `netlify.toml` nastaví build i publish adresář automaticky.
