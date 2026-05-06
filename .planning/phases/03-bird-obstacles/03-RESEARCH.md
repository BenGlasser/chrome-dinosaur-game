# Phase 3: Bird obstacles - Research

**Researched:** 2026-05-05
**Domain:** HTML5 Canvas 2D game — second obstacle type (flying birds) integrated into an existing scroll-and-collide loop
**Confidence:** HIGH

## Summary

This phase adds flying birds as a second obstacle type alongside the existing cacti. The codebase, requirements, and CONTEXT.md are all unusually well-defined: every implementation choice (D-01..D-20) is locked and the assets are present at the documented dimensions. There is **no library research to do** — this is a vanilla-JS / Canvas 2D wiring task. The "research" value here is verifying that the locked decisions are physically and arithmetically correct against the actual code, and surfacing any gotchas the planner needs to handle that the CONTEXT.md author may have glossed over.

Three findings the planner needs to act on:

1. **The CONTEXT.md jump-apex y is off by ~5 px** (`31` documented; `36` actual). The verdicts in D-06 (must-duck for low, must-jump for mid, don't-jump for high) are still correct because every margin clears 5 px, but anyone copying the `[31, 125]` interval into a code comment will be propagating a wrong number.
2. **Low-bird + any-cactus stacking is the only genuinely unwinnable cluster.** The 20 % "no bird" empty band in D-03 is the *only* mitigation; the planner should be aware that if play-test feel is unfair, widening the empty band is the knob.
3. **One latent inconsistency in CONTEXT.md D-08** — it claims `bird1.png` is 97×68 (verified true) and `bird2.png` is 93×62 (verified true), but reading the dimensions byte-for-byte from the assets confirms both — the planner can trust the locked hitbox dim of 97×68.

**Primary recommendation:** Implement Phase 3 exactly as CONTEXT.md specifies. Update the inline comment in the apex-collision rationale (or D-06 carryover) from `dino.y ≈ 31` to `dino.y = 36`. No other deviation needed.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Bird sprite preload | `window.onload` (bootstrapping) | — | Matches Phase 2's preload site for dino sprites and Phase 1's track preload |
| Bird spawning (1 per 1.5 s) | `setInterval(placeBird, 1500)` | — | Independent timer, mirrors `setInterval(placeCactus, 1000)` |
| Bird height selection (3 discrete heights) | `placeBird()` body | — | Probability-band pattern from `placeCactus`; pick `birdLowY/MidY/HighY` per spawn |
| Bird scroll (advance x per frame) | `update()` bird loop | — | Reuses `velocityX = -8` global; same per-frame mutation as cacti |
| Bird flap animation (sprite cycle) | `update()` bird loop | `frameCount` global from Phase 2 D-09 | Inline `Math.floor(frameCount/12) % 2` picker; no new counter |
| Bird-vs-dino collision | `update()` bird loop | `detectCollision(a, b)` function | Pure AABB; works unchanged because birds satisfy `{x, y, width, height}` shape |
| Game-over on bird hit | `update()` bird loop | `gameOver` global + `dinoDeadImg` from Phase 2 D-01 | Same-frame dead-sprite paint; identical to cactus collision branch |
| Birds cleared on restart | `resetGame()` | — | Add `birdArray = []` line; no other state needed |

This is the only architectural-tier mapping needed. There is one tier (browser, Canvas 2D, no server, no API). All work happens in `dino.js`.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BIRD-01 | Birds spawn periodically alongside cacti and scroll left at game speed | D-02 (`setInterval(placeBird, 1500)`), D-04 (spawn x = `cactusX = 700`), D-13 (advance `bird.x += velocityX` per frame in update()) |
| BIRD-02 | Each spawned bird animates with alternating `bird1.png`/`bird2.png` frames at a flap rate distinct from dino's run/duck rate | D-10 (`frameCount / 12` → ~5 fps swap; dino is `frameCount / 6` → ~10 fps swap; clearly distinct) |
| BIRD-03 | Multiple discrete heights — at minimum a "low" requiring duck and a "high" requiring jump-or-stand | D-06 (three heights: `birdLowY=110` must-duck, `birdMidY=156` must-jump, `birdHighY=50` don't-jump) — verified by frame-by-frame physics walk |
| BIRD-04 | Bird-vs-dino collision triggers same game-over path as cactus | D-13/D-15 (mirror cactus collision branch: `gameOver = true` + same-frame dead-sprite paint), D-17 (extend `resetGame()` with `birdArray = []`) |

## Standard Stack

There is no library stack. Phase 3 introduces zero new runtime dependencies — confirmed by PROJECT.md §"Constraints" (no npm, no CDN, no transpiler) and Phase 2 D-23/D-24 (no `const`, no classes, no module split, single file). This is a deliberate constraint reaffirmed by every prior phase context.

| Asset | Verified Source | Purpose |
|-------|-----------------|---------|
| `img/bird1.png` | `[VERIFIED: file img/bird1.png]` PNG, 97×68 RGBA | Flap-cycle frame 1; canonical hitbox source |
| `img/bird2.png` | `[VERIFIED: file img/bird2.png]` PNG, 93×62 RGBA | Flap-cycle frame 2; rendered at canonical 97×68 (4×6 px stretch, sub-perceptual) |

Verification command: `file img/bird1.png img/bird2.png` returned the dimensions above. CONTEXT.md D-08's claim of "bird1=97×68, bird2=93×62" is correct.

## Architecture Patterns

### System Architecture Diagram

```
window.onload (bootstrapping)
   │
   ├── new Image() x 2 → bird1Img.src, bird2Img.src      [NEW]
   ├── new Image() x N (existing dino, cactus, track sprites)
   ├── requestAnimationFrame(update)                      ← self-perpetuates
   ├── setInterval(placeCactus, 1000)                     ← existing 1 Hz spawner
   ├── setInterval(placeBird, 1500)                       [NEW] 0.667 Hz spawner
   ├── document.addEventListener("keydown", moveDino)
   └── document.addEventListener("keyup", keyUp)


keydown ──► moveDino()  ── (unchanged: jump on Space/ArrowUp; isDuckHeld=true on ArrowDown)
keyup   ──► keyUp()     ── (unchanged: isDuckHeld=false on ArrowDown release)


setInterval (1000ms) ──► placeCactus() ── early-return if gameOver
                            ↓
                            cactusArray.push({img, x=700, y, width, height})
                            shift if length > 5

setInterval (1500ms) ──► placeBird()   ── early-return if gameOver       [NEW]
                            ↓
                            random height ∈ {birdLowY, birdMidY, birdHighY} or no-bird
                            birdArray.push({img: bird1Img, x=700, y, width=97, height=68})
                            shift if length > 5


requestAnimationFrame ──► update()
   │
   ├─ frameCount++                    (Phase 2 D-09)
   ├─ requestAnimationFrame(update)   self-reschedule
   ├─ if (gameOver) return
   ├─ context.clearRect(...)
   │
   ├─ track block        — track1.x += velocityX; track2.x += velocityX; wrap; draw
   │
   ├─ dino block         — derive dinoState; apply hitbox dims; gravity (skip if ducking); pick sprite; drawImage
   │     (state derivation: dead > jumping > ducking > running)
   │
   ├─ cactus loop        — for each cactus: cactus.x += velocityX; drawImage; detectCollision → gameOver + same-frame dead-sprite paint
   │
   ├─ bird loop  [NEW]   — for each bird: bird.x += velocityX;
   │                        let birdSprite = (Math.floor(frameCount/12) % 2 == 0) ? bird1Img : bird2Img;
   │                        drawImage(birdSprite, bird.x, bird.y, bird.width, bird.height);
   │                        detectCollision(dino, bird) → gameOver + same-frame dead-sprite paint
   │
   └─ score block        — context.fillStyle="black"; score++; drawText
```

The bird loop is the third sibling block in the entity-loop sequence. The order **track → dino → cactus → bird → score** is intentional (D-14): birds paint LAST so any future feature that brings birds and cacti into the same vertical band doesn't cause z-order glitches.

### Recommended Project Structure

There is no project structure to recommend. The file layout is:

```
chrome-dinosaur-game/
├── dino.js          # ALL game code — Phase 3 adds ~30 lines
├── index.html       # Unchanged
├── dino.css         # Unchanged
└── img/
    ├── bird1.png    # Already present; preload added in window.onload
    ├── bird2.png    # Already present; preload added in window.onload
    └── (existing assets)
```

### Pattern 1: Probability-band random selection in spawner

**What:** Single `Math.random()` roll; chained `if/else if` thresholds with one band representing "no spawn."

**When to use:** For Phase 3 only. Match `placeCactus`'s exact shape (`dino.js:224-241`).

**Example:** `[CITED: dino.js:224-241]`

```js
let placeCactusChance = Math.random(); //0 - 0.9999...

if (placeCactusChance > .90) { //10% you get cactus3
    cactus.img = cactus3Img;
    cactus.width = cactus3Width;
    cactusArray.push(cactus);
}
else if (placeCactusChance > .70) { //30% you get cactus2
    ...
}
else if (placeCactusChance > .50) { //50% you get cactus1
    ...
}
// implicit else: 50% no cactus
```

For `placeBird()` per D-03:
```js
let placeBirdChance = Math.random();
if      (placeBirdChance > .80) { /* 20% no bird */ }
else if (placeBirdChance > .55) { /* 25% high (y=birdHighY) */ }
else if (placeBirdChance > .30) { /* 25% mid  (y=birdMidY)  */ }
else                            { /* 30% low  (y=birdLowY)  */ }
```

### Pattern 2: Per-frame entity loop (advance, draw, collide)

**What:** Iterate the array, advance `x` by `velocityX`, draw, then check collision against `dino`.

**Where:** Mirror the cactus loop at `dino.js:169-179` `[CITED: dino.js:169-179]`:

```js
for (let i = 0; i < cactusArray.length; i++) {
    let cactus = cactusArray[i];
    cactus.x += velocityX;
    context.drawImage(cactus.img, cactus.x, cactus.y, cactus.width, cactus.height);

    if (detectCollision(dino, cactus)) {
        gameOver = true;
        //draw the dead sprite same-frame; subsequent frames early-return before clearRect, so this paint persists
        context.drawImage(dinoDeadImg, dino.x, dino.y, dino.width, dino.height);
    }
}
```

For the bird loop, replace `cactus.img` with the per-frame sprite-pick expression:
```js
for (let i = 0; i < birdArray.length; i++) {
    let bird = birdArray[i];
    bird.x += velocityX;
    let birdSprite = (Math.floor(frameCount / 12) % 2 == 0) ? bird1Img : bird2Img;
    context.drawImage(birdSprite, bird.x, bird.y, bird.width, bird.height);

    if (detectCollision(dino, bird)) {
        gameOver = true;
        context.drawImage(dinoDeadImg, dino.x, dino.y, dino.width, dino.height);
    }
}
```

### Pattern 3: Per-frame state derivation (no transition events)

**What:** Each frame, recompute the world state from inputs and globals; never use enter/exit hooks. The dino state machine in Phase 2 D-06 is the canonical example. Bird-flap-frame is also derived per frame (`Math.floor(frameCount / 12) % 2`).

### Anti-Patterns to Avoid

- **Don't unify cacti and birds into one `obstacleArray` with a `type` field.** D-01 explicitly forbids this — it's a refactor masquerading as a feature, and Phase 2 D-23 forbids architectural restructuring beyond the phase mandate.
- **Don't introduce a parallel `birdVelocityX`.** D-04 reuses the existing `velocityX = -8`. A parallel constant could drift; sharing the global guarantees birds and cacti scroll at identical speed.
- **Don't introduce a parallel `birdX = 700` constant.** D-04 reuses `cactusX = 700` directly. Both obstacle types enter from the same off-canvas-right column.
- **Don't add a per-bird `flapCounter`.** D-11 has all birds flap in lockstep using shared `frameCount`. This is fine for v1.0 — birds rarely overlap on screen anyway (max 2 simultaneous, ~600 px apart).
- **Don't gate bird spawn on score.** Score-gated bird appearance (BIRD-LATE-01) is explicitly v2 per CONTEXT.md "Deferred Ideas" and PROJECT.md "Out of Scope (v1.0)."
- **Don't shrink the bird hitbox to per-frame sprite-accurate dimensions.** D-08 freezes the hitbox at 97×68 across both flap frames; the 4×6 px difference is below player perception and shrinking would cause collision-edge jitter.
- **Don't add a `keyUp` extension for birds.** D-20 confirms birds have no input handling — `moveDino` and `keyUp` are unchanged.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spawn timer | A `setTimeout`-recursion chain or a custom timer wheel | Plain `setInterval(placeBird, 1500)` | Matches existing `placeCactus` pattern; "loops self-perpetuate" is the documented architectural property `[CITED: ARCHITECTURE.md §"Notable Architectural Properties"]` |
| Frame counter for bird flap | A new module-level `birdFlapCounter` | Reuse Phase 2 D-09's `frameCount` global | One counter, one source of truth; CONTEXT.md D-12 explicitly mandates this |
| Collision detection | Pixel-perfect or rotated-rect collision | Existing `detectCollision(a, b)` AABB function `[CITED: dino.js:260-265]` | Birds satisfy the entity-shape contract; the function works unchanged |
| Death-sprite swap | Re-implement `dinoImg.src` swap | Reuse Phase 2 D-01's pre-loaded `dinoDeadImg` global; same-frame `context.drawImage(dinoDeadImg, ...)` | Phase 2 already retired the `.src` swap pattern; bird collision uses the new pattern |
| Game-over reset for birds | Build a "clear all entities" helper | Add one line `birdArray = []` to `resetGame()` per D-17 | Phase 1 D-12 established the canonical reset list; D-17 extends it minimally |
| Per-bird animation state | Add `bird.flapFrame`, `bird.flapTimer` | Inline `Math.floor(frameCount / 12) % 2` in the draw loop | Lockstep flap is acceptable for v1.0 (D-11); per-bird offsets are a deferred polish concern |

**Key insight:** Phase 3 is **maximally derivative** — every new piece of behavior has a near-identical existing pattern in the codebase. The planner should not need to invent any new abstraction; if a task feels novel, double-check against an existing analogue before building.

## Common Pitfalls

### Pitfall 1: Apex y mis-quoted in CONTEXT.md
**What goes wrong:** CONTEXT.md D-06 anchors the jump apex at `dino.y ≈ 31` (citing CONCERNS.md §"Fragile Areas" #1). The actual apex from frame-by-frame simulation of `velocityY = -10`, `gravity = 0.4` is `dino.y = 36` (24 frames after jump impulse).
**Why it happens:** CONCERNS.md uses the continuous-physics formula `(-10)² / (2·0.4) = 125 px above ground` (i.e., apex y ≈ `156 - 125 = 31`). But the game's discrete integration `velocityY += gravity; dino.y = Math.min(dino.y + velocityY, dinoY)` truncates motion at frame boundaries — the actual peak height is 120 px above ground, putting apex y at 36.
**How to avoid:** When the planner writes inline-comment magic numbers for `birdLowY = 110` etc., do not quote "31" as the apex. The locked verdicts (must-duck for low, must-jump for mid, don't-jump for high) are still correct because every collision margin clears the 5-px discrepancy:
- birdLow [110, 178] vs apex [36, 130]: 130 > 110 → COLLIDE (jumping doesn't clear; must duck) ✓ verdict holds
- birdMid [156, 224] vs apex [36, 130]: 130 < 156, gap 26 px → SAFE (jumping clears) ✓ verdict holds
- birdHigh [50, 118] vs apex [36, 130]: 36 < 118 → COLLIDE (jumping hits) ✓ verdict holds
**Warning signs:** A code comment that asserts "apex y = 31" is a copy-paste of an incorrect value. Use 36 or just say "during airborne frames" without an exact number.

### Pitfall 2: Cactus + low-bird stacking creates an unwinnable cluster
**What goes wrong:** If a cactus (y=180-250) and a low bird (y=110-178) co-occupy the dino strike zone (x ∈ [-47, 138]) simultaneously, the dino must duck to clear the bird AND jump to clear the cactus. Physically impossible.
**Why it happens:** Two independent spawners (cacti @ 1 Hz, birds @ 0.667 Hz). Their phases drift; on average ~10 % of frames have both an in-strike-zone cactus and bird. Of those, ~30 % spawn the bird at low height (per D-03 30 % low band), giving roughly 3 % of frames with an unwinnable stack — IF the cactus and bird are also x-aligned within the dino's strike zone, which is a smaller subset.
**How to avoid:** D-03's 20 % "no bird" empty band is the primary mitigation. If play-testing reveals the unwinnable rate feels unfair (player rage-quits on inputs they can't escape), the planner should:
- Bump the empty-band probability from 20 % to 30 % (or higher).
- Or add a "if cactus is within X px of spawn x, skip this bird spawn" guard (this is a bigger refactor — defer if possible).
The probability-band proportions are explicitly in **Claude's Discretion** per CONTEXT.md ("the planner can refine these during play-testing without re-discussing").
**Warning signs:** If the `placeBird` body computes height after deciding-to-spawn, and a separate guard checks cactusArray for x-proximity, that's correct mitigation. Avoid silently dropping spawns just because birds happen to feel hard.

### Pitfall 3: `dino.js:103-104` — `track1`/`track2` declaration order
**What goes wrong:** `track1` and `track2` are declared as `let track1; let track2;` at module scope (`dino.js:64-65`) and assigned inside `window.onload` after `trackImg.src` is set. If the planner adds bird globals between these declarations and their assignments, the planner might break the implicit ordering.
**Why it happens:** The codebase mixes "declare at top, assign in onload" and "declare-and-initialize at top." Both are valid; Phase 3 should follow whichever pattern matches the closest analogue (cactus globals are declare-only; cactus image globals are declared as `let cactus1Img;` and assigned in onload).
**How to avoid:** For bird globals, follow the cactus-image pattern: declare `let bird1Img; let bird2Img;` at top of file (in a `//bird` block), and assign `bird1Img = new Image(); bird1Img.src = ...` inside `window.onload`. **Don't initialize Image objects at module scope** — `Image()` is a browser API and may be undefined when the script first parses (though in practice the script is loaded after DOM, so it works either way; matching local convention is the safer call).
**Warning signs:** A line `let bird1Img = new Image()` at top-of-file that bypasses the cactus-image pattern is a stylistic break. Match cactus pattern.

### Pitfall 4: Bird collision branch must paint dead sprite same-frame
**What goes wrong:** If the bird collision branch only sets `gameOver = true` and skips the same-frame `drawImage(dinoDeadImg, ...)`, the player would briefly see the live dino sprite at the moment of bird collision because the cactus loop's same-frame dead-paint already happened (or didn't, if no cactus collision) and the next `update()` call early-returns at the top before drawing anything.
**Why it happens:** Phase 2 D-04's state derivation puts dead-sprite selection in the next-frame's draw step, but the cactus loop (`dino.js:174-178`) explicitly paints `dinoDeadImg` same-frame for visual consistency. If birds don't do the same, the player gets a one-frame "live dino in collision" flash.
**How to avoid:** Mirror the cactus loop exactly — same-frame paint after `gameOver = true`. CONTEXT.md D-13 mandates this.
**Warning signs:** If a planner reasons "the next frame will pick `dinoDeadImg` automatically, no need to paint here" — that reasoning is correct for the dino state machine but ignores the early-return at `dino.js:115-117`. After `gameOver = true`, **the next frame's update() returns before clearRect, so no paint happens at all** until restart.

### Pitfall 5: `birdArray.shift()` correctness drift
**What goes wrong:** D-16 prunes `birdArray` by count (`if (birdArray.length > 5) birdArray.shift()`), inheriting the same latent bug from cacti `[CITED: CONCERNS.md §"Latent Bugs" #1]`. At current `velocityX = -8` and 1500 ms cadence, a bird traverses the canvas in ~1.66 sec and exits before the next-but-one bird spawns; array length never approaches 5. **But** if a future phase changes `velocityX` (DIFFICULTY-01 v2) or shortens the bird interval, the shift could drop a still-visible bird.
**Why it happens:** Pruning by position (`bird.x + bird.width < 0`) would be correct; pruning by count is a tutorial shortcut.
**How to avoid:** Don't fix this in Phase 3 — D-16 explicitly defers the fix. Add an inline comment `//count-based prune; safe at current scroll speed, see CONCERNS.md §"Latent Bugs" #1` so the fragility is at the call site for any future maintainer.
**Warning signs:** A planner writing `if (birdArray.length > N)` with a different N than 5 should justify the choice; otherwise match cactus convention (5).

## Code Examples

### Bird globals block (add to `dino.js`, group after `//cactus`)

`[CITED: dino.js:36-48 cactus block — pattern to mirror]`

```js
//bird
let birdArray = [];
let bird1Img;
let bird2Img;
let birdWidth = 97;       //match bird1.png width — canonical hitbox even when bird2 (93×62) is rendered
let birdHeight = 68;      //match bird1.png height
let birdLowY = 110;       //must-duck height — bird occupies y∈[110,178]; misses ducking dino at [190,250]
let birdMidY = 156;       //must-jump height — bird occupies y∈[156,224]; aligned with standing dino top
let birdHighY = 50;       //don't-jump height — bird occupies y∈[50,118]; punishes reflexive jumping
```

(Identifier casing matches `cactus1Img` precedent per D-18 / Claude's Discretion bullet 1.)

### Sprite preload (add to `window.onload` after dino sprite block)

`[CITED: dino.js:78-89 dino sprite preloads — pattern to mirror]`

```js
bird1Img = new Image();
bird1Img.src = "./img/bird1.png";
bird2Img = new Image();
bird2Img.src = "./img/bird2.png";
```

### Spawn timer (add to `window.onload` after `setInterval(placeCactus, 1000)`)

`[CITED: dino.js:107]`

```js
setInterval(placeBird, 1500); //birds spawn every 1.5 seconds
```

### `placeBird()` function (place adjacent to `placeCactus()`)

`[CITED: dino.js:210-245 placeCactus body — pattern to mirror]`

```js
function placeBird() {
    if (gameOver) {
        return;
    }

    let bird = {
        img : bird1Img,    //will be re-picked per-frame in update() draw loop; initial value matches first flap frame
        x : cactusX,       //reuse cactusX = 700 — both obstacles enter from the right edge
        y : 0,             //assigned below by height roll
        width : birdWidth,
        height: birdHeight
    };

    let placeBirdChance = Math.random();
    if (placeBirdChance > .80) {
        return; //20% no bird — breathing room when a cactus stack would be unfair
    }
    else if (placeBirdChance > .55) { //25% high (y=birdHighY) — punishes reflexive jumping
        bird.y = birdHighY;
        birdArray.push(bird);
    }
    else if (placeBirdChance > .30) { //25% mid  (y=birdMidY) — must jump
        bird.y = birdMidY;
        birdArray.push(bird);
    }
    else { //30% low (y=birdLowY) — must duck (uses Phase 2 D-14 hitbox shrink)
        bird.y = birdLowY;
        birdArray.push(bird);
    }

    if (birdArray.length > 5) {
        birdArray.shift(); //count-based prune; safe at current scroll speed, see CONCERNS.md §"Latent Bugs" #1
    }
}
```

### Bird update/draw/collide loop (insert in `update()` AFTER cactus loop, BEFORE score block)

`[CITED: dino.js:169-179 cactus loop — pattern to mirror]`

Insertion point: after `dino.js:179` (close of cactus for-loop), before `dino.js:181` (`//score`).

```js
//bird
for (let i = 0; i < birdArray.length; i++) {
    let bird = birdArray[i];
    bird.x += velocityX;

    let birdSprite = (Math.floor(frameCount / 12) % 2 == 0) ? bird1Img : bird2Img;
    context.drawImage(birdSprite, bird.x, bird.y, bird.width, bird.height);

    if (detectCollision(dino, bird)) {
        gameOver = true;
        //draw the dead sprite same-frame; subsequent frames early-return before clearRect, so this paint persists
        context.drawImage(dinoDeadImg, dino.x, dino.y, dino.width, dino.height);
    }
}
```

### Reset extension (add one line to `resetGame()`)

`[CITED: dino.js:247-258 resetGame body — extend per D-17]`

Add `birdArray = [];` adjacent to the existing `cactusArray = [];` line:

```js
function resetGame() {
    gameOver = false;
    score = 0;
    cactusArray = [];
    birdArray = [];        //NEW — Phase 3 D-17
    velocityY = 0;
    dino.y = dinoY;
    dinoState = "running";
    isDuckHeld = false;
    frameCount = 0;
    dino.width = dinoWidth;
    dino.height = dinoHeight;
}
```

## State of the Art

This is a tutorial-stage codebase deliberately preserved in a flat / procedural / globals style. There is no "state of the art" to track here in the conventional sense — Phase 3's adherence to that style is itself the locked decision (D-19, Phase 2 D-23, Phase 1 D-16/D-18, PROJECT.md "Tutorial origin"). The planner should NOT introduce:

| Old Approach | Modern JS Approach | Verdict for Phase 3 |
|--------------|---------------------|---------------------|
| `let` for everything (incl. immutables) | `const`-by-default | **Keep `let`** — D-19 |
| Module-level globals | ES modules / classes | **Keep globals** — D-19 |
| Inline `if/else if` chain for sprite pick | Object lookup / map | **Keep inline** — Phase 2 D-04 precedent |
| `setInterval` spawner | `requestAnimationFrame`-driven elapsed-time spawner | **Keep `setInterval`** — D-02 (matches existing pattern) |
| `Math.floor(frameCount / 12)` flap | Wall-clock-driven `Date.now() / 200` flap | **Keep `frameCount`** — Phase 2 D-09 precedent (deliberate; ties animation tempo to gameplay tempo on slow tabs) |

**Deprecated/outdated:** None — the codebase has no historical layers to migrate from. Phase 2 already retired the `dinoImg.src` swap pattern; Phase 3 inherits the new pattern as-is.

## Project Constraints (from CLAUDE.md)

CLAUDE.md is consistent with PROJECT.md and prior CONTEXTs. The relevant directives for Phase 3:

- **Vanilla JS / HTML5 Canvas 2D / plain CSS only.** No package manager, no bundler, no transpiler, no test suite.
- **Browser-only; must run from `file://` and over static HTTP without modification.** No `fetch`, no modules, no CORS surface.
- **Zero runtime dependencies.** No npm, no CDN scripts.
- **Single-file game logic.** All Phase 3 code goes in `dino.js`. No new files.
- **Hitbox compatibility.** Birds must satisfy the `{x, y, width, height}` entity-shape contract (D-01 satisfies this).
- **Iteration loop:** edit → reload browser. **Verification = manual play-testing in a browser.** No automated test framework.
- **GSD Workflow Enforcement:** Plans must enter through `/gsd-execute-phase` (already the active workflow). No direct repo edits outside GSD commands.

## Runtime State Inventory

> Phase 3 is a feature addition (greenfield bird obstacles), not a rename / refactor / migration. Skipping per the researcher protocol — no runtime state needs auditing.

The CONTEXT.md does require **`birdArray = []` reset on game restart** (D-17), but that is in-memory-array state managed by `resetGame()` at runtime, not stored data, OS-registered state, secrets, or build artifacts. The reset is captured in the plans as a single line in `resetGame()`.

## Environment Availability

Phase 3 has no external tool dependencies beyond what already runs the game.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Modern browser with HTML5 Canvas 2D | All gameplay | ✓ (assumed; existing requirement) | Any current Chrome/Firefox/Safari | — |
| `requestAnimationFrame` | `update()` loop | ✓ (existing) | Native browser API | — |
| `setInterval` | `placeBird` spawner | ✓ (existing) | Native browser API | — |
| `Image()` constructor | Bird sprite preloads | ✓ (existing) | Native browser API | — |
| `img/bird1.png` | BIRD-02 flap frame 1 | ✓ `[VERIFIED: file img/bird1.png 97×68 RGBA]` | — | — |
| `img/bird2.png` | BIRD-02 flap frame 2 | ✓ `[VERIFIED: file img/bird2.png 93×62 RGBA]` | — | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

Skipped — `.planning/config.json` has `workflow.nyquist_validation: false`, so this section is omitted per researcher protocol.

For reference, verification for Phase 3 is manual play-testing in a browser (matches all prior phases). The planner should generate a `HUMAN-UAT.md` per the existing convention (Phase 2 used `02-HUMAN-UAT.md`). The verification matrix should cover:
1. Bird spawns visible on canvas, scrolling left at the same speed as cacti.
2. Bird sprite alternates visibly (flap rate distinct from dino's run cycle).
3. All three heights observable across a few minutes of play (not just one variant).
4. Standing dino dies on low bird; ducking dino survives low bird; jumping dino dies on low bird (jumping doesn't clear).
5. Standing dino dies on mid bird; ducking dino dies on mid bird; jumping dino survives mid bird.
6. Standing dino survives high bird; ducking dino survives high bird; jumping dino dies on high bird.
7. Bird collision triggers dead-sprite + frozen scroll + frozen score.
8. Pressing any key after bird-collision game-over restarts; `birdArray` is empty (no leftover birds visible).

## Security Domain

`security_enforcement` is implicitly enabled (no explicit `false` in config). Phase 3 has effectively zero attack surface.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth — single-player browser game |
| V3 Session Management | no | No sessions — no server, no localStorage |
| V4 Access Control | no | No access control — no users, no roles |
| V5 Input Validation | no | Only input is `keydown`/`keyup` on a keyboard, comparing `e.code` against literals; no parsing, no injection surface |
| V6 Cryptography | no | No crypto |

### Known Threat Patterns for vanilla-JS / Canvas 2D / no backend

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via score render | Tampering | N/A — score is `context.fillText(score, ...)` to canvas, not `innerHTML`; canvas does not execute strings |
| Untrusted asset load | Spoofing | Assets are local files (`./img/bird1.png`); served from same origin as the page |
| Local-storage tampering | Tampering | N/A — no localStorage in v1.0 (HISCORE-01 deferred to v2) |
| Network attacks | Multiple | N/A — game has no network calls |

`[CITED: CONCERNS.md §"Security"]` confirms: "Surface is essentially zero. No network calls, no user input besides keyboard, no `eval`, no `innerHTML`, no DOM injection paths, no third-party scripts, no cookies, no storage. Nothing to attack."

Phase 3 introduces no new attack surface.

## Assumptions Log

> All claims in this research were verified against the codebase, the assets, or simulated physics. No `[ASSUMED]` claims; the table is empty.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | — | — | — |

**Empty table:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Probability-band proportions in `placeBird()`**
   - What we know: D-03 recommends 30 % low / 25 % mid / 25 % high / 20 % empty. Within Claude's Discretion per CONTEXT.md.
   - What's unclear: Whether 20 % empty band is enough mitigation against unwinnable cactus + low-bird stacks (~3 % of frames per density math above).
   - Recommendation: Implement at the recommended split; if play-testing reveals unfair stacks, the planner can widen the empty band to 30 % without further discussion. Note this in the plan's "tunables" section.

2. **Initial `bird.img` value at spawn time**
   - What we know: Per the draw loop (D-12), the sprite is re-picked every frame from `frameCount`. The bird object's stored `img` field is overwritten before draw.
   - What's unclear: Should `bird.img` be set at spawn time (e.g., `bird1Img`) for future-proofing, or left as `null`?
   - Recommendation: Set `bird.img = bird1Img` at spawn time. Costs nothing; satisfies the entity-shape convention (other entities all have `.img` set at construction); keeps `birdArray` items uniformly shaped if any future debugging code prints the array. The draw loop ignores `bird.img` and uses the per-frame picker, so this has no effect on rendering.

3. **Comment text for the apex collision rationale**
   - What we know: CONTEXT.md D-06 quotes "dino.y ≈ 31, occupies y in [31, 125] at apex" — actual values are 36 and [36, 130].
   - What's unclear: Whether the planner should include the math in inline code comments, or leave it as a note in the plan.
   - Recommendation: Use simple, accurate inline comments per CONVENTIONS.md style: `let birdLowY = 110; //must-duck height — bird y∈[110,178], misses ducking dino at 190+`. Avoid quoting the apex y at all; it's not load-bearing for the comment's purpose (which is to explain *why* the constant is 110).

## Sources

### Primary (HIGH confidence)
- `/Users/benglasser/git/chrome-dinosaur-game/dino.js` (current Phase 2 state, 265 lines) — read in full
- `/Users/benglasser/git/chrome-dinosaur-game/.planning/phases/03-bird-obstacles/03-CONTEXT.md` — locked decisions D-01..D-20
- `/Users/benglasser/git/chrome-dinosaur-game/.planning/phases/02-dino-animation-state-machine/02-CONTEXT.md` — Phase 2 D-09 frameCount, D-14 duck dims, D-19 reset list
- `/Users/benglasser/git/chrome-dinosaur-game/.planning/phases/01-scrolling-track-restart/01-CONTEXT.md` — Phase 1 D-12 reset list, D-13 self-perpetuating loop
- `/Users/benglasser/git/chrome-dinosaur-game/.planning/REQUIREMENTS.md` — BIRD-01..BIRD-04 statements
- `/Users/benglasser/git/chrome-dinosaur-game/.planning/ROADMAP.md` — phase 3 success criteria
- `/Users/benglasser/git/chrome-dinosaur-game/.planning/PROJECT.md` — Core Value, Constraints
- `/Users/benglasser/git/chrome-dinosaur-game/.planning/codebase/ARCHITECTURE.md` — entity-shape contract, self-perpetuating loops
- `/Users/benglasser/git/chrome-dinosaur-game/.planning/codebase/CONCERNS.md` — latent bugs (cactus shift), fragile areas (apex math)
- `/Users/benglasser/git/chrome-dinosaur-game/.planning/codebase/CONVENTIONS.md` — let-everywhere, probability bands, inline magic-number comments
- `/Users/benglasser/git/chrome-dinosaur-game/CLAUDE.md` — project instructions
- `file img/bird1.png img/bird2.png` shell command — verified asset dimensions byte-for-byte

### Secondary (MEDIUM confidence)
- Frame-by-frame physics simulation via Node.js — verified jump apex y = 36 (not 31), confirmed all three bird-height collision verdicts hold
- Obstacle density math — verified ~1.03 obstacles/sec combined arrival rate, ~3 % unwinnable-cluster frame rate as upper bound
- Backgrounded-tab `setInterval` throttling research — confirmed 1500 ms cadence is above the 1000 ms throttle threshold and is unaffected by tab visibility (RAF pauses, but the spawner does not throttle further)

### Tertiary (LOW confidence)
- None — no claim in this research relies on a single unverified source.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — there is no library stack; vanilla-JS + Canvas 2D is locked by every prior phase
- Architecture: HIGH — every integration point is a near-identical analogue of an existing block (cactus loop, sprite preload, reset list)
- Pitfalls: HIGH — the apex-y discrepancy was caught by frame-by-frame physics simulation; the unwinnable-cluster rate was caught by density math; both are reproducible
- Asset verification: HIGH — `file` command on the PNGs returned exact dimensions matching CONTEXT.md D-08

**Research date:** 2026-05-05
**Valid until:** Indefinitely for the locked decisions; the codebase moves slowly and the assets are immutable. No external dependencies whose versions could drift. Re-verification only needed if `velocityX`, `gravity`, or `velocityY` jump impulse change in a future phase (none planned in v1.0).
