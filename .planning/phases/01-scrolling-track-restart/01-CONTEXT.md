# Phase 1: Scrolling track & restart - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** `--auto` (recommended defaults selected without interactive prompts)

<domain>
## Phase Boundary

Two coupled wins, both visible the moment the player opens the page:

1. **Tiled scrolling track** — Replace the flat `lightgray` canvas background (currently set in `dino.css:7`) with a continuously left-scrolling rendering of `img/track.png` (2404×28, RGBA). Scroll speed must match cactus scroll so the world feels coherent.
2. **Any-key restart** — After the dino dies, the next `keydown` clears all gameplay state (cacti, score, dino position, dead-sprite swap) and resumes a new run with no page reload.

In scope: rendering the track, scrolling it at game speed, resetting state on a post-game-over keypress.
Out of scope: clouds (`cloud.png`), parallax, animation frames for the dino, ducking, birds, difficulty scaling, hi-score persistence, game-over UI sprites. Those have their own phases or are v2.

</domain>

<decisions>
## Implementation Decisions

### Track rendering
- **D-01: Two-instance scrolling pattern.** Maintain two track entities (`track1`, `track2`) each `{x, y, width, height}` and draw both per frame. When one's right edge exits the canvas (`track.x + track.width <= 0`), reset its `x` to the other's right edge. This is the standard tutorial-style scrolling background and stays readable in the existing single-file procedural style. Rejected alternatives: `ctx.createPattern()` + matrix translate (canvas-idiomatic but obscures intent for tutorial readers); single-image with modulo math (more arithmetic, no benefit at this scale).
- **D-02: Scroll speed = `velocityX` (-8 px/frame).** The track must move at the same speed as cacti or the world looks broken. Use the existing `velocityX` global directly — do NOT introduce a parallel `trackVelocityX` that could drift out of sync.
- **D-03: Track Y = `boardHeight - trackHeight` (= 222 with trackHeight = 28).** Bottom-aligned. The dino and cacti both stand on `boardHeight - <their height>`, so the track sits just under their feet visually. Do not adjust `dinoY` or `cactusY` — the dino still walks on the same invisible ground line; the track is decorative.
- **D-04: Track draws first, immediately after `clearRect`.** Order in `update()`: clearRect → draw track → advance + draw cacti → advance + draw dino → score text. Dino and cacti must paint over the track, not under.
- **D-05: Track image loads fire-and-forget, matching the cactus pattern (`dino.js:62-69`).** No `onload` guard. The image is local and decodes on the first scheduled frame in practice; matching the existing convention keeps this phase a wiring exercise, not a refactor of image-loading.
- **D-06: Track entities are stored as plain object literals `{img, x, y, width, height}` — same shape as `cactusArray` items and `dino`.** Track entities are NOT pushed into `cactusArray` — they don't collide. Two top-level `let` globals (`track1`, `track2`) keep the structure obvious and avoid an array allocation.
- **D-07: Track does NOT participate in collision.** `detectCollision()` is never called on track entities. The track is purely visual.
- **D-08: Track scrolling continues to advance even when the dino is mid-jump.** It only halts on `gameOver` (since the track-update block sits inside the same `gameOver` early-return that already gates dino/cactus updates).

### Restart behavior
- **D-09: Trigger = ANY `keydown` after `gameOver === true`.** No specific key, no separate "restart" key. Matches roadmap RESTART-01 ("pressing any key") and the original Chrome dino behavior.
- **D-10: Reuse the existing `moveDino(e)` `keydown` listener — do NOT add a second listener.** Replace the current early-return at `dino.js:111-113` with a branch that calls a `resetGame()` function (or inlines the reset) and then returns before falling through to jump/duck handling.
- **D-11: No input debounce or cooldown after game over.** The first key the player presses post-death restarts the run. Acceptable feel; matches the original. (Edge case: if the player is holding Space at the moment of collision, key-repeat could fire restart on the very next frame. That is fine — equivalent to the player wanting to play again.)
- **D-12: State reset scope (the canonical reset list).** On restart, set:
  - `gameOver = false`
  - `score = 0`
  - `cactusArray = []` (empty in place — `cactusArray.length = 0` or reassign; either is fine)
  - `velocityY = 0`
  - `dino.y = dinoY` (back on the ground; `dino.x` and dimensions don't change)
  - `dinoImg.src = "./img/dino.png"` (swap back from `dino-dead.png`)
  Track positions do NOT need resetting — they're scrolling continuously and will remain valid as long as the wraparound math is right.
- **D-13: Do NOT cancel or restart `requestAnimationFrame(update)` or `setInterval(placeCactus, 1000)`.** Both already self-perpetuate and early-return on `gameOver`. Flipping `gameOver` back to `false` is sufficient — `update()` resumes drawing on the next frame, `placeCactus()` resumes spawning on its next tick. This is documented behavior of the existing loop (see `.planning/codebase/ARCHITECTURE.md`, "Notable Architectural Properties").
- **D-14: Restart resets `score` to 0; the per-frame score increment behavior (a known frame-rate-dependent bug per CONCERNS.md §Latent Bugs #2) is preserved as-is.** Fixing that is NOT in this phase.
- **D-15: `dinoImg.src` swap race on restart is acceptable.** The browser caches `dino.png` from the initial `window.onload` load, so the synchronous `.src` reassignment is effectively instantaneous. No `onload` callback needed on restart. Documented as a known fragility (CONCERNS.md §"Image swapping via `dinoImg.src`") that Phase 2 (animation) will refactor when it introduces a sprite-state machine.

### Code style and structure
- **D-16: Maintain tutorial-style globals.** New track state lives as module-level `let` globals next to the cactus block. Do not introduce classes, modules, or `const`. PROJECT.md explicitly preserves this style for v1.0.
- **D-17: Prefer a small `resetGame()` helper over inlining the reset in `moveDino()`.** It's called from one place today, but Phase 2 may want to call the same reset from a future game-over UI button or similar. A named function makes the reset list discoverable and centralized.
- **D-18: Keep `dino.js` as a single file.** No module split. The track block adds ~15-20 lines; total file stays well under 200 lines.

### Claude's Discretion
- Exact variable names (`track1` vs `trackA`, `trackImg` vs `trackImage`) — match local convention (lowercase, underscore-free, descriptive).
- Whether to compute `trackHeight = 28` as a literal constant or `let trackHeight = 28` — match the existing pattern (`let cactusHeight = 70`).
- Whether `resetGame()` lives above or below `moveDino()` — order by logical grouping; either is fine.
- Whether to factor the track scroll/wrap logic into a small helper or inline in `update()` — inline is fine at two entities; either is acceptable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner) MUST read these before planning or implementing.**

### Roadmap & requirements (locked)
- `.planning/ROADMAP.md` §"Phase 1: Scrolling track & restart" — phase goal, success criteria, requirement mapping (BG-01, RESTART-01).
- `.planning/REQUIREMENTS.md` §"Scrolling Background" (BG-01) and §"Restart" (RESTART-01) — the two requirement statements this phase fulfills.
- `.planning/PROJECT.md` §"Constraints" and §"Core Value" — vanilla-JS / no-build / single-file constraints; "feels like Chrome dino" benchmark.

### Codebase (read-only context)
- `.planning/codebase/ARCHITECTURE.md` §"Notable Architectural Properties" — documents that `update()` and `setInterval` self-perpetuate; this is what makes restart safe without restarting the loops.
- `.planning/codebase/ARCHITECTURE.md` §"Abstractions" — the "ground constant" overload (`dinoY` is both initial-y and ground-clamp); do not rename.
- `.planning/codebase/CONCERNS.md` §"Latent Bugs" #4 — game loop runs forever after game over (relied on, not fixed).
- `.planning/codebase/CONCERNS.md` §"Fragile Areas" #3 — `dinoImg.src` swap pattern; restart must swap back to `./img/dino.png`.
- `.planning/codebase/CONCERNS.md` §"Functional Gaps" rows 1 (no restart) and 6 (no track) — confirms what this phase delivers.
- `dino.js:45-74` — `window.onload` (where `trackImg` loading wires in).
- `dino.js:76-108` — `update()` (where track scroll/draw goes; first call after `clearRect`).
- `dino.js:110-123` — `moveDino()` (where the gameOver branch becomes a restart trigger).
- `dino.js:94-100` — collision-to-gameOver path (the state that restart must undo).

### Assets (locked)
- `img/track.png` — 2404×28 RGBA PNG. Already present. No new assets needed.
- `img/dino.png` — restart's target sprite when swapping back from `dino-dead.png`.
- `img/dino-dead.png` — currently set on collision; restart swaps away from this.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`velocityX = -8` (`dino.js:38`)** — the single source of truth for left-scroll speed; track scroll reuses it directly.
- **`gameOver` flag (`dino.js:42`)** — already gates `update()` and `placeCactus()` early-returns; restart only needs to flip it back to `false`.
- **`update()` self-reschedules (`dino.js:77`)** — `requestAnimationFrame(update)` is the first line, called BEFORE the `gameOver` early-return. Restart does not need to call `requestAnimationFrame` again — frames are already scheduled.
- **`setInterval(placeCactus, 1000)` keeps ticking after game over (`dino.js:72`)** — `placeCactus` early-returns on `gameOver`, so flipping `gameOver = false` resumes spawning on the next tick. No `clearInterval` / `setInterval` dance needed.
- **`moveDino(e)` `keydown` listener (`dino.js:73, 110-123`)** — already wired to `document`; replace the gameOver early-return with the restart branch.
- **Module-level `let` globals at top of file (`dino.js:1-43`)** — established home for new state; add `trackImg`, `track1`, `track2`, `trackWidth`, `trackHeight`, `trackY` next to the cactus block.
- **Entity object shape `{img, x, y, width, height}`** — matches `cactusArray` items; track entities use the same shape (only `img`, `x`, `y`, `width`, `height` matter — no collision involvement).

### Established Patterns
- **`let`-everywhere style** — even immutable values use `let` (e.g., `let boardWidth = 750`). Match this for new vars (`let trackWidth = 2404`, etc.). Do NOT introduce `const` piecemeal.
- **Image-loading pattern (cacti, `dino.js:62-69`)** — `new Image()` + `.src = "./img/<name>.png"`, no `onload` guard. Match this for `trackImg`. (Dino itself uses an `onload` for its initial paint at `dino.js:58-60` — that's a one-time first-frame guard, not a per-image policy. Track does not need it.)
- **Per-frame draw order in `update()`** — clearRect → entities (background→foreground) → score text. Track is the new bottom of the entity stack.
- **Gravity clamp via `Math.min(dino.y + velocityY, dinoY)` (`dino.js:85`)** — `dinoY` is the ground constant. Restart's `dino.y = dinoY` reuses this constant directly.
- **In-line numeric magic numbers with line comments** — match the style: `let velocityX = -8; //cactus moving left speed`. Track constants get the same comment treatment.

### Integration Points
- **`window.onload` (`dino.js:45-74`)** — append: `trackImg = new Image(); trackImg.src = "./img/track.png";` and initialize `track1`/`track2` positions. The two track entities start at `x = 0` and `x = trackWidth` respectively (back-to-back, second one off-screen-right).
- **`update()` body, immediately after `clearRect` (`dino.js:81`)** — insert the track scroll-and-draw block: advance both tracks by `velocityX`, wrap each when its right edge exits the canvas, draw both.
- **`moveDino(e)` (`dino.js:110-123`)** — replace the existing early-return on `gameOver` with: `if (gameOver) { resetGame(); return; }`.
- **New `resetGame()` function** — placed near `placeCactus` / `detectCollision` at the bottom of the file. Performs the D-12 canonical state reset.

</code_context>

<specifics>
## Specific Ideas

- **"Feels like Chrome dino"** is the benchmark (PROJECT.md Core Value). Track scroll speed must match cacti — anything else looks wrong. Restart on any key, no UI prompt, matches the original feel.
- **Tutorial-style readability is valued.** Two named track entities + a small wrap check is more readable than a clever pattern-fill solution. PROJECT.md explicitly says "Tutorial origin: maintain that style; do not refactor to classes/modules in v1.0."
- **The dino dead-sprite swap (`dinoImg.src = "./img/dino-dead.png"` at `dino.js:96`) is a known fragility.** Phase 2 will refactor sprite handling into a state machine. For Phase 1, just mirror the swap — restart sets `dinoImg.src = "./img/dino.png"`. Document that Phase 2 supersedes this.

</specifics>

<deferred>
## Deferred Ideas

- **Pre-decode track image with `onload` guard** — Phase 1 matches the cactus fire-and-forget convention. If a real first-frame race ever surfaces (it hasn't in practice on `file://`), revisit with a decoding-promise pattern. Not v1.0.
- **Game-over overlay / "Press any key to restart" prompt** — `game-over.png` and `reset.png` exist in `img/` but PROJECT.md explicitly defers this to v2 (`GAMEOVER-UI-01`). Do not surface a UI prompt in this phase.
- **Score frame-rate independence** — `score++` per frame yields different points/sec on 60 vs 144 Hz displays (CONCERNS.md latent bug #2). Out of scope for Phase 1; flag for a future polish phase or v2.
- **Cloud / parallax (`cloud.png`)** — explicit v2 (`PARALLAX-01`). Do not add.
- **Cactus-array pruning correctness when scroll speed changes** (CONCERNS.md latent bug #1) — `cactusArray.shift()` prunes by count, not position. Phase 1 doesn't change scroll speed, so this remains latent. Flag for any future difficulty-scaling phase.
- **Refactor of dino sprite handling into a state machine** — Phase 2 will own this when it introduces `dino-run1/2`, `dino-jump`, `dino-duck1/2`. Phase 1 keeps the existing `dinoImg.src` swap pattern.
- **Restart resetting the `placeCactus` timer phase** — Today the cactus spawner is on a 1 Hz wall-clock interval that never resets. After restart, the next cactus may appear up to 1s after the player presses a key (depending on where in the interval cycle they restarted). Acceptable; matches Chrome dino feel. If players complain about "dead time on restart," revisit by clearing+restarting the interval inside `resetGame()`.

</deferred>

---

*Phase: 1-scrolling-track-restart*
*Context gathered: 2026-05-05*
