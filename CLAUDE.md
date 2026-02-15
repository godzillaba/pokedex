# American Wildlife Pokédex

A PWA "Pokédex" for American wildlife — retro-styled catalog of ~50 North American species with Pokémon-inspired stat bars, search, and type filtering.

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
  data/species.json     # 50 wildlife species with stats
  components/
    pokedex-shell.*     # red device frame, LCD screen, decorative elements
    species-list.*      # scrollable list + search input + type filters
    species-card.*      # expanded view: image, stats, region, habitat
  hooks/
    use-species.js      # loads species.json, exposes filtered list + search/type state
public/
  icon.svg              # PWA icon
  images/animals/       # species photos (by ID: 001.jpg, 002.jpg, etc.)
```

## Data

`src/data/species.json` — array of 50 species. Each entry:
- `id`, `name`, `species` (Latin), `type` (Bird/Mammal/Reptile/Amphibian/Fish/Insect/Arachnid)
- `region`, `habitat`, `description`
- `stats`: `size`, `speed`, `rarity`, `danger` (0–100)
- `image`: path relative to `public/` (e.g. `images/animals/001.jpg`)

JSON is imported statically by Vite — bundled into JS, no runtime fetch.

## Commands

- `npm run dev` — dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — serve production build locally

## Development Environment

This project runs inside a devcontainer (`.devcontainer/`). The container is locked down with an iptables firewall that only allows traffic to a small allowlist of domains (npm registry, Anthropic API, VS Code marketplace, etc.).

- **To install system packages or tools** — edit `.devcontainer/Dockerfile` and rebuild the container.
- **To allow network access to a new domain** — add it to the domain list in `.devcontainer/init-firewall.sh`.
- **Don't `apt-get install` or `npm install -g` at runtime** — it either won't survive a rebuild or will be blocked by the firewall. Put it in the Dockerfile.

## Tooling Philosophy

Always use the right tool for the job — install real libraries instead of reimplementing things with stdlib. If a dependency is missing and can't be installed due to the container/firewall setup, ask the user to help unblock it (e.g. add a domain to the firewall, add a package to the Dockerfile, rebuild the container). Don't silently work around missing tools with inferior hand-rolled alternatives.

## Frontend Debugging

Use the `/playwright` skill (Playwright) to verify frontend changes — take screenshots, read rendered text, check console errors, test interactions. Use it proactively after UI changes, don't wait to be asked.

## Documentation

When adding or modifying a feature, always update the relevant README if one exists (e.g. `scrape/README.md` for pipeline changes). Keep docs in sync with code.

## Code Style

Inspired by NASA/JPL's "Power of 10" — code must be quickly and easily reviewable by a human.

- Write minimal, concise code. No unnecessary abstractions or indirection.
- Functions should be short enough to fit on a screen (~60 lines max). If longer, split by responsibility.
- Simple control flow. Minimal nesting, early returns over deep if/else chains.
- Smallest possible scope for all variables and data.
- No comments unless the logic is genuinely non-obvious. Never restate what the code already says.
- No JSDoc unless it's a public API. Skip @param/@returns that just repeat type signatures.
- Don't add error handling, validation, or fallbacks for cases that can't realistically happen.
- Prefer fewer lines. Three similar lines are better than a helper function used once.
- Don't refactor, rename, or "improve" code you weren't asked to change.
- No clever tricks. Code should be obvious, not impressive.
