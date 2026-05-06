# Phase 3: Bird obstacles - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning
**Mode:** `--auto` (recommended defaults selected without interactive prompts)

<domain>
## Phase Boundary

Add a second obstacle type — **flying birds** — that spawns periodically alongside cacti, scrolls left at game speed, animates with a 2-frame flap cycle, and triggers the same game-over path as cacti on collision. At least one spawn height must require the duck mechanic from Phase 2 (DINO-03/DINO-04); at least one must NOT require ducking (per BIRD-03 wording: "high height that requires the player to jump or to stand").

In scope:
- Bird sprite preloads (`bird1.png`, `bird2.png`).
- Bird entity model with `{img, x, y, width, height}` shape (entity-shape contract preserved so `detectCollision(dino, bird)` reuses unchanged).
- Spawn mechanism — separate `setInterval(placeBird, 1500)` timer, probability-band height picker mirroring `placeCactus`'s pattern.
- Three discrete spawn heights — low (must duck), mid (must jump), high (run-under or jump cautiously) — chosen so DINO-04's shrunk hitbox is what makes the low bird passable.
- Per-frame flap animation in `update()` driven by `frameCount` (Phase 2 D-09), at a rate distinct from the dino's run/duck cycle.
- Bird collision loop in `update()` mirroring the cactus collision loop, sharing the same `gameOver = true` + same-frame dead-sprite paint path.
- `birdArray` cleared in `resetGame()` (extending Phase 1 D-12 / Phase 2 D-19 reset list).

Out of scope:
- Score-gated bird appearance (BIRD-LATE-01, v2 — birds spawn from score 0 in v1.0).
- Difficulty / speed scaling (DIFFICULTY-01, v2).
- Sound effects (AUDIO-01, v2).
- Cloud / parallax (PARALLAX-01, v2).
- Per-bird animation phase offsets (all on-screen birds flap in lockstep — fine, one frame counter).
- Per-frame hitbox swap matching bird1 (97×68) vs bird2 (93×62) sprite sizes — canonical 97×68 hitbox for both render and collision (matches Phase 2 D-14 duck-hitbox decision).
- Big-cactus variants, game-over UI, high-score persistence — explicit v2 per PROJECT.md.

</domain>

<decisions>
## Implementation Decisions

### Entity model & array structure
- **D-01: Birds live in their own `birdArray = []` parallel to `cactusArray`.** Do NOT unify into a single `obstacleArray` with a `type` field — that's a refactor masquerading as a feature, and Phase 2 D-23 explicitly locks "no architectural restructuring beyond the phase mandate." Each bird is `{img, x, y, width, height}` — same shape as cacti, satisfies the entity-shape contract from `.planning/codebase/ARCHITECTURE.md` §"Abstractions" so `detectCollision(dino, bird)` works unchanged. Globals declared next to the cactus block: `let birdArray = []`, `let bird1Img`, `let bird2Img`, `let birdWidth = 97`, `let birdHeight = 68`, plus the three height constants below.

### Spawn mechanism & cadence
- **D-02: Separate `setInterval(placeBird, 1500)` timer**, parallel to the existing `setInterval(placeCactus, 1000)`. 1500ms is slower than the cactus cadence on purpose — combined with the empty-band probability below, effective bird arrivals are ~3 seconds apart, leaving breathing room when both spawners fire. Rejected alternatives: (a) extending `placeCactus` to also roll for birds — entangles the two spawn rates and makes tuning either one a two-knob problem; (b) unified `placeObstacle` — same refactor objection as D-01.
- **D-03: `placeBird` uses the established probability-band pattern from `placeCactus` (`dino.js:210-245`).** Single `Math.random()` roll, `if/else if` thresholds, with one threshold representing "no bird":
  ```js
  let placeBirdChance = Math.random();
  if      (placeBirdChance > .80) { /* 20% no bird */ }
  else if (placeBirdChance > .55) { /* 25% high (y=birdHighY) */ }
  else if (placeBirdChance > .30) { /* 25% mid  (y=birdMidY)  */ }
  else                            { /* 30% low  (y=birdLowY)  */ }
  ```
  (Exact band split is Claude's discretion within the planning step — these proportions are the recommended starting point. The "no bird" band gives the player breathing room when an unfortunate cactus-bird overlap would be unfair.)
- **D-04: Bird spawn x = same `cactusX = 700`** — both obstacle types enter from the right edge at the same column. Reuses the existing module-level `cactusX` rather than introducing a parallel `birdX = 700` (it's the same constant by definition). If a future phase needs different entry columns, that's the time to split.
- **D-05: Bird spawn timer early-returns on `gameOver === true`**, mirroring `placeCactus` (`dino.js:211-213`). The `setInterval` is never cleared (matches Phase 1's documented "loops self-perpetuate" pattern, ARCHITECTURE.md §"Notable Architectural Properties").

### Discrete heights (BIRD-03)
**Coordinate math anchors:**
- Standing dino: `dino.y = 156`, `dino.height = 94` → occupies y ∈ [156, 250].
- Ducking dino (per Phase 2 D-14): `dino.y = duckY = 190`, `dino.height = 60` → occupies y ∈ [190, 250].
- Jumping apex (per CONCERNS.md §"Fragile Areas" #1): `dino.y ≈ 31`, occupies y ∈ [31, 125] at apex.
- Bird canonical box: 97 wide × 68 tall.

- **D-06: Three spawn heights** (matches the original Chrome dino's bird-height variety; satisfies BIRD-03's "multiple discrete heights" while keeping each height distinguishable on first read):
  - **`birdLowY = 110`** — bird occupies y ∈ [110, 178]. Standing dino [156, 250] → overlaps [156, 178], collision. Ducking dino [190, 250] → no overlap (178 < 190), safe. Jumping at apex [31, 125] → overlaps [110, 125], collision. **Verdict: must duck.**
  - **`birdMidY = 156`** — bird occupies y ∈ [156, 224]. Aligned with standing dino's top. Ducking dino [190, 250] → overlaps [190, 224], collision. Jumping at apex [31, 125] → no overlap (125 < 156), safe. **Verdict: must jump.**
  - **`birdHighY = 50`** — bird occupies y ∈ [50, 118]. Standing dino [156, 250] → no overlap, safe. Ducking dino [190, 250] → no overlap, safe. Jumping apex [31, 125] → overlaps [50, 118], collision. **Verdict: stand still (or duck, also safe). Punishes reflexive jumping.**

  Together these satisfy BIRD-03 ("at minimum: a 'low' height that requires the player to duck, and a 'high' height that requires the player to jump or to stand"). The mid height adds a "must jump" demand for variety; ROADMAP success criterion 3 ("at least one height clears a standing dino (jump-or-duck-required) and at least one height requires ducking specifically (cannot be cleared by jumping)") is met by birdMidY (jump-or-duck-but-duck-doesn't-actually-clear-it → must-jump) and birdLowY (must-duck-only) respectively. Even reading "jump-or-duck-required" loosely, birdHighY (no-action-required for standing player) satisfies "clears a standing dino."
- **D-07: Pick the spawn height per-bird at spawn time** (in `placeBird`, see D-03). Once spawned, a bird's `y` is constant for its on-screen lifetime — no vertical motion. Birds only scroll horizontally with `velocityX`, like cacti.

### Hitbox & sprite size
- **D-08: Canonical bird hitbox = 97 × 68 (bird1 dims) for both render and collision.** Matches Phase 2 D-14's pattern: bird1.png is 97×68, bird2.png is 93×62 — a 4×6 pixel variation across the flap cycle that's below player perception. Freezing the hitbox at 97×68 prevents collision-edge jitter every flap (which would feel like inconsistent collisions to the player). `context.drawImage(birdSprite, bird.x, bird.y, birdWidth, birdHeight)` stretches the smaller bird2 frame slightly — visually imperceptible.
- **D-09: Bird hitbox does NOT shrink to "tightest pixel-accurate" rectangles.** Same call as the dino and cactus: AABB-on-bounding-box is the established rule (`detectCollision` in `dino.js:260-265`). If "feels like Chrome dino" testing later reveals collisions feel cheap, that's a separate tuning phase, not a v1.0 concern.

### Animation flap rate (BIRD-02)
- **D-10: Birds use `frameCount / 12` for sprite-cycle (~5 fps swap = ~2.5 fps full flap cycle).** Phase 2 D-10/D-11 locked the dino at `frameCount / 6` (~10 fps). REQUIREMENTS.md BIRD-02 says "at a flap rate distinct enough to read as flapping" and ROADMAP success criterion 2 says "distinct from the dino's run/duck rate" — half the dino's cycle rate reads as slow wing flaps (matches a real bird's flap cadence visually) and is unmistakably distinct. Hardcode the literal `12` in the sprite picker.
- **D-11: All on-screen birds flap in lockstep** — they share the single global `frameCount`. Per-bird animation phase offsets (so birds flap out of sync) are out of scope; visually fine for v1.0 since spawns are spaced enough that two birds rarely overlap on screen anyway. Captured as deferred.
- **D-12: Bird sprite picker is inlined** in the bird draw loop, mirroring Phase 2 D-04's inline-if-else style:
  ```js
  let birdSprite = (Math.floor(frameCount / 12) % 2 == 0) ? bird1Img : bird2Img;
  context.drawImage(birdSprite, bird.x, bird.y, bird.width, bird.height);
  ```
  No helper function; flat tutorial style. Frame counter from Phase 2 D-09 is reused unchanged — no new counter, no new constant, no new module-level state for this.

### Collision integration (BIRD-04)
- **D-13: Add a separate bird-update-and-collision loop in `update()` mirroring the cactus loop (`dino.js:168-179`).** Two near-identical loops in flat tutorial style is the right call here — refactoring to a unified obstacle loop is out of scope (D-01). The bird loop:
  1. Iterates `birdArray`.
  2. Advances `bird.x += velocityX` (same scroll as cacti).
  3. Picks the current sprite via D-12's expression and draws it.
  4. Calls `detectCollision(dino, bird)` — on hit, sets `gameOver = true` and paints the dead-sprite same-frame (mirrors `dino.js:174-178`). The same-frame dead paint is what makes the dead state visible without waiting for the next frame; Phase 2 D-04's state-derivation in the next frame would also paint dead, but earlier this frame the cactus loop already established the same-frame paint pattern, so birds match it for visual consistency.
- **D-14: Place the bird loop AFTER the cactus loop in `update()`.** Order: track → dino state-derivation/draw → cactus loop → **bird loop** → score. Reason: cacti are visually grounded (foreground); birds are airborne (often above the dino head); painting birds last keeps them on top of any visual overlap with cacti. In practice cacti and birds don't overlap because their y ranges differ, but this future-proofs against any feature that brings them into the same vertical band.
- **D-15: Bird collision uses the same `detectCollision(a, b)` function unchanged.** No bird-specific collision tuning. The function is pure AABB on `{x, y, width, height}` and birds satisfy that shape per D-01.

### Pruning
- **D-16: `birdArray.shift()` when length > 5**, mirroring `cactusArray.shift()` (`dino.js:242-244`). Same correctness caveat documented in CONCERNS.md §"Latent Bugs" #1: pruning by count rather than position can drop on-screen birds if scroll speed or spawn rate changes. At current `velocityX = -8` and 1500ms cadence, birds traverse 750 px ÷ 8 px/frame ÷ 60 frames/sec ≈ 1.56 seconds — a bird leaves the canvas before the next bird spawns, so the array reaches length 1 (sometimes 2) most of the time. Cap of 5 is a generous safety net. Flagged as deferred for any future difficulty-scaling phase.

### Reset behavior
- **D-17: `resetGame()` extends with `birdArray = []`** (one line addition, matching the existing `cactusArray = []` line at `dino.js:250`). No other reset is needed — birds have no per-entity persistent state beyond array membership. The bird sprite Images are loaded once at startup and retained.

### Code style and structure
- **D-18: Maintain tutorial-style globals.** New module-level `let` declarations grouped together, near (or after) the cactus block: `birdArray`, `bird1Img`, `bird2Img`, `birdWidth`, `birdHeight`, `birdLowY`, `birdMidY`, `birdHighY`. Inline magic-number comments per CONVENTIONS.md (`let birdWidth = 97; //match bird1.png width`).
- **D-19: No `const`. No classes. No module split. No new files.** PROJECT.md and prior phase CONTEXTs (Phase 1 D-16/D-18, Phase 2 D-23/D-24) all lock this; reaffirm here so the planner doesn't try to introduce structure. All bird code lives in `dino.js`.
- **D-20: New `placeBird()` function** modeled on `placeCactus()` (`dino.js:210-245`). New `keyUp` is unchanged (no bird input). `moveDino` is unchanged (no bird input).

### Claude's Discretion
- Exact identifier casing for new sprite globals (`bird1Img` vs `birdImg1` vs `birdRunImg1`) — match local convention (`cactus1Img` precedent → `bird1Img`).
- Whether to declare `placeBird` above or below `placeCactus` — order by logical grouping; either is fine.
- Whether the bird loop's collision branch inlines the same-frame `drawImage(dinoDeadImg, ...)` or refactors to a small helper shared with the cactus loop — inline is fine and matches Phase 2 D-04's preference for flat code over premature factoring.
- Exact band splits in `placeBird`'s probability roll (D-03 gives recommended starting points: 30% low, 25% mid, 25% high, 20% empty). The planner can refine these during play-testing without re-discussing.
- Whether to pick height via probability bands (D-03) or a uniform-among-3-heights random integer pick — bands match the `placeCactus` precedent and allow asymmetric weighting (more "must duck" exposures to reinforce the duck mechanic, fewer "stand still" tricks). Bands recommended; uniform is acceptable.
- Whether to add `let birdY` (a variable) or use the three named height constants directly in `placeBird` — the named constants are clearer; do not introduce a single `birdY` mutable.
- Order of bird sprite preloads in `window.onload` (alphabetical, by usage frequency, etc.) — match local convention.

### Folded Todos
None — `gsd-sdk query todo.match-phase 3` returned 0 matches.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner) MUST read these before planning or implementing.**

### Roadmap & requirements (locked)
- `.planning/ROADMAP.md` §"Phase 3: Bird obstacles" — phase goal, success criteria, requirement mapping (BIRD-01..BIRD-04). Confirms 2 plans already specced (03-01: bird entity + spawning + scroll; 03-02: bird animation + collision wiring).
- `.planning/REQUIREMENTS.md` §"Bird Obstacles" — BIRD-01 (spawn alongside cacti, scroll at game speed), BIRD-02 (`bird1.png`/`bird2.png` flap, distinct rate), BIRD-03 ("multiple discrete heights … low requires duck, high requires jump-or-stand"), BIRD-04 (game-over path matches cactus collision).
- `.planning/PROJECT.md` §"Constraints" — vanilla-JS / no-build / single-file; the duck-mechanic-without-bird-obstacles non-decision (`Birds added as flying *obstacles*, not decoration` — Key Decisions table); v1.0 explicitly chose to surface birds from the start (no score gate).
- `.planning/PROJECT.md` §"Core Value" — "feels like the real Chrome dino game" benchmark applies to bird flap timing, height variety, and collision feel.

### Carry-forward from Phase 1 (still load-bearing)
- `.planning/phases/01-scrolling-track-restart/01-CONTEXT.md` §"Implementation Decisions" — D-12 canonical reset list (Phase 3 D-17 extends with `birdArray = []`); D-13 documents `setInterval`/RAF self-perpetuation that Phase 3's `setInterval(placeBird, 1500)` reuses.

### Carry-forward from Phase 2 (load-bearing for BIRD-03 testability)
- `.planning/phases/02-dino-animation-state-machine/02-CONTEXT.md` §"Implementation Decisions" —
  - D-09 (`frameCount` global, incremented at top of `update()`) — Phase 3 D-10/D-12 reuse this counter unchanged for bird flap.
  - D-14 (`duckWidth = 118`, `duckHeight = 60`, `duckY = 190`) — Phase 3 D-06's height calculations depend on these specific values; if Phase 2's duck dims ever change, Phase 3's height constants must be re-derived.
  - D-19 (extension of Phase 1's reset list) — Phase 3 D-17 chains onto this same list.
- `.planning/phases/02-dino-animation-state-machine/02-VERIFICATION.md` (if present after Phase 2 verification) — confirms physics constants and duck hitbox unchanged. Phase 3 D-06 height math assumes those constants hold.

### Codebase (read-only context)
- `.planning/codebase/ARCHITECTURE.md` §"Abstractions" — the entity-shape contract `{x, y, width, height}` that `detectCollision` reads. Phase 3 D-01 satisfies this for birds.
- `.planning/codebase/ARCHITECTURE.md` §"Notable Architectural Properties" — documents that `update()` and `setInterval` self-perpetuate; Phase 3 reuses this for the bird spawn timer and skips any `clearInterval`/`cancelAnimationFrame` dance.
- `.planning/codebase/CONCERNS.md` §"Latent Bugs" #1 — `cactusArray.shift()` correctness caveat. Phase 3's `birdArray.shift()` (D-16) inherits the same caveat; flagged in Deferred Ideas.
- `.planning/codebase/CONCERNS.md` §"Fragile Areas" #2 — spawn-rate vs scroll-speed coupling. Phase 3 introduces a second spawner; combined obstacle density (cacti @1Hz + birds @0.67Hz with empty band ≈ effective ~1.3 obstacles/sec) needs a play-feel sanity check during planning, but is far from "impossible" given current `velocityX` and dino airtime.
- `.planning/codebase/CONVENTIONS.md` §"Patterns" — probability bands pattern (`Math.random()` + chained `if/else if`) is what Phase 3 D-03 follows; inline magic-number comments per local style.
- `.planning/codebase/CONVENTIONS.md` §"Code Style" — `let`-everywhere (no `const`), 4-space indent, double-quoted strings, top-level `function name() {}`.
- `dino.js:67-110` — `window.onload` (where bird sprite preloads + `setInterval(placeBird, 1500)` wire in).
- `dino.js:112-186` — `update()` body (where the bird update/draw/collision loop inserts after the cactus loop).
- `dino.js:168-179` — cactus update/draw/collision loop — the structural template for the new bird loop (D-13).
- `dino.js:210-245` — `placeCactus()` — the structural template for the new `placeBird()` (D-03).
- `dino.js:247-258` — `resetGame()` — extends with `birdArray = []` per D-17.
- `dino.js:260-265` — `detectCollision(a, b)` — used unchanged by the bird collision branch (D-15).

### Assets (locked, all present)
- `img/bird1.png` — 97 × 68 RGBA. Flap-cycle frame 1. **Hitbox uses 97×68.**
- `img/bird2.png` — 93 × 62 RGBA. Flap-cycle frame 2. (Hitbox stays at 97×68; 4×6 px difference is below perception, matches Phase 2 D-14 duck precedent.)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`detectCollision(a, b)` (`dino.js:260-265`)** — Pure AABB function on `{x, y, width, height}`. Phase 3 calls it on `(dino, bird)` unchanged.
- **`velocityX = -8` (`dino.js:51`)** — Single source of truth for left-scroll speed. Birds advance `bird.x += velocityX` per frame, identical to cacti and the track. Do NOT introduce a `birdVelocityX`.
- **`frameCount` global + increment at top of `update()` (Phase 2 D-09, `dino.js:113`)** — Reused unchanged for bird flap cycle (D-10). No new counter needed.
- **`setInterval` "spawner that early-returns on gameOver" pattern (`dino.js:210-213`)** — `placeBird` follows the exact same pattern (D-05). The interval is never cleared; flipping `gameOver = false` in `resetGame()` resumes spawning automatically.
- **Probability-band pattern in `placeCactus` (`dino.js:224-241`)** — `Math.random()` + chained `if/else if` thresholds. `placeBird` mirrors this verbatim (D-03).
- **`cactusX = 700` (`dino.js:43`)** — Spawn x for off-canvas-right entry. Birds reuse this constant (D-04).
- **Entity object shape `{img, x, y, width, height}`** — matches `cactusArray` items; bird entities use the same shape (only `img`, `x`, `y`, `width`, `height` matter — collision and rendering both read from these).
- **Same-frame dead-sprite paint on collision (`dino.js:174-178`)** — Bird collision branch mirrors this exactly: `gameOver = true; context.drawImage(dinoDeadImg, dino.x, dino.y, dino.width, dino.height);`.
- **Phase 2's `dinoDeadImg` global (`dino.js:27`)** — Already loaded; bird collision reuses it for the same-frame dead paint. No new image loading needed for Phase 3 beyond the two bird sprites.
- **Phase 1's `resetGame()` (`dino.js:247-258`)** — Phase 3 extends with one new line (`birdArray = []`). Does NOT replace.

### Established Patterns
- **`let`-everywhere — including immutables.** Reaffirmed for Phase 3's new globals.
- **Image-loading via `new Image()` + `.src` (cactus/dino-sprite pattern, `dino.js:71-101`)** — Phase 3's two new bird sprite Images use the same fire-and-forget pattern. No `onload` per sprite.
- **Per-frame derivation, not event-driven transitions.** Each frame, the bird-loop iterates and re-derives sprite + draws. No transition events. Mirrors Phase 2 D-06's state-derivation philosophy.
- **Inline-comment magic numbers.** Match `let velocityX = -8; //cactus moving left speed`. Use `let birdWidth = 97; //match bird1.png width`, `let birdLowY = 110; //must-duck height — bird occupies 110-178, misses ducking dino at 190+`, etc.
- **Section headers as comments.** Top of `dino.js` uses `//board`, `//dino`, `//cactus`, `//physics`, `//track` — Phase 3 adds `//bird` block grouped after `//cactus`.
- **Two near-identical entity loops in `update()`** is the established pattern (track scroll-and-wrap is one block, cactus advance/draw/collide is another). The bird loop is the third sibling block.

### Integration Points
- **`window.onload` (`dino.js:67-110`)** —
  - Add 2 sprite preloads (matching cactus/dino-sprite pattern, no onload guards): `bird1Img = new Image(); bird1Img.src = "./img/bird1.png";` and same for bird2.
  - Add the spawn timer: `setInterval(placeBird, 1500); //birds spawn every 1.5 seconds`.
- **Globals block (`dino.js:1-65`)** — Add a `//bird` section with `let birdArray = []`, `let bird1Img`, `let bird2Img`, `let birdWidth = 97`, `let birdHeight = 68`, `let birdLowY = 110`, `let birdMidY = 156`, `let birdHighY = 50`. Group after `//cactus`, before `//physics`, or after `//track` — Claude's discretion.
- **`update()` body (`dino.js:112-186`)** — Insert the bird update/draw/collision loop AFTER the cactus loop (`dino.js:168-179`) and BEFORE the score block (`dino.js:181-185`). Mirror the cactus loop's exact structure: advance x, draw sprite (with flap-cycle picker per D-12), call `detectCollision(dino, bird)`, on hit set `gameOver = true` and paint dead-sprite same-frame.
- **New `placeBird()` function** — Place near `placeCactus()` (`dino.js:210-245`). Body mirrors `placeCactus`'s probability-band shape but picks bird height instead of cactus image.
- **`resetGame()` (`dino.js:247-258`)** — Add one line: `birdArray = [];` near the existing `cactusArray = [];`.
- **`moveDino()` and `keyUp()` are unchanged** — birds have no input handling.

</code_context>

<specifics>
## Specific Ideas

- **"Feels like Chrome dino" is the benchmark (PROJECT.md Core Value).** Bird flap rate, height variety, and the "low bird must duck" feedback loop are what make birds feel right. The 12-frame flap (D-10) is half the dino's 6-frame run cycle — wing flaps look slow because birds are big-winged in this art style.
- **DINO-04's hitbox shrink (Phase 2 D-14) is the *reason* this phase exists.** Without the duck hitbox change, low birds would be unsolvable. The Phase 2 → Phase 3 dependency in ROADMAP.md ("Depends on: Phase 2 (the duck mechanic and shrunk hitbox from DINO-03/DINO-04 are required for BIRD-03 to be meaningfully testable — without them, 'low birds requiring duck' can't be verified)") is empirically validated by Phase 3 D-06's height math.
- **The mid-bird (`birdMidY = 156`) is a "must jump" obstacle.** Ducking doesn't help (vertical overlap with bird body); the only escape is being airborne when the bird traverses the dino's x-range. Adds tension matching original Chrome dino mid-height birds.
- **The high-bird (`birdHighY = 50`) is a "punish reflexive jumping" obstacle.** Standing dino doesn't collide; only an ill-timed jump catches the bird. This matches a real Chrome dino mechanic and rewards player learning.
- **No vertical motion per bird.** Real Chrome dino birds are sometimes shown with subtle vertical bobbing tied to flap; v1.0 keeps each spawned bird at a constant y. If "feels like Chrome dino" testing reveals the difference is jarring, vertical bobbing is a small follow-up; deferred.

</specifics>

<deferred>
## Deferred Ideas

- **Score-gated bird appearance** — Original Chrome dino hides birds until score 450+. v1.0 explicitly chose "birds from the start" (PROJECT.md Out of Scope). Captured as `BIRD-LATE-01` in REQUIREMENTS.md v2.
- **Per-bird animation phase offsets** — All birds currently flap in lockstep via shared `frameCount`. With the empty-band spawn pattern, two on-screen birds at once is rare; visually fine for v1.0. Revisit if play-testing reveals "synchronized birds look wrong."
- **Vertical bobbing per bird** — Constant y for each spawned bird (D-07). Real Chrome dino has subtle bird bobbing tied to flap. Out of scope for v1.0; small follow-up if play-feel demands it.
- **Sprite-frame-perfect hitbox (per-frame width swap between bird1=97×68 and bird2=93×62)** — Skipped per D-08 because variation is below perception. Same call as Phase 2 D-14 duck pattern. If a future tuning phase finds bird hitboxes feel jittery, this is the knob.
- **`birdArray.shift()` correctness if scroll speed changes** — CONCERNS.md Latent Bug #1 inherited. At current `velocityX = -8` and 1500ms cadence, birds exit screen before length-cap of 5 is approached. Flagged for any future difficulty-scaling phase (`DIFFICULTY-01`, v2).
- **Unifying cacti and birds into one obstacle array/loop** — Refactoring out of scope per D-01. Once `dino.js` grows past ~250 lines (Phase 3 will push it close), the per-entity-type loop pattern starts to want internal structure. Revisit at the next major restructuring opportunity (v2 or a deliberate refactor phase).
- **Dynamic bird spawn cadence based on score** — Currently fixed at 1500ms. Original Chrome dino accelerates spawn rate with difficulty. v1.0 keeps it constant; bundled with `DIFFICULTY-01` deferral.
- **Sound effects on flap / bird collision** — Captured as `AUDIO-01` v2.

### Reviewed Todos (not folded)
None reviewed — `todo_count` was 0.

</deferred>

---

*Phase: 3-bird-obstacles*
*Context gathered: 2026-05-06*
