# Phase 2: Dino animation & state machine - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning
**Mode:** `--auto` (recommended defaults selected without interactive prompts)

<domain>
## Phase Boundary

Replace today's single-image dino (`dinoImg.src` swap between `dino.png` and `dino-dead.png`) with a small, tutorial-style sprite-state machine that selects the right sprite for each gameplay state and shrinks the hitbox while ducking. Four states: `running`, `jumping`, `ducking`, `dead`. Two of those (running, ducking) are 2-frame cycles at ~10 fps. One (jumping) is a single static sprite. One (dead) is a single static sprite. The dino's bounding box `{x, y, width, height}` — the entity-shape contract that `detectCollision` reads — must shrink to the duck sprite's footprint while ducking and restore on stand-up.

In scope: per-state sprite selection, frame-counted run/duck cycling, ArrowDown hold-tracking via a `keyup` listener, hitbox mutation on duck enter/exit, integration with Phase 1's `resetGame()`.
Out of scope: birds (Phase 3), fast-fall while airborne+ArrowDown (Chrome dino has it; v1.0 doesn't need it — explicit non-goal), animated dead sprite, anti-aliasing/scaling polish, parallax/clouds, score-rate fix, any further refactor of `dino.js` structure.

</domain>

<decisions>
## Implementation Decisions

### Sprite handling refactor (replaces single-`dinoImg`-with-src-swap pattern)
- **D-01: One `Image` object per dino sprite — pre-loaded at startup.** Add module-level globals `dinoRun1Img`, `dinoRun2Img`, `dinoJumpImg`, `dinoDuck1Img`, `dinoDuck2Img`, `dinoDeadImg`. Each gets its own `new Image()` and `.src = "./img/<file>.png"` in `window.onload` matching the existing cactus loading pattern (fire-and-forget, no `onload` guard per sprite).
- **D-02: Remove the `dinoImg.src` swap pattern entirely.** Specifically:
  - Remove the existing `dinoImg = new Image(); dinoImg.src = "./img/dino.png"; dinoImg.onload = function() {...}` block (current `dino.js:65-69`).
  - Remove the death-time `dinoImg.src = "./img/dino-dead.png"; dinoImg.onload = function() {...}` block (current `dino.js:123-126`).
  - Remove the restart-time `dinoImg.src = "./img/dino.png"` line in `resetGame()` (current `dino.js:196`).
  - Delete the `dinoImg` global itself — it has no remaining callers after the above.
- **D-03: Keep the existing `dino.png` file unused.** Don't delete it from `img/`; it's just no longer referenced. `dino-run1.png` is the new "neutral standing" sprite (the dino is always running when on the ground in this phase).
- **D-04: Sprite picker is a tiny inline expression in `update()`'s dino draw step**, not a function. Keep it readable in the tutorial-style flat code:
  ```js
  let dinoSprite;
  if (dinoState == "dead")        dinoSprite = dinoDeadImg;
  else if (dinoState == "jumping") dinoSprite = dinoJumpImg;
  else if (dinoState == "ducking") dinoSprite = (Math.floor(frameCount / 6) % 2 == 0) ? dinoDuck1Img : dinoDuck2Img;
  else /* running */               dinoSprite = (Math.floor(frameCount / 6) % 2 == 0) ? dinoRun1Img  : dinoRun2Img;
  context.drawImage(dinoSprite, dino.x, dino.y, dino.width, dino.height);
  ```
  Inline if/else chain is fine — flat tutorial style. No helper function unless it grows.

### State machine
- **D-05: State is a single string variable** — `let dinoState = "running"` at module scope. Allowed values: `"running"`, `"jumping"`, `"ducking"`, `"dead"`. No formal state-machine class, no transition table — just direct assignment from the derivation block in `update()` and the input handlers.
- **D-06: State is derived at the top of the dino block in `update()`**, before drawing. Derivation rules (in priority order):
  1. If `gameOver` → `"dead"`.
  2. Else if `dino.y < dinoY` (airborne — using existing ground-clamp predicate) → `"jumping"`.
  3. Else if `isDuckHeld` (ArrowDown currently held) → `"ducking"`.
  4. Else → `"running"`.
  This collapses input + airborne status into one string per frame. No transition events, no enter/exit hooks — the derivation runs every frame and always agrees with the world.
- **D-07: `isDuckHeld` is a separate module-level boolean.** Set `true` on ArrowDown `keydown`, set `false` on ArrowDown `keyup`. This is the only way to distinguish "still holding" from "tapped once" — `keydown` alone fires once per press, not per frame.
- **D-08: Add a `keyup` listener and a `keyUp(e)` handler** alongside the existing `keydown`/`moveDino` listener. Phase 1 D-10 forbade adding a *parallel keydown* listener — `keyup` is a different event and is fine. Listener body: only handles `e.code == "ArrowDown"` → `isDuckHeld = false`. Don't gate on `gameOver` — releasing keys after death should still flush the held flag.

### Frame-counted animation
- **D-09: Module-level `let frameCount = 0`**, incremented as the FIRST line inside `update()` (before the `gameOver` early-return — even when the game is over, the counter advances; this is harmless and simpler than gating the increment).
- **D-10: Animation rate = swap every 6 frames** = ~10 fps at 60 fps render = ~7 fps at 144 fps render. Hardcode the literal `6` in the sprite-picker expression (D-04). REQUIREMENTS.md DINO-01 says "~10 fps so the run reads as a run, not a strobe or a slideshow"; 6 is the integer that lands closest to 10 fps on a 60 Hz display.
- **D-11: Run and duck use the SAME 6-frame interval.** REQUIREMENTS.md DINO-03 says duck cycles "at the same rate as the run cycle". Sharing one constant keeps that locked.
- **D-12: No worry about `frameCount` overflow.** `Number.MAX_SAFE_INTEGER` is 2⁵³; at 60 fps that's ~4.76 million years. Skip the modulo-reset that some tutorial codebases add.
- **D-13: Frame counter is reset to 0 in `resetGame()`** — see D-19.

### Hitbox during ducking (DINO-04)
- **D-14: Mutate `dino.width`, `dino.height`, and `dino.y` on duck enter/exit** so `detectCollision(dino, cactus)` continues to work unchanged (the entity-shape contract from `.planning/codebase/ARCHITECTURE.md` is preserved). New globals:
  ```
  let duckWidth = 118;   //match dino-duck1.png width
  let duckHeight = 60;   //match dino-duck*.png height
  let duckY = boardHeight - duckHeight;
  ```
  Use `118` (duck1 width) for the canonical hitbox even though `duck2.png` is 116 — the 2-pixel sprite-frame variation is below player perception, and freezing the hitbox at 118 prevents collision-edge jitter on each animation swap.
- **D-15: Hitbox change is driven by state-derivation, not by input event.** In the same dino block in `update()`, immediately after deriving `dinoState` (D-06), apply hitbox dimensions:
  - If `dinoState == "ducking"`: `dino.width = duckWidth; dino.height = duckHeight; dino.y = duckY;`
  - Else: `dino.width = dinoWidth; dino.height = dinoHeight;` and clamp `dino.y` against `dinoY` only if it currently exceeds it (i.e., do NOT force `dino.y = dinoY` mid-jump — that would teleport the dino back to the ground).
  Concretely:
  ```js
  if (dinoState == "ducking") {
      dino.width = duckWidth;
      dino.height = duckHeight;
      dino.y = duckY;
  } else {
      dino.width = dinoWidth;
      dino.height = dinoHeight;
      // do NOT touch dino.y here — gravity owns it
  }
  ```
- **D-16: Gravity ownership of `dino.y` is preserved.** The existing line `dino.y = Math.min(dino.y + velocityY, dinoY)` (current `dino.js:112`) keeps owning `dino.y` for non-ducking states. The duck branch above explicitly sets `dino.y = duckY` for the duck case (the dino is on the ground while ducking, so this is consistent with `dino.y == dinoY` semantics, just at a lower y because the dino is shorter). On exit-from-duck, gravity's `Math.min` clamps back to `dinoY` automatically on the next frame.
- **D-17: Hitbox change applies BEFORE the gravity / draw step, AFTER state derivation.** Order in the dino block:
  1. Derive `dinoState` (D-06).
  2. Apply hitbox dims based on state (D-15).
  3. Existing gravity line (`velocityY += gravity; dino.y = Math.min(dino.y + velocityY, dinoY);`) — but only when NOT ducking (gravity's `Math.min` would clamp to `dinoY` not `duckY`; running gravity while ducking would teleport the dino up to `dinoY=156` instead of staying at `duckY=190`). Wrap the gravity step in `if (dinoState != "ducking") {...}` OR keep it always-on but skip the `dino.y` assignment when ducking. Clean version:
     ```js
     if (dinoState != "ducking") {
         velocityY += gravity;
         dino.y = Math.min(dino.y + velocityY, dinoY);
     } else {
         velocityY = 0; //zero out vertical velocity while grounded-ducking
     }
     ```
  4. Pick sprite (D-04) and draw.

### Input handling
- **D-18: ArrowDown `keydown` sets `isDuckHeld = true`.** Existing `moveDino(e)` already has the empty `else if (e.code == "ArrowDown" && dino.y == dinoY)` branch (`dino.js:147-149`). Replace its empty body with `isDuckHeld = true;`.
  - **Important — drop the `dino.y == dinoY` gate** on the ArrowDown branch. Reason: while airborne, the player may want to be already-pressing ArrowDown so the duck triggers the moment they land. Setting the flag eagerly is harmless — the state-derivation in `update()` (D-06) only transitions to "ducking" when the dino is on the ground anyway. So the input handler can just record "the player is holding ArrowDown" without caring about ground state.
  - The Space/ArrowUp jump branch keeps its `dino.y == dinoY` gate — that one is correct (can only jump from ground).
- **D-19: `resetGame()` (from Phase 1) gets four additions and one removal.**
  - Add: `dinoState = "running"`
  - Add: `isDuckHeld = false`
  - Add: `frameCount = 0`
  - Add: `dino.width = dinoWidth; dino.height = dinoHeight;` (in case the player died while ducking — restore standing hitbox)
  - Remove: `dinoImg.src = "./img/dino.png"` (the sprite-state machine picks the right sprite from the next frame; `dinoImg` no longer exists per D-02)

### Jump-state nuance
- **D-20: While airborne (`dino.y < dinoY`), `dinoState == "jumping"`.** `isDuckHeld` may be true or false during the jump — irrelevant for the airborne branch (state derivation prioritizes airborne over duck). On landing, if `isDuckHeld` is still true, the next frame transitions to "ducking" naturally. This avoids an "in-air duck" state and keeps the v1.0 mechanic simple.
- **D-21: No "fast-fall" while ArrowDown+airborne.** The real Chrome dino accelerates downward while ArrowDown is held mid-jump. v1.0 explicitly does NOT implement this — it's a feel improvement that adds physics complexity without serving the animation milestone. Captured in Deferred Ideas.

### Code style and structure
- **D-22: Maintain tutorial-style globals.** New module-level `let` declarations: `dinoRun1Img`, `dinoRun2Img`, `dinoJumpImg`, `dinoDuck1Img`, `dinoDuck2Img`, `dinoDeadImg`, `duckWidth`, `duckHeight`, `duckY`, `dinoState`, `isDuckHeld`, `frameCount`. Group them next to existing dino globals (around `dino.js:8-13` / `dino.js:15-20`).
- **D-23: No `const`. No classes. No module split.** PROJECT.md and Phase 1's CONTEXT.md both lock this; reaffirm here so the planner doesn't try to introduce structure.
- **D-24: Single file (`dino.js`).** No new files. Asset PNGs already exist in `img/` (verified — all six sprites are present at expected dimensions).

### Claude's Discretion
- Exact identifier casing for the new sprite globals (`dinoRun1Img` vs `dinoRunImg1` vs `runImg1`) — pick what reads cleanest next to existing `cactus1Img` style.
- Whether the sprite-picker expression is inlined as in D-04 or factored into a tiny `getCurrentDinoSprite()` helper — inline is fine; helper is fine; either preserves tutorial readability.
- Whether the "wrap gravity in `if (dinoState != 'ducking')`" pattern (D-17) or "always run gravity but skip `dino.y` assignment when ducking" pattern is used — whichever reads cleaner.
- Whether to declare `keyUp` as a separate function or inline it as an arrow expression in the listener registration.
- Order of sprite preloads in `window.onload` (alphabetical, by usage frequency, etc.).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner) MUST read these before planning or implementing.**

### Roadmap & requirements (locked)
- `.planning/ROADMAP.md` §"Phase 2: Dino animation & state machine" — phase goal, success criteria, requirement mapping (DINO-01..DINO-04).
- `.planning/REQUIREMENTS.md` §"Dino Animation" — DINO-01 (run cycle ~10 fps), DINO-02 (airborne sprite), DINO-03 (duck cycle, same rate as run), DINO-04 (shorter+wider hitbox while ducking).
- `.planning/PROJECT.md` §"Constraints" and §"Core Value" — vanilla-JS / single-file / tutorial-style; "feels like Chrome dino" benchmark.

### Carry-forward from Phase 1
- `.planning/phases/01-scrolling-track-restart/01-CONTEXT.md` §"Implementation Decisions" — D-01..D-18 from Phase 1; specifically D-12 (the canonical reset list, which Phase 2 extends per D-19 above) and D-15 (the documented `dinoImg.src` swap fragility, which Phase 2 fixes by switching to per-sprite Images).
- `.planning/phases/01-scrolling-track-restart/01-VERIFICATION.md` — confirms physics constants are unchanged and sets the "physics unchanged" guardrail Phase 2 must preserve.

### Codebase (read-only context)
- `.planning/codebase/ARCHITECTURE.md` §"Abstractions" — the entity-shape contract (`{x, y, width, height}`) that `detectCollision` reads; D-14 above mutates these fields rather than introducing a parallel hitbox object.
- `.planning/codebase/CONCERNS.md` §"Fragile Areas" #3 — `dinoImg.src` swap pattern that Phase 2 explicitly retires.
- `dino.js:8-20` — existing dino globals + `dino` entity object (where new state vars + sprite globals attach).
- `dino.js:54-89` — `window.onload` (where new sprite preloads + `keyup` listener wire in).
- `dino.js:91-135` — `update()` body (where state derivation + hitbox mutation + sprite picker insert).
- `dino.js:121-127` — current collision-to-gameOver path (Phase 2 removes the `dinoImg.src = "./img/dino-dead.png"` swap; sprite picker handles dead state via `dinoDeadImg`).
- `dino.js:137-151` — `moveDino()` (where ArrowDown branch fills in with `isDuckHeld = true`; remove the `dino.y == dinoY` gate per D-18).
- `dino.js:190-197` — `resetGame()` (extends per D-19; remove `dinoImg.src` line).

### Assets (locked, all present)
- `img/dino-run1.png` — 88×94 RGBA. Run-cycle frame 1.
- `img/dino-run2.png` — 88×94 RGBA. Run-cycle frame 2.
- `img/dino-jump.png` — 88×94 RGBA. Jumping sprite.
- `img/dino-duck1.png` — 118×60 RGBA. Duck-cycle frame 1. **Hitbox uses 118×60.**
- `img/dino-duck2.png` — 116×60 RGBA. Duck-cycle frame 2. (Hitbox stays at 118; 2px difference is below perception.)
- `img/dino-dead.png` — assumed 88×94 (existing usage at standing dimensions). Verify on read.
- `img/dino.png` — current standing sprite. **Becomes unused** after Phase 2 (D-03); keep the file in `img/`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`dino` entity object (`dino.js:15-20`)** — Phase 2 mutates its `width`, `height`, `y` on duck enter/exit. The object identity is preserved so existing references (collision, draw) keep working.
- **`detectCollision(a, b)` (`dino.js:199-204`)** — Pure AABB function. Phase 2 does NOT touch this; the hitbox change is in the `dino` entity, not the collision function. DINO-04's "low cactus passes overhead while ducking" emerges automatically from a smaller `dino.height`.
- **`dinoY` ground constant (`dino.js:12`)** — Still represents the standing-dino ground y. Phase 2 introduces a parallel `duckY = boardHeight - duckHeight` for the ducking ground y.
- **`dino.y < dinoY` airborne predicate** — Already used by `moveDino()` (the jump-from-ground gate). Phase 2 reuses this exact predicate in the `update()` state-derivation block (D-06 step 2).
- **`gameOver` flag** — Drives the dead-state branch in state derivation (D-06 step 1). Phase 1's `resetGame()` already flips it back; Phase 2 just adds more sibling state to reset (D-19).
- **`update()` re-schedules unconditionally (`dino.js:92`)** — `frameCount++` at the top of `update()` runs every frame regardless of `gameOver`. Harmless; simpler than gating.
- **The existing keydown listener `moveDino(e)` (`dino.js:88, 137-151`)** — Phase 2 fills in its empty ArrowDown branch (`dino.js:147-149`) and removes the ground gate per D-18. Phase 1 D-10 ("don't add a parallel keydown listener") is honored — Phase 2 only adds a `keyup` listener, which is a different event.
- **Phase 1's `resetGame()` (`dino.js:190-197`)** — Phase 2 extends this list (D-19); does NOT replace it.

### Established Patterns
- **`let`-everywhere — including immutables.** Reaffirmed for Phase 2's new globals.
- **Image-loading via `new Image()` + `.src` (cactus pattern, `dino.js:71-78`)** — Phase 2's six new sprite Images use the same fire-and-forget pattern. No `onload` per sprite.
- **State as primitive globals, not objects.** Phase 2 keeps this — `dinoState` is a string, `isDuckHeld` is a boolean, `frameCount` is an integer.
- **Per-frame derivation, not event-driven transitions.** Each frame, `update()` recomputes `dinoState` from input + airborne. No transition events, no enter/exit hooks. Mirrors how Phase 1's track scroll-and-wrap is recomputed every frame.
- **Inline-comment magic numbers.** Match `let velocityX = -8; //cactus moving left speed`. Use `let duckWidth = 118; //match dino-duck1.png width` and similar.

### Integration Points
- **`window.onload` (`dino.js:54-89`)** —
  - Remove the `dinoImg = new Image(); ... dinoImg.onload = ...` block (lines 65-69).
  - Add 6 sprite preloads (matching cactus pattern, no onload guards).
  - Add the `keyup` listener: `document.addEventListener("keyup", keyUp);`.
- **Globals block (`dino.js:8-20` and below `dino.js:42`)** — Add 12 new `let` declarations (six sprite Images + three duck dims + `dinoState` + `isDuckHeld` + `frameCount`). Remove `let dinoImg`.
- **`update()` body (`dino.js:91-135`)** —
  - Line 1 inside `update()`: `frameCount++;` (before `requestAnimationFrame(update)` re-schedule? Either order is fine — re-schedule is convention; counter is idempotent. Either order is correct.)
  - Replace the existing dino block (lines 110-113):
    - Old: `velocityY += gravity; dino.y = Math.min(...); context.drawImage(dinoImg, ...);`
    - New: state derivation → hitbox dims → gravity (skip while ducking) → sprite picker → drawImage.
  - Remove the `dinoImg.src = "./img/dino-dead.png"; dinoImg.onload = ...` block in the collision branch (lines 123-126). The state-derivation in the NEXT frame sees `gameOver=true` and picks `dinoDeadImg` automatically. No explicit redraw on collision needed — `update()` redraws every frame anyway, and `gameOver` early-returns at line 93 happen AFTER the next state-derivation (the collision happens inside the same frame as the dead-sprite swap, so dead sprite appears one frame later than today's behavior — imperceptible).
- **`moveDino(e)` (`dino.js:137-151`)** —
  - Fill in the ArrowDown branch body: `isDuckHeld = true;`.
  - Drop the `&& dino.y == dinoY` gate from the ArrowDown branch (D-18).
- **New `keyUp(e)` function** — Place near `moveDino()`. One-line body: `if (e.code == "ArrowDown") isDuckHeld = false;`.
- **`resetGame()` (`dino.js:190-197`)** — Extend per D-19 (4 additions, 1 removal).

</code_context>

<specifics>
## Specific Ideas

- **DINO-04 "shorter and wider" is realized by the duck PNG dimensions.** Standing dino = 88w × 94h; ducking dino = 118w × 60h. Wider (118 > 88), shorter (60 < 94) — both axes deliver the requirement automatically once the hitbox tracks the sprite size.
- **Why no in-air duck:** Real Chrome dino has a fast-fall when you press ArrowDown mid-jump. v1.0 explicitly skips this — DINO-03 says "while … on the ground" so the requirement does NOT need it. It's a feel improvement that costs physics complexity. Deferred.
- **Why isDuckHeld can be set even while airborne (D-18 dropping the ground gate):** It only writes a boolean; the state-derivation in `update()` controls when "ducking" actually applies. This makes "land and immediately duck" feel right (the player's already-held ArrowDown takes effect on the very first ground frame).
- **Why frame counter (`frameCount`) instead of `Date.now()`:** Tutorial-style readability + zero wall-clock dependency. Sprite cycle visibly slows on a slow tab (which is correct — the game scroll also slows). Wall-clock would decouple sprite cycle from gameplay tempo, which would feel wrong on a backgrounded tab.
- **Why state="dead" via state-machine instead of preserving the .src swap:** Eliminates the documented `dinoImg.src` race fragility (Phase 1 CONCERNS.md §3) AND simplifies `resetGame()` (no more sprite swap-back, just state reset).

</specifics>

<deferred>
## Deferred Ideas

- **Fast-fall while airborne+ArrowDown** — Real Chrome dino accelerates downward when ArrowDown is held mid-jump. Captured as a v2 polish item ("DINO-FASTFALL-01"); not required by any v1.0 DINO-* requirement and adds physics tuning surface.
- **Animated dead sprite / death pose freeze frame** — Currently `dino-dead.png` is a single static frame; no death animation cycle. Out of scope; matches original Chrome dino behavior anyway.
- **Sprite-frame-perfect hitbox (per-frame width swap between duck1=118 and duck2=116)** — Skipped because the 2px variation is below player perception and would introduce per-frame collision-edge jitter. If a future tuning phase finds the hitbox feels off, this is the knob to revisit.
- **Refactoring `update()`'s flat structure into per-entity update/draw passes** — As `dino.js` grows past 250+ lines (Phase 3 will add birds), the all-in-one `update()` will start to want internal structure. Out of scope for v1.0 per PROJECT.md ("maintain tutorial style").
- **Sprite atlas / spritesheet loading** — Six separate `Image` objects is more memory and more network requests than a single atlas. Negligible at this scale; optimization if-and-only-if it ever matters.
- **Pre-decode all sprites with `Image.decode()` Promises before starting the RAF loop** — Eliminates the first-frame race entirely. Matches the cactus precedent (skipped for tutorial readability) — revisit if a real first-frame visible-glitch ever surfaces.
- **Dino state machine as a formal class with transitions** — D-05 deliberately uses a string global for tutorial readability. If more states emerge (e.g., "stunned", "powered-up"), a formal state machine becomes the right tool. Not now.
- **Configurable animation rate** — `FRAMES_PER_SPRITE = 6` is hardcoded. If the dev experience wants tunable animation speed during testing, expose it. Not for v1.0.

</deferred>

---

*Phase: 2-dino-animation-state-machine*
*Context gathered: 2026-05-06*
