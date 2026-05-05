# External Integrations

**Analysis Date:** 2026-05-05

## APIs & External Services

**None.** This codebase makes zero outbound network calls. There is no `fetch`, no `XMLHttpRequest`, no WebSocket, no analytics SDK, no error tracker. The game runs entirely in the browser tab, offline-capable.

## Data Storage

**Databases:** None.

**File Storage:** None — sprite images are bundled in `img/` and loaded as same-origin static assets via `new Image()` with relative paths (`./img/dino.png`, `./img/cactus1.png`, etc.). See `dino.js:57-69` and `dino.js:96`.

**Caching:** None. The browser HTTP cache may cache images, but the code does no explicit caching, no `localStorage`, no `sessionStorage`, no `IndexedDB`. High scores are not persisted across reloads.

## Authentication & Identity

None. The game has no user concept, no accounts, no session.

## Monitoring & Observability

**Error Tracking:** None.

**Analytics:** None.

**Logs:** None — no `console.log` calls in `dino.js`.

## CI/CD & Deployment

**Hosting:**
- The README references a GitHub Pages demo at `https://imkennyyip.github.io/chrome-dinosaur-game/` (the upstream tutorial author's deployment). This fork has no current deployment configured.
- No `gh-pages` branch, no Netlify config, no Vercel config, no Dockerfile.

**CI Pipeline:**
- None. No `.github/workflows/`, no CI config files.

## Environment Configuration

**Development:**
- Required env vars: none.
- Secrets location: none (no secrets exist).
- Mock/stub services: not applicable.

**Staging / Production:**
- Not applicable — single-environment static site.

## Webhooks & Callbacks

**Incoming:** None.

**Outgoing:** None.

## Asset Inventory

The game's sole "external" dependency is its sprite assets in `img/`:

- Used by current code: `dino.png`, `dino-dead.png`, `cactus1.png`, `cactus2.png`, `cactus3.png`
- Bundled but unused: `bird1.png`, `bird2.png`, `cloud.png`, `dino-duck1.png`, `dino-duck2.png`, `dino-jump.png`, `dino-run1.png`, `dino-run2.png`, `track.png`, `game-over.png`, `reset.png`, `big-cactus1.png`, `big-cactus2.png`, `big-cactus3.png`

Unused assets are intentional — they support future features (animation frames, birds, restart screen) referenced in the original tutorial.

---

*Integration audit: 2026-05-05*
*Update when adding/removing external services*
