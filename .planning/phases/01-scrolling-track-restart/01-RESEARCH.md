# Phase 1: Scrolling Track & Restart - Research

**Researched:** 2026-05-05
**Domain:** HTML5 Canvas 2D scrolling / game-state reset
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Two-instance scrolling pattern — `track1` and `track2`, each `{x, y, width, height}`. When one's right edge exits canvas (`track.x + track.width <= 0`), reset its `x` to the other's right edge.
- **D-02:** Scroll speed = `velocityX` (-8 px/frame). Reuse the existing global directly — no separate `trackVelocityX`.
- **D-03:** Track Y = `boardHeight - trackHeight` (222 with trackHeight = 28). Bottom-aligned. Do not adjust `dinoY` or `cactusY`.
- **D-04:** Track draws first in `update()`, immediately after `clearRect`. Order: clearRect → track → cacti → dino → score.
- **D-05:** Track image loads fire-and-forget, matching the cactus pattern (`dino.js:62-69`). No `onload` guard.
- **D-06:** Track entities stored as plain object literals `{img, x, y, width, height}`. Two top-level `let` globals (`track1`, `track2`). NOT pushed into `cactusArray`.
- **D-07:** Track does NOT participate in collision. `detectCollision()` is never called on track entities.
- **D-08:** Track scrolling halts on `gameOver` (sits inside the same early-return gate as dino/cactus updates).
- **D-09:** Restart trigger = ANY `keydown` after `gameOver === true`.
- **D-10:** Reuse existing `moveDino(e)` listener. Replace the early-return at `dino.js:111-113` with a branch that calls `resetGame()` and returns.
- **D-11:** No input debounce after game over. First key restarts. Key-repeat on held Space at collision moment is acceptable.
- **D-12:** Canonical reset list — `gameOver=false; score=0; cactusArray=[]; velocityY=0; dino.y=dinoY; dinoImg.src="./img/dino.png"`. Track positions NOT reset.
- **D-13:** Do NOT cancel or restart `requestAnimationFrame(update)` or `setInterval(placeCactus)`. Flipping `gameOver=false` resumes both loops.
- **D-14:** `score` resets to 0. Frame-rate-dependent score bug preserved as-is.
- **D-15:** `dinoImg.src` swap race on restart is acceptable. Browser caches `dino.png`; reassignment is effectively instantaneous.
- **D-16:** Tutorial-style `let` globals throughout. No `const`, no classes, no module split.
- **D-17:** Centralize reset in a named `resetGame()` helper function.
- **D-18:** Keep `dino.js` as a single file. Track block adds ~15-20 lines; total stays well under 200 lines.

### Claude's Discretion

- Exact variable names (`track1` vs `trackA`, `trackImg` vs `trackImage`) — match local convention (lowercase, underscore-free, descriptive).
- Whether to compute `trackHeight = 28` as a literal constant or `let trackHeight = 28` — match the existing pattern (`let cactusHeight = 70`).
- Whether `resetGame()` lives above or below `moveDino()` — order by logical grouping.
- Whether to factor the track scroll/wrap logic into a small helper or inline in `update()` — inline is fine at two entities.

### Deferred Ideas (OUT OF SCOPE)

- Pre-decode track image with `onload` guard.
- Game-over overlay / "Press any key to restart" UI prompt (`game-over.png`, `reset.png`).
- Score frame-rate independence.
- Cloud / parallax (`cloud.png`).
- Cactus-array pruning correctness when scroll speed changes.
- Refactor of dino sprite handling into a state machine (Phase 2 owns this).
- Restart resetting the `placeCactus` timer phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BG-01 | Render `track.png` as a tiled, left-scrolling ground at game speed, replacing the flat `lightgray` CSS background. | Two-instance wrap pattern; draw-order placement; `velocityX` reuse. |
| RESTART-01 | After game-over, pressing any key resets all gameplay state and starts a new run without a page reload. | `resetGame()` canonical list; `moveDino` branch; loop self-perpetuation property. |
</phase_requirements>

---

## Summary

Phase 1 adds two visible improvements to `dino.js`: a tiled scrolling ground strip and a keypress-triggered game-state reset. Both are wiring exercises — the architecture already supports them with no structural changes. The self-rescheduling RAF loop and the never-cleared `setInterval` mean restart is a simple state flip, not a loop restart. The two-instance wrap pattern for the track is the standard Canvas scrolling technique; it maps directly onto the existing entity-object convention the codebase already uses for cacti.

The locked decisions in CONTEXT.md resolve every material design question. There are no open architectural choices left for the planner. The two PLAN.md files (`01-01` and `01-02`) can be written directly from this research without further discussion.

**Primary recommendation:** Implement exactly as specified in D-01 through D-17. No deviations, no cleverness. The tutorial-style readability constraint is a first-class requirement.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tiled track rendering (BG-01) | Browser / Canvas (`update()`) | — | Pure canvas draw-call; no server, no DOM beyond the existing `<canvas>` element |
| Track scroll physics | Browser / Canvas (`update()`) | — | Mutates `track1.x` / `track2.x` per frame alongside existing cactus scroll in the same function |
| Track wrap logic | Browser / Canvas (`update()`) | — | Belongs inline in the same frame block that advances the track positions |
| Game-state reset (RESTART-01) | Browser / input handler (`moveDino()`) | — | Triggered by a `keydown` event; reset reads/writes only module-level globals |
| Background color change (BG-01 CSS side) | CSS (`dino.css`) | — | The `lightgray` background-color on `#board` must be removed or neutralized so it does not show through transparent track pixels |

---

## Standard Stack

No libraries. This is vanilla Canvas 2D.

| API | Version | Purpose |
|-----|---------|---------|
| `CanvasRenderingContext2D.drawImage()` | Browser-native | Draw each track entity per frame |
| `CanvasRenderingContext2D.clearRect()` | Browser-native | Clear canvas each frame before redraw |
| `requestAnimationFrame` | Browser-native | Existing render loop — unchanged |
| `setInterval` | Browser-native | Existing cactus spawner — unchanged |

[VERIFIED: dino.js read directly] No new dependencies. No npm.

---

## Architecture Patterns

### System Architecture Diagram

```
keydown ──► moveDino(e)
              │
              ├── gameOver? YES ──► resetGame() ──► mutates {gameOver, score, cactusArray,
              │                                              velocityY, dino.y, dinoImg.src}
              │                    └── return (no jump/duck processing)
              │
              └── gameOver? NO ──► jump / duck (unchanged)

setInterval(1000ms) ──► placeCactus() ──► early-return if gameOver
                                         else push cactus onto cactusArray

requestAnimationFrame ──► update()
                           │
                           ├── reschedule RAF (unconditional, line 77)
                           ├── early-return if gameOver
                           │
                           ├── clearRect(0, 0, 750, 250)
                           │
                           ├── [NEW] advance track1.x += velocityX
                           │         advance track2.x += velocityX
                           │         wrap: if track.x + track.width <= 0, track.x = other.x + other.width
                           │         drawImage(trackImg, track1.x, track1.y, ...)
                           │         drawImage(trackImg, track2.x, track2.y, ...)
                           │
                           ├── dino physics + draw (unchanged)
                           ├── cactus loop + collision (unchanged)
                           └── score text (unchanged)
```

### Existing Code Touchpoints (exact lines)

This phase touches `dino.js` in four places. All other code is unchanged.

**Touchpoint 1 — Module-level globals (after line 43, before `window.onload`)**

Add track state variables alongside the cactus block. Match the `let cactusHeight = 70` style.

```javascript
// track
let trackImg;
let trackWidth = 2404;  //track.png native width
let trackHeight = 28;   //track.png native height
let trackX = 0;
let trackY = boardHeight - trackHeight; //222 — bottom-aligned under dino/cactus feet
let track1;
let track2;
```

[VERIFIED: dino.js:1-43, img/track.png dimensions confirmed 2404x28]

**Touchpoint 2 — `window.onload` (after cactus image loading, lines 62-69)**

Load track image and initialize the two track entities back-to-back:

```javascript
trackImg = new Image();
trackImg.src = "./img/track.png";

track1 = { img: trackImg, x: trackX,          y: trackY, width: trackWidth, height: trackHeight };
track2 = { img: trackImg, x: trackX + trackWidth, y: trackY, width: trackWidth, height: trackHeight };
```

`track2` starts one full image-width to the right of `track1`, so together they cover the canvas seamlessly from frame one. [ASSUMED: track2 initial x = trackWidth positions it just off-screen right, which at 2404px > boardWidth 750px means only track1 is visible at t=0, but track2 is already adjacent and ready to scroll in. This is correct behavior.]

**Touchpoint 3 — `update()` body, immediately after `clearRect` (line 81)**

Insert before the dino block (`//dino` comment, line 83):

```javascript
//track
track1.x += velocityX;
track2.x += velocityX;
if (track1.x + track1.width <= 0) {
    track1.x = track2.x + track2.width;
}
if (track2.x + track2.width <= 0) {
    track2.x = track1.x + track1.width;
}
context.drawImage(track1.img, track1.x, track1.y, track1.width, track1.height);
context.drawImage(track2.img, track2.x, track2.y, track2.width, track2.height);
```

[VERIFIED: dino.js:76-108; D-04 locks draw order]

**Touchpoint 4 — `moveDino(e)` (lines 110-123)**

Replace the existing `gameOver` early-return:

```javascript
// Before (lines 111-113):
if (gameOver) {
    return;
}

// After:
if (gameOver) {
    resetGame();
    return;
}
```

[VERIFIED: dino.js:110-123; D-10 locks this approach]

**New function — `resetGame()` (placed after `placeCactus`, before `detectCollision`)**

```javascript
function resetGame() {
    gameOver = false;
    score = 0;
    cactusArray = [];
    velocityY = 0;
    dino.y = dinoY;
    dinoImg.src = "./img/dino.png";
}
```

This is the D-12 canonical reset list verbatim. Track positions are intentionally absent — they scroll continuously and remain valid after restart.

[VERIFIED: D-12, D-17; dino.js:125-167 for placement target]

**CSS change — `dino.css` line 7**

Remove or replace `background-color: lightgray` on `#board`. The track PNG has no transparent pixels in its drawn strip (it's an opaque ground texture), but the canvas area above the track strip (y 0–221) is cleared to transparent each frame by `clearRect`. With `lightgray` background on the `<canvas>` element, that upper area shows gray through. This is acceptable (gray sky), but if white sky is desired (matching Chrome dino), set `background-color: white` or remove the property.

Decision: match Chrome dino feel → change to `background-color: white`. This is Claude's discretion since the CONTEXT.md locks the track strip but is silent on the sky color.

[ASSUMED: The original Chrome dino game has a white background sky. Setting `#board { background-color: white }` is the correct change for "feels like Chrome dino." If the user prefers lightgray, this is the one line to revert.]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Infinite scrolling background | Modulo math, canvas pattern-fill, texture atlas, shader | The two-instance wrap pattern (D-01). Two entities, one wrap check each, ~8 lines. |
| Game restart | `clearInterval` + `clearAnimationFrame` + re-launch | Flip `gameOver = false`. Existing loops already self-perpetuate and early-return on `gameOver`. |
| Sprite-back-to-normal on restart | `onload` callback, image cache invalidation | Synchronous `dinoImg.src = "./img/dino.png"`. Browser cache makes this effectively instantaneous (D-15). |

**Key insight:** Every "sophisticated" approach here adds complexity and risk without correctness benefit at this scale. The two-instance wrap has been the standard Canvas scrolling pattern since the first Canvas games; it is correct, readable, and maps onto the existing entity shape convention.

---

## Risks and Fragilities

### Risk 1: CSS background visible above track strip
**What goes wrong:** The track strip occupies y=222-250 on a 250px-tall canvas. `clearRect` sets the upper 222px to transparent each frame. The `<canvas>` element's CSS `background-color: lightgray` shows through transparent pixels. Above the track, the canvas looks gray rather than white, which mismatches the real Chrome dino.
**How to avoid:** Change `dino.css:7` to `background-color: white` (or remove the property).
**Warning signs:** Upper canvas area is gray while track is drawn. Obvious in-browser.

### Risk 2: `dinoImg.src` swap back on restart
**What goes wrong:** At collision, `dino.js:96` sets `dinoImg.src = "./img/dino-dead.png"`. If `resetGame()` omits the reverse swap, the dino restarts showing the dead sprite.
**How to avoid:** D-12 includes `dinoImg.src = "./img/dino.png"` in the canonical reset list. `resetGame()` must include this line verbatim.
**Warning signs:** After restart the dino looks dead from frame 1. Caught immediately on play-test.

### Risk 3: Key-repeat fire on held Space at game-over moment
**What goes wrong:** If the player is holding Space when collision triggers `gameOver = true`, the browser's key-repeat continues firing `keydown` events. The next repeat fires `resetGame()`. This restarts the game within one key-repeat interval (~30ms) — effectively immediately.
**Severity:** Acceptable per D-11. The player is implicitly pressing Space to start again. Document, don't fix.
**Warning signs:** Game restarts "too fast" after dying while holding Space. Expected behavior.

### Risk 4: `placeCactus` timer phase on restart
**What goes wrong:** The 1000ms `setInterval` is wall-clock and never resets. After restart, the first cactus can appear anywhere from 0-1000ms later depending on where in the interval cycle the restart happened. The player may see a "dead moment" with no cacti immediately after restart.
**Severity:** Acceptable per deferred decisions. Matches approximate Chrome dino feel. Not worth adding `clearInterval`/`setInterval` complexity in this phase.
**Warning signs:** Brief empty-start after restart. Cosmetic, not a bug.

### Risk 5: `dinoImg` shared-reference `onload` callback from collision
**What goes wrong:** Collision path at `dino.js:97-100` sets an `onload` callback on `dinoImg`. If `resetGame()` synchronously swaps `dinoImg.src` back to `dino.png`, the browser may fire the `dino-dead.png` `onload` callback after the reset (if the image hasn't fully decoded yet), drawing the dead sprite over the live dino on the first frame.
**Severity:** LOW. Browser image cache makes `dino-dead.png` decode near-instantaneously on any run after the first. The `onload` fires before `resetGame()` can be called in practice. D-15 documents this as acceptable.
**How to avoid:** No action needed for Phase 1. Phase 2 will replace `dinoImg.src` swapping with a sprite-state machine; that refactor eliminates this class of race.

---

## Wrap Math Explained

The two-instance pattern works because the track image (2404px wide) is much wider than the canvas (750px). At any moment, at most two track instances are needed to cover the canvas. The wrap condition is:

```
if (track.x + track.width <= 0)   // right edge has scrolled off-screen left
    track.x = otherTrack.x + otherTrack.width;  // reposition behind the other
```

At `velocityX = -8` px/frame and 60 fps, the track scrolls at 480 px/sec. A 2404px-wide image takes ~5 seconds to fully exit. The wrap fires once every ~5 seconds per instance — effectively invisible to the player.

**Why the initial positions work:**
- `track1.x = 0` — fills the visible canvas from the left edge.
- `track2.x = 2404` — sits immediately to the right of `track1`. It becomes visible as `track1` scrolls left, and the seam (if any) between the two is never visible because `track.png` is designed to tile seamlessly.

[VERIFIED: 2404px confirmed from PNG header; 750px is `boardWidth` in `dino.js:4`]

---

## State That Survives Restart (and Should)

The planner needs to know what `resetGame()` intentionally does NOT reset, and why.

| State | Kept? | Reason |
|-------|-------|--------|
| `track1.x`, `track2.x` | YES | Scrolling continuously; always in a valid wrap position |
| `velocityX = -8` | YES | Never changes in this phase; game speed is constant |
| `gravity = 0.4` | YES | Physics constant; never changes |
| `dinoX = 50` | YES | Horizontal position is fixed; `dino.x` is never mutated anywhere |
| `dino.width`, `dino.height` | YES | Dimensions are constant in Phase 1 (Phase 2 will change height for ducking) |
| `cactusArray` | NO | Cleared to `[]` — leftover cacti from the dead run must not persist |
| `gameOver` | NO | Reset to `false` — the condition that re-enables all loops |
| `score` | NO | Reset to `0` |
| `velocityY` | NO | Reset to `0` — must land on ground, not mid-jump |
| `dino.y` | NO | Reset to `dinoY` — back to ground position |
| `dinoImg.src` | NO | Reset to `./img/dino.png` — undo dead-sprite swap |

[VERIFIED: D-12 canonical list; dino.js globals audit]

---

## Common Pitfalls

### Pitfall 1: Drawing track outside the `gameOver` gate
**What goes wrong:** If track-update code is placed before the `gameOver` early-return in `update()`, the track keeps scrolling on the game-over frame. Given D-08, the track should halt on game-over, which means it must sit after the early-return guard.
**How to avoid:** Place the track block after `if (gameOver) { return; }` at `dino.js:78-80`. D-04 specifies "immediately after `clearRect`," which is already after the early-return.
**Note:** The current `update()` at line 77-81 is: `requestAnimationFrame(update)` → `if (gameOver) return` → `clearRect`. The track block goes after `clearRect`. This is correct.

### Pitfall 2: Mutating `track1`/`track2` before initializing them
**What goes wrong:** If globals are declared (`let track1;`) but `window.onload` is delayed, `update()` could attempt `track1.x += velocityX` on `undefined`.
**How to avoid:** Non-issue in practice — `window.onload` runs before `requestAnimationFrame` can fire (both are queued after page parse). The RAF call is inside `window.onload` at `dino.js:71`.

### Pitfall 3: Track wrap leaving a gap
**What goes wrong:** If the wrap condition uses `<` instead of `<=`, or resets to `other.x + other.width - 1`, a 1-pixel gap can appear as the track scrolls, flickering visibly at 60fps.
**How to avoid:** Use `<= 0` and `other.x + other.width` (no offset). The seam is at exactly zero — no gap, no overlap.

### Pitfall 4: `cactusArray = []` vs `cactusArray.length = 0`
**What goes wrong:** Both clear the array correctly. CONTEXT.md says "either is fine." The difference: `= []` creates a new array reference; `.length = 0` mutates in place. Since nothing else holds a reference to `cactusArray` (it's a module-level global read directly by `update()` and `placeCactus()`), either is safe. Use `cactusArray = []` for readability, matching `let cactusArray = []` at `dino.js:23`.

---

## Verification Approach (Manual Play-Test)

No automated tests (`nyquist_validation: false`). Verification is: open `index.html` in browser → play → observe.

Anchored to ROADMAP success criteria:

**Success criterion 1:** "While the game is running, the ground visibly scrolls left as a tiled sequence of `track.png` (no gap, no jitter)."

- [ ] Load `index.html`. Ground strip is visible immediately (no gray band at the bottom).
- [ ] Ground scrolls smoothly left at the same apparent speed as cacti.
- [ ] No visible gap or stutter appears at the wrap seam after ~5 seconds.
- [ ] Upper canvas area (sky) is white (not gray) — CSS background-color changed.
- [ ] Ground does not scroll after game-over (track halts with dino).

**Success criterion 2:** "After the dino dies, pressing any key clears the cacti, resets the score and dino state, and starts a new run without reloading the page."

- [ ] Collide with a cactus. Dead-sprite appears. Cacti and track halt.
- [ ] Press Space. Game immediately resumes: dino is back at ground level, alive sprite, score is 0, all cacti gone.
- [ ] Press ArrowUp. Same result.
- [ ] Press any letter key (e.g., `a`). Same result.
- [ ] After restart, new cacti spawn normally and the track scrolls.
- [ ] Dino can jump, can die again, can restart again — loop is stable.

**Success criterion 3:** "The game's overall feel — physics, collision, score increment — remains unchanged from before this phase."

- [ ] Jump height, airtime, and gravity feel identical to before the change.
- [ ] Cactus collision still triggers game-over and dead-sprite swap.
- [ ] Score increments at the same apparent rate as before.
- [ ] No visual regression: dino and cacti render at correct positions relative to the track.

---

## Open Questions

None. CONTEXT.md decisions D-01 through D-18 are comprehensive. Every material design choice is locked. No user confirmation is required before planning proceeds.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `track2` initial `x = trackWidth` (2404) places it immediately right of `track1` and off-screen-right, ready to scroll in seamlessly | Touchpoint 2 | If wrong, a gap or black area appears at the seam from frame 1. Caught immediately on play-test. |
| A2 | Chrome dino sky color is white, not gray — so `background-color: white` is the correct CSS change | CSS change note | If wrong, sky is wrong color. Cosmetic only; trivially reverted. |

All other claims in this document were verified by direct reading of `dino.js`, `img/track.png` (PNG header), or `dino.css` in this session.

---

## Environment Availability

Step 2.6: SKIPPED. Phase 1 is a purely local, file-based change. No external tools, services, CLIs, runtimes, or databases required beyond a modern browser. Verification loop is: edit `dino.js` → reload browser.

---

## Security Domain

Security surface is zero for this phase (and this project). No network calls, no user-generated content, no storage, no injection surfaces. Per CONCERNS.md: "Nothing to attack." No ASVS categories apply.

---

## Sources

### Primary (HIGH confidence)
- `dino.js` (read directly) — All line references verified against actual source
- `img/track.png` (PNG header read via Python) — Dimensions confirmed as 2404x28
- `dino.css` (read directly) — `lightgray` background on `#board` at line 7 confirmed
- `.planning/phases/01-scrolling-track-restart/01-CONTEXT.md` (read directly) — All decisions D-01 through D-18
- `.planning/codebase/ARCHITECTURE.md` (read directly) — Loop self-perpetuation properties
- `.planning/codebase/CONCERNS.md` (read directly) — Fragile areas #3 (dinoImg.src swap), latent bug #4 (loop runs forever)
- `.planning/ROADMAP.md` (read directly) — Success criteria for Phase 1
- `.planning/REQUIREMENTS.md` (read directly) — BG-01, RESTART-01

### Secondary
None needed. All claims verified from primary sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — vanilla Canvas 2D, verified against actual source
- Architecture / touchpoints: HIGH — exact line numbers verified from dino.js read
- Pitfalls: HIGH — derived from direct code analysis and CONCERNS.md
- Wrap math: HIGH — standard Canvas scrolling pattern, verified against actual dimensions

**Research date:** 2026-05-05
**Valid until:** This research is tied to a 167-line static file. Valid until `dino.js` is modified. After any structural change to `dino.js`, re-verify line numbers.
