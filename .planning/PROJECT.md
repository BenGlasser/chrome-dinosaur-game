# Chrome Dinosaur Game

## What This Is

A browser-based clone of the offline Chrome dinosaur game. Players press Space/ArrowUp to make a pixel dinosaur jump over scrolling cacti and ArrowDown to duck under flying birds. The game runs on a 750×250 HTML5 canvas with zero dependencies, no build step, and no backend — three source files (`index.html`, `dino.js`, `dino.css`) plus PNG sprites in `img/`.

The current codebase is the result of a YouTube tutorial (linked in README.md). It implements the static-sprite version: a non-animated dino, three cactus variants, a scrolling cactus loop, AABB collision, and a basic score. The v1.0 milestone — "sprite animations" — brings the game to feature parity with the original Chrome dino on visual polish and bird mechanics.

## Core Value

**The game must feel like the real Chrome dino game when you play it.** Every animation, hitbox, and timing decision should be measured against that single benchmark. If a feature doesn't make the game feel more like the original, it's lower priority.

## Requirements

### Validated

<!-- Capabilities the current code already delivers, inferred from .planning/codebase/. -->

- ✓ **CORE-01**: Dino jumps on Space/ArrowUp from the ground (`dino.js:115-118`) — existing
- ✓ **CORE-02**: Cacti spawn periodically (1 Hz) and scroll left at constant speed (`dino.js:72`, `dino.js:91`) — existing
- ✓ **CORE-03**: Three cactus variants (small, medium, large) appear with weighted probabilities (`dino.js:139-155`) — existing
- ✓ **CORE-04**: Dino-vs-cactus collision triggers game over with dead-dino sprite swap (`dino.js:94-100`) — existing
- ✓ **CORE-05**: Score increments while running (`dino.js:104-107`) — existing
- ✓ **CORE-06**: Game runs on a 750×250 HTML5 canvas with no dependencies (`index.html`, `dino.js`) — existing

### Active

<!-- v1.0 milestone: sprite animations. -->

**Dino animations:**
- [ ] Dino plays a 2-frame running animation (alternating `dino-run1.png`/`dino-run2.png`) when on the ground
- [ ] Dino swaps to `dino-jump.png` while airborne
- [ ] Dino plays a 2-frame ducking animation (`dino-duck1.png`/`dino-duck2.png`) while ArrowDown is held on the ground
- [ ] Dino's hitbox shrinks while ducking so birds at duck height pass overhead

**Bird obstacles:**
- [ ] Birds spawn at varying heights and scroll left like cacti
- [ ] Birds animate with alternating `bird1.png`/`bird2.png` frames (flapping)
- [ ] Bird-vs-dino collision triggers game over (same path as cactus collision)
- [ ] At least one bird height requires ducking (cannot be jumped or run-under at standing height)

**Background:**
- [ ] `track.png` renders as a scrolling ground that moves left at game speed (replacing the current flat lightgray + 1px border)

**Restart:**
- [ ] After game over, pressing any key resets state and starts a new run (no page reload)

### Out of Scope (v1.0)

- **High-score persistence** — adds storage surface (localStorage) and UI; defer to a later milestone
- **Difficulty / speed scaling over time** — adds tuning complexity; constant-speed parity with current behavior is fine for v1.0
- **Score-gated bird appearance** (original game hides birds until score 450+) — explicitly chose to surface birds from the start in v1.0 for simpler tuning; revisit if pacing suffers
- **Sound effects** — would require asset selection and load handling; out of scope for animation milestone
- **Cloud / parallax background** — `cloud.png` exists but skipped in v1.0; user explicitly chose track-only
- **Mobile / touch controls** — keyboard only
- **Big cactus variants** (`big-cactus*.png`) — sprites exist but unused; not requested
- **Game-over UI** (`game-over.png`, `reset.png`) — not requested for v1.0; restart is key-driven, not button-driven
- **Tests / CI** — manual play-testing remains the verification loop for v1.0
- **Build pipeline / bundler** — vanilla-JS-zero-deps is a deliberate constraint

## Context

**Codebase state:** Single 167-line `dino.js` with module-level globals and four functions: `update`, `moveDino`, `placeCactus`, `detectCollision`. See `.planning/codebase/ARCHITECTURE.md` for the data flow and `.planning/codebase/CONCERNS.md` for known fragile coupling.

**Asset readiness:** Every sprite v1.0 needs is already in `img/` — `dino-run1/2.png`, `dino-jump.png`, `dino-duck1/2.png`, `bird1/2.png`, `track.png`. Nothing needs to be drawn or sourced; this is a wiring exercise, not an art exercise.

**Tutorial origin:** The codebase follows a YouTube tutorial style — globals at the top, plain functions, magic numbers commented in line. Maintain that style; do not refactor to classes/modules in v1.0.

**Render-loop architecture matters here:** Existing physics uses `requestAnimationFrame` for per-frame updates and `setInterval(1000ms)` for cactus spawning. Adding animations will require a frame counter (or wall-clock time) inside `update()` to drive sprite-frame swaps. Adding birds will need a second spawner or a unified obstacle spawner — design choice deferred to phase planning.

## Constraints

- **Tech stack**: Vanilla JS, HTML5 Canvas 2D, plain CSS. No package manager, no bundler, no transpiler. — Existing project nature; introducing build tooling is its own multi-phase decision.
- **Browser-only**: Must run from `file://` and over static HTTP without modification. — Matches current deployment model (GitHub Pages-style hosting).
- **Zero runtime dependencies**: No npm packages, no CDN scripts. — Established by the existing project; reflects "tiny self-contained game" identity.
- **Single-file game logic**: All game code stays in `dino.js`. Splitting into modules would require introducing `<script type="module">` and changing how the game loads. — Defer that refactor; not needed for v1.0.
- **Hitbox compatibility**: Existing `detectCollision(a, b)` requires `{x, y, width, height}` — any new entity (birds, ducking-dino) must match this shape.
- **Performance**: Non-issue at current scale. Canvas redraw budget at 750×250 with <10 entities is far below 16 ms/frame even for naïve implementations.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Birds added as flying *obstacles*, not decoration | Decoration-only birds wouldn't justify the duck mechanic; obstacles are why the duck animation exists | — Pending |
| Duck mechanic implemented as part of v1.0 | If birds are obstacles, ducking must work — they're a coupled pair | — Pending |
| Restart in scope (any-key reset) | Without restart, testing animations across deaths means reload-per-iteration; degrades dev loop and player experience | — Pending |
| Track-only background, no clouds in v1.0 | Smallest scope that achieves "feels like Chrome dino" — clouds are polish | — Pending |
| Constant-speed (no difficulty scaling) | Animations are independent of speed-scaling; bundling them adds risk without milestone gain | — Pending |
| No high-score persistence | Pure animation milestone; storage adds an axis of complexity that doesn't serve the goal | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-04 after initialization (v1.0 milestone defined)*
