# American Wildlife Pokédex

A PWA "Pokédex" for American wildlife — retro-styled catalog of North American species with Pokémon-inspired stat bars, search, and type filtering.

## Tech Stack

- **Vite** — build tool and dev server
- **Preact** — UI framework (~3KB, React-compatible API via `@preact/preset-vite`)
- **Plain CSS** — custom properties for the retro Pokédex theme
- **vite-plugin-pwa** — service worker generation + web app manifest
- **GitHub Pages** — static hosting via GitHub Actions (`.github/workflows/deploy.yml`)

## Project Structure

```
src/
  main.jsx              # entry point, renders <App />
  app.jsx               # top-level component (shell + list/card routing)
  app.css               # global reset + CSS custom properties
  data/species.json     # wildlife species with stats
  components/
    pokedex-shell.*     # LCD screen wrapper with scanline overlay
    species-list.*      # scrollable list + search input + type filters
    species-card.*      # expanded view: image, stats, region, habitat
  hooks/
    use-species.js      # loads species.json, exposes filtered list + search/type state
public/
  icon.svg              # PWA icon
  images/animals/       # species photos (by slug: Bald_eagle.png, etc.)
  images/originals/     # raw ZIM photos as fallbacks (by slug: Bald_eagle.webp, etc.)
```

## Data

`src/data/species.json` — array of species. Each entry:
- `id`: stable wiki-slug string (e.g. `"Bald_eagle"`) extracted from `wiki_url` — used as lookup key in localStorage and React keys. Display number (`#001`) is derived from array position at runtime via `number` property, not stored in JSON.
- `name`, `species` (Latin), `type` (Bird/Mammal/Reptile/Amphibian/Fish/Insect/Arachnid)
- `region`, `habitat`, `description`, `conservation_status` (IUCN status, omitted if unknown)
- `stats`: `size`, `speed`, `rarity`, `danger` (0–100)
- `image`: path relative to `public/` (e.g. `images/animals/Bald_eagle.png`) — pixelated sprite, named by slug
- `original_image`: Wikimedia Commons thumbnail URL (800px) for the high-res photo (omitted if no image)
- `fallback_image`: path to local ZIM original (e.g. `images/originals/Bald_eagle.webp`) — offline fallback when Wikimedia fails (omitted if no ZIM image)
- `wiki_url`: full Wikipedia URL (e.g. `https://en.wikipedia.org/wiki/Grizzly_bear`)

JSON is imported statically by Vite — bundled into JS, no runtime fetch.

## Commands

- `npm run dev` — dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — serve production build locally
- `npm test` — run test suite (vitest)
- `npm run test:watch` — run tests in watch mode

## Tests

Uses **vitest** + **@testing-library/preact** + **jsdom**. Config lives in the `test` block of `vite.config.js`; global setup in `src/test-setup.js` (imports jest-dom matchers).

```
src/
  test-setup.js                          # jest-dom/vitest matchers
  app.test.jsx                           # navigation state machine, popstate, history
  hooks/
    use-log.test.js                      # localStorage, toggleSeen, setNote, setDate, clearLog, migration
    use-species.test.js                  # search, type/status/seen filters, computed arrays
  components/
    sighting-log.test.jsx                # empty states, date sorting, entry rendering
    species-card.test.jsx                # image cascade, seen state, callbacks, info
    species-list.test.jsx                # entries, indicators, search/filter callbacks, buttons
    settings.test.jsx                    # confirmation flow (clear → confirm → YES/CANCEL)
```

All component/hook tests mock `species.json` with a small fixture (2–3 entries) via `vi.mock()` to avoid loading the full dataset. The mock path must match the import path relative to the file under test.
