# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vanilla HTML/CSS/JS clone of the Chrome offline dinosaur game, drawn on a 750x250 `<canvas>`. No package manager, no build step, no test suite, no framework — three files (`index.html`, `dino.css`, `dino.js`) plus image assets in `img/`. Originally a YouTube tutorial project (see README).

## Running

Open `index.html` directly in a browser, or serve the directory with any static server (e.g. `python3 -m http.server` then visit `http://localhost:8000/`). Use a server rather than `file://` if you ever add `fetch`/module loading — the current code works fine over `file://`.

There are no install, build, lint, or test commands. Iteration loop is: edit → reload browser.

## Architecture

All game state and logic live in `dino.js` as module-level `let` globals (no classes, no modules). The lifecycle:

- `window.onload` sets up the canvas, loads images, and starts two timers:
  - `requestAnimationFrame(update)` — the render/physics loop, runs every frame.
  - `setInterval(placeCactus, 1000)` — cactus spawner, runs once per second independent of frame rate.
- `update()` clears the canvas, advances dino physics, advances every cactus in `cactusArray`, draws everything, runs collision detection, and increments `score`. It re-schedules itself with `requestAnimationFrame` regardless of `gameOver` (early-returns inside, but keeps the RAF alive — keep this in mind if you add a restart feature).
- `moveDino(keydown handler)` handles input. Jump = `velocityY = -10`; gravity (`+= 0.4` per frame in `update`) brings the dino back down. The `Math.min(dino.y + velocityY, dinoY)` line clamps to the ground — `dinoY` here is the *constant* ground position (initial dino.y), not the current position.
- `placeCactus()` randomly chooses cactus1/2/3 (or no cactus) by probability bands on `Math.random()`. It shifts the array if it exceeds 5 entries — note this can drop a cactus that's still on screen if spawn rate ever outpaces scroll, so don't assume `cactusArray` is the full set of visible cacti if you change `velocityX` or the spawn interval.
- `detectCollision(a, b)` is standard AABB overlap on `{x, y, width, height}`.

Coordinate system: canvas origin is top-left, y grows downward. The "ground" is `boardHeight - height` for each entity.

## Asset notes

`img/` contains assets the current code doesn't use yet — `bird1/2`, `dino-duck1/2`, `dino-run1/2`, `dino-jump`, `cloud`, `track`, `game-over`, `reset`, `big-cactus1/2/3`. The `ArrowDown` branch in `moveDino` is an empty placeholder for a duck animation. If extending the game (animation frames, birds, restart UI), these are the intended assets.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Chrome Dinosaur Game**

A browser-based clone of the offline Chrome dinosaur game. Players press Space/ArrowUp to make a pixel dinosaur jump over scrolling cacti and ArrowDown to duck under flying birds. The game runs on a 750×250 HTML5 canvas with zero dependencies, no build step, and no backend — three source files (`index.html`, `dino.js`, `dino.css`) plus PNG sprites in `img/`.

The current codebase is the result of a YouTube tutorial (linked in README.md). It implements the static-sprite version: a non-animated dino, three cactus variants, a scrolling cactus loop, AABB collision, and a basic score. The v1.0 milestone — "sprite animations" — brings the game to feature parity with the original Chrome dino on visual polish and bird mechanics.

**Core Value:** **The game must feel like the real Chrome dino game when you play it.** Every animation, hitbox, and timing decision should be measured against that single benchmark. If a feature doesn't make the game feel more like the original, it's lower priority.

### Constraints

- **Tech stack**: Vanilla JS, HTML5 Canvas 2D, plain CSS. No package manager, no bundler, no transpiler. — Existing project nature; introducing build tooling is its own multi-phase decision.
- **Browser-only**: Must run from `file://` and over static HTTP without modification. — Matches current deployment model (GitHub Pages-style hosting).
- **Zero runtime dependencies**: No npm packages, no CDN scripts. — Established by the existing project; reflects "tiny self-contained game" identity.
- **Single-file game logic**: All game code stays in `dino.js`. Splitting into modules would require introducing `<script type="module">` and changing how the game loads. — Defer that refactor; not needed for v1.0.
- **Hitbox compatibility**: Existing `detectCollision(a, b)` requires `{x, y, width, height}` — any new entity (birds, ducking-dino) must match this shape.
- **Performance**: Non-issue at current scale. Canvas redraw budget at 750×250 with <10 entities is far below 16 ms/frame even for naïve implementations.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (ES2015+, browser-only) — All game code in `dino.js`. Uses `let`, arrow functions, template literals are not present but `let`/`const` and ES6 syntax are.
- HTML5 — `index.html` is the single page; uses Canvas 2D API.
- CSS3 — `dino.css` (5 lines of styling for body and `#board`).
- None.
## Runtime
- Modern web browser with HTML5 Canvas 2D support and `requestAnimationFrame`. No specific browser version pinned. Works over `file://` (no fetch, no modules, no CORS surface).
- None. There is no `package.json`, no `node_modules`, no lockfile. Pure static files.
## Frameworks
- None. Vanilla JS / Canvas. No game engine, no library, no bundler.
- None. No test framework, no test files.
- None. Edit-and-reload-the-browser is the entire dev loop. There is no transpile step, no bundling, no minification.
## Key Dependencies
- None — zero runtime dependencies.
- Browser-native: HTML5 `<canvas>`, `CanvasRenderingContext2D`, `requestAnimationFrame`, `setInterval`, DOM `keydown` events, `Image()` constructor.
## Configuration
- No environment variables. No config files of any kind.
- No build configuration. The "build" is committing the three source files plus the `img/` directory.
## Platform Requirements
- Any OS with a modern browser. Optionally a static HTTP server (`python3 -m http.server`) — but `file://` works fine because nothing fetches.
- Static hosting (the README references a GitHub Pages demo: `imkennyyip.github.io/chrome-dinosaur-game/`). Any static-file host works: GitHub Pages, Netlify, S3+CloudFront, plain Apache/nginx.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Code Style
- `let` for everything, including values that are never reassigned (`let boardWidth = 750`). The codebase predates or simply doesn't follow the modern `const`-by-default convention. Be aware: introducing `const` in a refactor is a stylistic break that should be done deliberately, not piecemeal.
- No `var`.
## Naming
## Patterns
- `let velocityX = -8; //cactus moving left speed`
- `setInterval(placeCactus, 1000); //1000 milliseconds = 1 second`
- `if (placeCactusChance > .90) { //10% you get cactus3`
## Error Handling
## Async / Concurrency
- `requestAnimationFrame(update)` — render/physics, ~60 fps.
- `setInterval(placeCactus, 1000)` — spawn, 1 Hz.
## What's Not in This Codebase
- No type system (JS, no JSDoc types, no TS).
- No linting config (no `.eslintrc`, no `.prettierrc`, no `.editorconfig`).
- No formatting enforcement.
- No git hooks.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern
## Layers
| Concern | Where it lives |
|---------|----------------|
| Bootstrapping | `window.onload` handler in `dino.js:45-74` — reads canvas, loads images, starts loops, attaches keydown |
| Render + physics tick | `update()` in `dino.js:76-108` — runs per `requestAnimationFrame` |
| Input handling | `moveDino(e)` in `dino.js:110-123` — `keydown` listener |
| Entity spawning | `placeCactus()` in `dino.js:125-160` — runs per `setInterval` (1000ms) |
| Collision detection | `detectCollision(a, b)` in `dino.js:162-167` — pure AABB function |
| State | Module-level `let` globals in `dino.js:1-43` |
## Data Flow
```
```
## Abstractions
- **Entity shape contract:** `detectCollision(a, b)` requires both arguments expose `{x, y, width, height}`. This is the closest thing to an interface in the codebase. Both `dino` and each cactus object satisfy this shape.
- **Image loading is fire-and-forget:** Images are constructed in `window.onload`, given a `src`, and are expected to be ready by the time `update()` first uses them. This works in practice because the cactus images are in the same directory (browser parses + decodes quickly) but is technically a race — the very first `drawImage` call for an image could no-op if the image hasn't decoded. The dino's first paint guards against this with an `onload` callback (`dino.js:58-60`); the cactus images do not.
- **The "ground" constant:** `dinoY` (`dino.js:12`) serves double duty — it's the dino's initial y *and* the ground constant used by `Math.min(dino.y + velocityY, dinoY)` (`dino.js:85`) to clamp gravity. Renaming/changing one without the other would silently break jump physics.
## Entry Points
- **`index.html`** — loaded by browser. Contains a `<canvas id="board">` and `<script src="dino.js">`. The script runs at parse time, but all setup is gated behind `window.onload` (`dino.js:45`), so DOM is guaranteed ready.
- **`dino.js:45` `window.onload`** — the runtime entry. Wires everything up, then yields control to:
## Notable Architectural Properties
- **`update()` re-schedules itself unconditionally.** `requestAnimationFrame(update)` is the first line of `update()` (`dino.js:77`), called *before* the `gameOver` early-return. Consequence: after game over, `update` keeps firing, just no-ops. This is benign today but matters for any restart feature (the loop is already running, you'd just need to reset state).
- **`placeCactus` *also* runs forever.** The `setInterval` is never cleared. After game over it early-returns (`dino.js:126-128`), but the timer keeps ticking.
- **Cactus pruning is by count, not by position.** `cactusArray.shift()` runs when length > 5 (`dino.js:157-159`). At the current `velocityX = -8` and 1 spawn/sec, off-screen cacti naturally exit before the array reaches 5, so this is a safety net rather than the primary cleanup. Changing scroll speed or spawn rate could turn this into a correctness bug (cacti shifted off the array while still visible).
- **`gameOver` is one-way.** Nothing in the code resets it back to `false`. Restart requires a page reload today.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
