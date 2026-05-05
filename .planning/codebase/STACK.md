# Technology Stack

**Analysis Date:** 2026-05-05

## Languages

**Primary:**
- JavaScript (ES2015+, browser-only) — All game code in `dino.js`. Uses `let`, arrow functions, template literals are not present but `let`/`const` and ES6 syntax are.
- HTML5 — `index.html` is the single page; uses Canvas 2D API.
- CSS3 — `dino.css` (5 lines of styling for body and `#board`).

**Secondary:**
- None.

## Runtime

**Environment:**
- Modern web browser with HTML5 Canvas 2D support and `requestAnimationFrame`. No specific browser version pinned. Works over `file://` (no fetch, no modules, no CORS surface).

**Package Manager:**
- None. There is no `package.json`, no `node_modules`, no lockfile. Pure static files.

## Frameworks

**Core:**
- None. Vanilla JS / Canvas. No game engine, no library, no bundler.

**Testing:**
- None. No test framework, no test files.

**Build/Dev:**
- None. Edit-and-reload-the-browser is the entire dev loop. There is no transpile step, no bundling, no minification.

## Key Dependencies

**Critical:**
- None — zero runtime dependencies.

**Infrastructure:**
- Browser-native: HTML5 `<canvas>`, `CanvasRenderingContext2D`, `requestAnimationFrame`, `setInterval`, DOM `keydown` events, `Image()` constructor.

## Configuration

**Environment:**
- No environment variables. No config files of any kind.

**Build:**
- No build configuration. The "build" is committing the three source files plus the `img/` directory.

## Platform Requirements

**Development:**
- Any OS with a modern browser. Optionally a static HTTP server (`python3 -m http.server`) — but `file://` works fine because nothing fetches.

**Production:**
- Static hosting (the README references a GitHub Pages demo: `imkennyyip.github.io/chrome-dinosaur-game/`). Any static-file host works: GitHub Pages, Netlify, S3+CloudFront, plain Apache/nginx.

---

*Stack analysis: 2026-05-05*
*Update after major dependency changes*
