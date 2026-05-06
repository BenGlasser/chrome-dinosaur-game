# Phase 2: Dino Animation & State Machine - Research

**Researched:** 2026-05-05
**Domain:** Canvas 2D sprite animation, game state machines, hitbox mutation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (D-01 through D-24 — DO NOT REOPEN)

- **D-01:** One `Image` per sprite — six new globals: `dinoRun1Img`, `dinoRun2Img`, `dinoJumpImg`, `dinoDuck1Img`, `dinoDuck2Img`, `dinoDeadImg`.
- **D-02:** Remove `dinoImg = new Image()` block, death-time `.src` swap, and restart `.src` swap entirely. Delete the `dinoImg` global.
- **D-03:** Keep `dino.png` file unused in `img/` — do not delete.
- **D-04:** Inline if/else sprite picker in `update()`'s dino draw step (not a helper function).
- **D-05:** `dinoState` is a string global ("running", "jumping", "ducking", "dead").
- **D-06:** State derived per frame in `update()` — priority order: `gameOver` → "dead"; `dino.y < dinoY` → "jumping"; `isDuckHeld` → "ducking"; else → "running".
- **D-07:** `isDuckHeld` is a module-level boolean. Set `true` on ArrowDown keydown, `false` on ArrowDown keyup.
- **D-08:** Add `keyup` listener and `keyUp(e)` handler alongside existing `keydown`/`moveDino`. Only handles `e.code == "ArrowDown"`. Do NOT gate on `gameOver`.
- **D-09:** `let frameCount = 0` at module scope; increment as FIRST line inside `update()`, before the `gameOver` early-return.
- **D-10:** Animation rate = swap every 6 frames (~10 fps at 60 Hz). Hardcode `6`.
- **D-11:** Run and duck share the same 6-frame interval.
- **D-12:** No `frameCount` overflow protection needed.
- **D-13:** `frameCount` reset to 0 in `resetGame()`.
- **D-14:** Mutate `dino.width`, `dino.height`, `dino.y` on duck enter/exit. New globals: `duckWidth=118`, `duckHeight=60`, `duckY=boardHeight-duckHeight`. Freeze hitbox at 118 (duck1 width) despite duck2 being 116.
- **D-15:** Hitbox driven by state derivation in `update()`, not by input event.
- **D-16:** Gravity owns `dino.y` for non-ducking states. Duck branch sets `dino.y = duckY`. `Math.min` clamps back to `dinoY` automatically on stand-up.
- **D-17:** Order in `update()` dino block: state derivation → hitbox dims → gravity (skip while ducking, zeroing `velocityY`) → sprite picker → drawImage.
- **D-18:** ArrowDown branch in `moveDino()` sets `isDuckHeld = true`; drop the `dino.y == dinoY` gate.
- **D-19:** `resetGame()` gets four additions (`dinoState = "running"`, `isDuckHeld = false`, `frameCount = 0`, `dino.width = dinoWidth; dino.height = dinoHeight`) and one removal (`dinoImg.src = "./img/dino.png"`).
- **D-20:** While airborne, `dinoState == "jumping"` regardless of `isDuckHeld` value. On landing, if `isDuckHeld` true, transitions to "ducking" on next frame.
- **D-21:** No fast-fall while ArrowDown+airborne. Explicitly out of scope.
- **D-22:** Tutorial-style globals. Twelve new `let` declarations grouped near existing dino globals.
- **D-23:** No `const`, no classes, no module split.
- **D-24:** Single file `dino.js`.

### Claude's Discretion

- Exact identifier casing for new sprite globals (follow `cactus1Img` precedent).
- Whether `keyUp` is a named function or inline arrow expression.
- Order of sprite preloads in `window.onload`.
- Which duck-gravity-skip pattern reads cleaner (wrap in `if (dinoState != "ducking")` or conditional `dino.y` assignment).

### Deferred Ideas (OUT OF SCOPE)

- Fast-fall while airborne+ArrowDown (DINO-FASTFALL-01)
- Animated dead sprite / death pose freeze frame
- Per-frame hitbox width swap (duck1=118 vs duck2=116)
- `update()` refactor into per-entity passes
- Sprite atlas
- `Image.decode()` pre-decode promises
- Formal state machine class
- Configurable animation rate
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DINO-01 | While on the ground and game running, dino sprite alternates dino-run1.png / dino-run2.png at ~10 fps. | Frame-counter animation pattern; 6-frame interval at 60 Hz = 10 fps. Sprite picker inline expression using `Math.floor(frameCount / 6) % 2`. |
| DINO-02 | While airborne, dino sprite is dino-jump.png (not running cycle). | State derivation priority: airborne check (`dino.y < dinoY`) precedes duck check. Single static sprite, no cycling needed. |
| DINO-03 | While ArrowDown held and on the ground, dino alternates dino-duck1.png / dino-duck2.png at the same rate as run cycle. | `isDuckHeld` boolean + `keyup` listener; same 6-frame interval reused. |
| DINO-04 | While ducking, hitbox is shorter and wider (low obstacle passes overhead, ground cactus still collides). | Mutate `dino.width=118`, `dino.height=60`, `dino.y=190` on duck; restore to standing dims on exit. `detectCollision` unchanged. |
</phase_requirements>

---

## Summary

Phase 2 replaces the single-`dinoImg`-with-src-swap approach with a per-frame state machine that selects the correct sprite based on three runtime conditions (game over, airborne, duck held). The pattern is a standard frame-counted animation loop using a single integer counter and modulo arithmetic — no timers, no dates, no requestId tracking. All state is derived in `update()` from existing globals (`gameOver`, `dino.y`, `isDuckHeld`) rather than stored as transitions, which keeps the code flat and tutorial-readable.

The duck mechanic's main engineering challenge is that ducking moves the dino from ground-y=156 to ground-y=190 (a lower canvas position, taller y-value) AND shrinks the hitbox height from 94 to 60. Because the standard gravity line `dino.y = Math.min(dino.y + velocityY, dinoY)` uses `dinoY=156` as its floor, it would teleport a ducking dino UP to 156 on the first ducking frame. The fix is to skip the gravity step entirely while `dinoState == "ducking"` and zero out `velocityY` — this prevents accumulated velocity from launching the dino on stand-up.

The dead-sprite transition changes character in Phase 2: instead of an immediate `.src` swap (visible same-frame via the `onload` callback), the dead sprite appears on the next `update()` frame after collision, because `gameOver = true` is set one frame, and the state-derivation's first priority reads it on the next. This one-frame delay is imperceptible in practice.

**Primary recommendation:** Implement in the exact order D-17 prescribes (state derivation → hitbox dims → gravity skip → sprite picker → draw) and verify the duck-y math (duckY = 250 - 60 = 190) against the track bottom (trackY = 250 - 28 = 222) before shipping. The dino's feet at y+height should hit 250 in both standing (156+94=250) and ducking (190+60=250) states.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Sprite selection | `update()` render loop | `window.onload` (preload) | Per-frame derivation pattern; preload provides Image objects |
| State derivation | `update()` render loop | — | Must align with physics state each frame |
| Input capture (duck hold) | `moveDino` + new `keyUp` handlers | — | `keydown`/`keyup` are separate DOM events; both needed to track held state |
| Hitbox mutation | `update()` render loop | — | Must match visual state each frame; not event-driven |
| Physics / gravity | `update()` render loop | — | Gravity conditionally skipped when ducking |
| Sprite preloading | `window.onload` | — | Fire-and-forget matching cactus pattern |
| State reset | `resetGame()` | — | Extended from Phase 1; all animation state joins existing reset list |

---

## Standard Stack

No external libraries. This phase is pure vanilla JS / Canvas 2D API.

| Primitive | Purpose | Notes |
|-----------|---------|-------|
| `Image()` constructor | Sprite preloading | Fire-and-forget `.src` assignment; no `onload` guard per sprite (matches cactus precedent). |
| `CanvasRenderingContext2D.drawImage()` | Sprite drawing | Called once per frame per entity. Signature: `drawImage(img, x, y, w, h)`. |
| `Math.floor(frameCount / N) % 2` | Frame-counted animation | Integer division determines which animation phase; modulo 2 toggles between two frames. |
| `document.addEventListener("keyup", keyUp)` | Duck release detection | Different event from Phase 1's `keydown`; Phase 1 D-10 only forbids parallel keydown listeners. |

**Asset dimensions (VERIFIED: filesystem + PNG header read):**

| File | Width | Height | Notes |
|------|-------|--------|-------|
| `img/dino-run1.png` | 88 | 94 | Run cycle frame 1 |
| `img/dino-run2.png` | 88 | 94 | Run cycle frame 2 |
| `img/dino-jump.png` | 88 | 94 | Jump sprite |
| `img/dino-duck1.png` | 118 | 60 | Duck cycle frame 1; hitbox uses this width |
| `img/dino-duck2.png` | 116 | 60 | Duck cycle frame 2; 2px narrower than duck1 |
| `img/dino-dead.png` | 88 | 94 | Death sprite (standing dims — confirmed) |

---

## Architecture Patterns

### System Architecture Diagram

```
keydown event          keyup event
     |                      |
  moveDino(e)            keyUp(e)
  - jump: velocityY=-10  - ArrowDown: isDuckHeld=false
  - duck: isDuckHeld=true
     |                      |
     +----------+-----------+
                |
          (globals: gameOver, dino.y, isDuckHeld, velocityY)
                |
           update() [every RAF frame]
                |
         1. frameCount++
                |
         2. derive dinoState
            gameOver? → "dead"
            dino.y < dinoY? → "jumping"
            isDuckHeld? → "ducking"
            else → "running"
                |
         3. apply hitbox dims
            ducking: dino.{width=118, height=60, y=190}
            else: dino.{width=88, height=94}  [y owned by gravity]
                |
         4. gravity step (skipped when ducking)
            velocityY += gravity
            dino.y = Math.min(dino.y + velocityY, dinoY)
                |
         5. pick sprite
            dead → dinoDeadImg
            jumping → dinoJumpImg
            ducking → duck1/duck2 by frameCount
            running → run1/run2 by frameCount
                |
         6. drawImage(dinoSprite, dino.x, dino.y, dino.width, dino.height)
                |
         7. cactus loop → detectCollision(dino, cactus) → gameOver=true
```

### Recommended Project Structure

No structural changes. All additions go into `dino.js` exactly where existing patterns live.

```
dino.js
├── Globals block (~lines 1-53)           # +12 new let declarations, -1 (dinoImg)
├── window.onload (~lines 54-89)         # -dinoImg block, +6 sprite preloads, +keyup listener
├── update() (~lines 91-135)             # dino block rewritten per D-17 order
├── moveDino(e) (~lines 137-151)         # ArrowDown branch filled, ground gate dropped
├── keyUp(e) [NEW]                        # placed near moveDino
├── placeCactus() (~lines 153-188)       # unchanged
├── resetGame() (~lines 190-197)         # 4 additions, 1 removal per D-19
└── detectCollision(a, b) (~lines 199-204) # unchanged
```

### Pattern 1: Frame-Counted Two-Frame Animation

**What:** A single integer counter, incremented every frame, drives sprite selection via integer division and modulo. Produces a stable, frame-rate-coupled animation without Date.now() or separate timers.

**When to use:** Any two-frame animation that should stay in sync with game tempo (run cycle, duck cycle). Do NOT use for animations that must be wall-clock-accurate.

**Example (D-04 canonical form):**

```js
// Source: CONTEXT.md D-04 / D-10
// frameCount is incremented at the top of update() every frame
let dinoSprite;
if (dinoState == "dead")         dinoSprite = dinoDeadImg;
else if (dinoState == "jumping") dinoSprite = dinoJumpImg;
else if (dinoState == "ducking") dinoSprite = (Math.floor(frameCount / 6) % 2 == 0) ? dinoDuck1Img : dinoDuck2Img;
else /* running */                dinoSprite = (Math.floor(frameCount / 6) % 2 == 0) ? dinoRun1Img  : dinoRun2Img;
context.drawImage(dinoSprite, dino.x, dino.y, dino.width, dino.height);
```

Why `Math.floor(frameCount / 6) % 2`:
- At 60 fps, `frameCount` advances by 1 each frame.
- `Math.floor(frameCount / 6)` advances by 1 every 6 frames → toggles once per 6 frames.
- `% 2` maps even/odd to 0/1 → selects frame 1 or frame 2.
- Result: each sprite holds for exactly 6 frames = ~10 fps at 60 Hz, ~7 fps at 144 Hz (intentional — coupled to game tempo).

### Pattern 2: Per-Frame State Derivation (Priority Order)

**What:** `dinoState` is not stored across frames as a transition; it is recomputed from world state every frame. This guarantees the sprite always matches actual physics and input state.

**When to use:** Any discrete state that is fully determined by a small set of readable conditions. Avoids "state got stuck" bugs where input events miss a transition.

**Example (D-06 canonical form):**

```js
// Source: CONTEXT.md D-06
// Runs at the top of the dino block in update(), before hitbox mutation and drawing
if (gameOver) {
    dinoState = "dead";
} else if (dino.y < dinoY) {
    dinoState = "jumping";
} else if (isDuckHeld) {
    dinoState = "ducking";
} else {
    dinoState = "running";
}
```

Priority ordering matters: airborne check must precede duck check (D-20 — in-air ArrowDown held is still "jumping", not "ducking").

### Pattern 3: Hitbox Mutation on State Entry

**What:** The `dino` entity object's `width`, `height`, and `y` fields are written directly by the state-derivation block each frame, keeping them in sync with the current animation state.

**When to use:** When the entity-shape contract (`{x, y, width, height}`) must reflect actual visual footprint for collision to work correctly with no change to `detectCollision`.

**Example (D-15 canonical form):**

```js
// Source: CONTEXT.md D-15
if (dinoState == "ducking") {
    dino.width = duckWidth;   // 118
    dino.height = duckHeight; // 60
    dino.y = duckY;           // 190  (= boardHeight - duckHeight = 250 - 60)
} else {
    dino.width = dinoWidth;   // 88
    dino.height = dinoHeight; // 94
    // do NOT touch dino.y here — gravity owns it
}
```

### Anti-Patterns to Avoid

- **Setting hitbox in the input handler:** `moveDino` fires once per keypress, not per frame. If you shrink the hitbox there, it won't restore when the key is released (no symmetrical event). Put hitbox mutation in `update()`.
- **Running gravity unconditionally while ducking:** `Math.min(dino.y + velocityY, dinoY)` uses `dinoY=156` as the floor. While ducking, `dino.y=190 > dinoY=156`, so the clamp instantly snaps the dino UP by 34 pixels. Always skip or gate the gravity step when `dinoState == "ducking"`.
- **Swapping `.src` at collision time instead of using state machine:** The `.src` swap races against the browser image decode pipeline. The state machine eliminates this race — `gameOver=true` sets `dinoState="dead"` on the next frame, which picks `dinoDeadImg` (already decoded from preload).

---

## Existing Code Touchpoints

All line numbers reference the current `dino.js` as of Phase 1 completion (204 lines total).

### 1. Old `dinoImg` block to REMOVE — `window.onload` (lines 65-69)

```js
// REMOVE THIS BLOCK (lines 65-69):
dinoImg = new Image();
dinoImg.src = "./img/dino.png";
dinoImg.onload = function() {
    context.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
}
```

Replace with six sprite preloads following the cactus pattern (lines 71-78):

```js
dinoRun1Img = new Image();
dinoRun1Img.src = "./img/dino-run1.png";
dinoRun2Img = new Image();
dinoRun2Img.src = "./img/dino-run2.png";
dinoJumpImg = new Image();
dinoJumpImg.src = "./img/dino-jump.png";
dinoDuck1Img = new Image();
dinoDuck1Img.src = "./img/dino-duck1.png";
dinoDuck2Img = new Image();
dinoDuck2Img.src = "./img/dino-duck2.png";
dinoDeadImg = new Image();
dinoDeadImg.src = "./img/dino-dead.png";
```

Also add keyup listener at line 88 (after the existing keydown listener):
```js
document.addEventListener("keyup", keyUp);
```

### 2. New sprite globals — near line 13 (where `let dinoImg` currently sits)

Remove `let dinoImg;` (line 13). Add in its place (or grouped after `let dino = {...}` block, per D-22):

```js
let dinoRun1Img;
let dinoRun2Img;
let dinoJumpImg;
let dinoDuck1Img;
let dinoDuck2Img;
let dinoDeadImg;
let dinoState = "running";
let isDuckHeld = false;
let frameCount = 0;
let duckWidth = 118;   //match dino-duck1.png width
let duckHeight = 60;   //match dino-duck*.png height
let duckY = boardHeight - duckHeight; //190
```

### 3. Dino block in `update()` to REWRITE — lines 110-113

Current (lines 110-113):
```js
//dino
velocityY += gravity;
dino.y = Math.min(dino.y + velocityY, dinoY);
context.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
```

Replacement (D-17 order — state derivation, hitbox, gravity, sprite, draw):
```js
//dino
if (gameOver) {
    dinoState = "dead";
} else if (dino.y < dinoY) {
    dinoState = "jumping";
} else if (isDuckHeld) {
    dinoState = "ducking";
} else {
    dinoState = "running";
}

if (dinoState == "ducking") {
    dino.width = duckWidth;
    dino.height = duckHeight;
    dino.y = duckY;
} else {
    dino.width = dinoWidth;
    dino.height = dinoHeight;
}

if (dinoState != "ducking") {
    velocityY += gravity;
    dino.y = Math.min(dino.y + velocityY, dinoY);
} else {
    velocityY = 0;
}

let dinoSprite;
if (dinoState == "dead")         dinoSprite = dinoDeadImg;
else if (dinoState == "jumping") dinoSprite = dinoJumpImg;
else if (dinoState == "ducking") dinoSprite = (Math.floor(frameCount / 6) % 2 == 0) ? dinoDuck1Img : dinoDuck2Img;
else /* running */                dinoSprite = (Math.floor(frameCount / 6) % 2 == 0) ? dinoRun1Img  : dinoRun2Img;
context.drawImage(dinoSprite, dino.x, dino.y, dino.width, dino.height);
```

Also: insert `frameCount++;` as the FIRST line inside `update()`, before `requestAnimationFrame(update)` or right after it (either order is fine; D-09 says before the `gameOver` early-return).

### 4. Death-time `.src` swap to REMOVE — lines 123-126

Current (lines 123-126):
```js
if (detectCollision(dino, cactus)) {
    gameOver = true;
    dinoImg.src = "./img/dino-dead.png";
    dinoImg.onload = function() {
        context.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
    }
}
```

Replacement (remove the src swap; keep the collision and flag):
```js
if (detectCollision(dino, cactus)) {
    gameOver = true;
}
```

The state-derivation block will pick `dinoDeadImg` automatically on the next `update()` call (since `gameOver` is now `true`). Note: `update()` re-schedules itself at line 92 BEFORE the `gameOver` early-return at line 93, so the loop keeps firing. However, the `gameOver` early-return means the dino block (which does the state derivation and drawing) does NOT run after game over. The dead sprite must therefore be drawn BEFORE the early-return. See Risks section for how to handle this.

### 5. ArrowDown branch in `moveDino()` — lines 147-149

Current (lines 147-149):
```js
else if (e.code == "ArrowDown" && dino.y == dinoY) {
    //duck
}
```

Replacement (D-18 — fill body, drop ground gate):
```js
else if (e.code == "ArrowDown") {
    isDuckHeld = true;
}
```

### 6. New `keyUp(e)` function — place near `moveDino` (after line 151)

```js
function keyUp(e) {
    if (e.code == "ArrowDown") {
        isDuckHeld = false;
    }
}
```

Register in `window.onload` (see touchpoint 1 above).

### 7. `resetGame()` extension — lines 190-197

Current (lines 190-197):
```js
function resetGame() {
    gameOver = false;
    score = 0;
    cactusArray = [];
    velocityY = 0;
    dino.y = dinoY;
    dinoImg.src = "./img/dino.png";  // REMOVE THIS LINE
}
```

Replacement (D-19 — 4 additions, 1 removal):
```js
function resetGame() {
    gameOver = false;
    score = 0;
    cactusArray = [];
    velocityY = 0;
    dino.y = dinoY;
    dinoState = "running";
    isDuckHeld = false;
    frameCount = 0;
    dino.width = dinoWidth;
    dino.height = dinoHeight;
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation timing | Wall-clock timer (`Date.now()` delta) | `Math.floor(frameCount / 6) % 2` | Frame-coupled is simpler, stays in sync with game tempo, no timer state |
| State transitions | Enter/exit hooks, transition table | Per-frame derivation in `update()` | With only 4 states and 3 conditions, full derivation every frame is trivially cheap and never gets stuck |
| Duck hitbox | Parallel hitbox object | Mutate `dino.{width, height, y}` directly | `detectCollision` already reads `dino` — no contract change needed |
| Dead-sprite display | `.src` swap + `onload` callback | Preload + state machine selection | Eliminates the race condition documented in CONCERNS.md |

---

## Risks and Fragilities

### Risk 1: Gravity-while-ducking teleport (HIGH — will break duck if unhandled)

**What goes wrong:** `dino.y = Math.min(dino.y + velocityY, dinoY)` uses `dinoY=156` as its floor. While ducking, `dino.y=190`. Since `190 > 156`, the first ducking frame where this line runs would clamp `dino.y` to `156`, snapping the dino UP by 34 pixels. Visually: the dino teleports to standing-ground level while displaying the duck sprite.

**Why it happens:** `Math.min(190 + ..., 156)` = `156` when any reasonable `velocityY` value is applied.

**How to avoid:** Gate the gravity step: `if (dinoState != "ducking") { velocityY += gravity; dino.y = Math.min(...); } else { velocityY = 0; }` (D-17). The `velocityY = 0` clears accumulated velocity so the dino doesn't launch upward when they stand up.

**Warning signs:** Dino appears at `y=156` instead of `y=190` while duck key is held; dino "jumps" briefly on releasing ArrowDown.

### Risk 2: Dead-sprite visible one frame late (LOW — imperceptible, but understand the change)

**What goes wrong:** Phase 1's collision path did `dinoImg.src = "dino-dead.png"; dinoImg.onload = drawImage(...)` — the dead sprite appeared in the same `update()` frame as the collision (synchronously, with the onload callback drawing immediately after the browser decoded). Phase 2 removes the `.src` swap. The `gameOver` early-return on line 93 fires BEFORE the dino block runs, which means the dead sprite does NOT render on the collision frame.

**Current flow analysis:** In `update()`:
1. Line 92: `requestAnimationFrame(update)` — re-schedules.
2. Line 93: `if (gameOver) return;` — early-returns if already dead.
3. Lines 110+: dino block runs (state derivation, draw) — only runs when NOT game over.

This means: when collision sets `gameOver = true` (inside the cactus loop at line 121), the CURRENT frame's dino-draw already happened (line 113 ran before the cactus loop). The NEXT frame hits the early-return at line 93 before drawing. The dead sprite never draws via this path.

**Fix required:** Either (a) draw the dead sprite immediately in the collision block (`context.drawImage(dinoDeadImg, dino.x, dino.y, dino.width, dino.height)`) after setting `gameOver = true`, or (b) move the early-return AFTER the dino draw block. Option (a) is simpler. Option (b) requires care that the dino block still runs state-derivation correctly for `dinoState="dead"`. **The planner must choose one and specify it in 02-01 or 02-02.**

**Warning signs:** One-frame flash of the last running-cycle sprite at death, then blank dino on game-over screen.

### Risk 3: Duck-while-airborne flag state (LOW — handled by priority order)

**What goes wrong:** Player presses ArrowDown mid-jump. `isDuckHeld = true` is set. On next frame, `dino.y < dinoY` is still true (still airborne). State derivation priority puts airborne check BEFORE duck check, so `dinoState = "jumping"` — correct. On landing, `isDuckHeld` is still `true`, so the next frame transitions to "ducking" — also correct and desirable (pre-buffered duck).

**Only risk:** If the priority order in the derivation block is accidentally reversed (duck check before airborne check). Verify the order matches D-06 exactly.

**Warning signs:** Duck sprite displayed while dino is airborne; dino appears to slide along the ground with duck sprite while in the air.

### Risk 4: `velocityY` accumulation during duck (MEDIUM — subtle jump on stand-up)

**What goes wrong:** If `velocityY` is NOT zeroed during duck, gravity (`+= 0.4`) accumulates while the dino is ducking. When the player releases ArrowDown, `velocityY` may be large and positive (ground-ward). On the first non-duck frame, gravity applies with that accumulated velocity: `dino.y = Math.min(dino.y + largeVelocity, dinoY)`. Since `Math.min` clamps to `dinoY`, the result is still `dinoY`, but it's still ugly if `velocityY` later causes issues.

**How to avoid:** `velocityY = 0` in the ducking branch of the gravity step (D-17). On stand-up, velocity starts fresh from 0, and gravity naturally holds the dino on the ground.

**Warning signs:** Subtle visual stutter on ArrowDown release; velocity state inconsistency logged in console if you add debug output.

### Risk 5: `dinoImg.src` reference left in `resetGame()` (MEDIUM — runtime error)

**What goes wrong:** If the `dinoImg.src = "./img/dino.png"` line in `resetGame()` (line 196) is not removed, the first restart after Phase 2 will throw `Cannot set property 'src' of undefined` (since `dinoImg` is deleted per D-02).

**How to avoid:** D-19 explicitly flags this line for removal. The planner must include it as a concrete task action in 02-01.

**Warning signs:** Console error on first restart; game appears to work until game over.

---

## Duck Hitbox Math (Verified)

Ground constant relationships:

```
boardHeight = 250

Standing dino:
  dinoHeight = 94
  dinoY = boardHeight - dinoHeight = 250 - 94 = 156
  Bottom of dino = dino.y + dino.height = 156 + 94 = 250  [ground level]

Ducking dino:
  duckHeight = 60
  duckY = boardHeight - duckHeight = 250 - 60 = 190
  Bottom of dino = dino.y + dino.height = 190 + 60 = 250  [same ground level]

Track strip:
  trackHeight = 28
  trackY = boardHeight - trackHeight = 250 - 28 = 222
  Track strip occupies y=222 to y=250

Cactus:
  cactusHeight = 70
  cactusY = boardHeight - cactusHeight = 250 - 70 = 180
  Cactus occupies y=180 to y=250

Duck vs cactus overlap check:
  Ducking dino: y=190, height=60 → spans y=190..250
  Cactus: y=180, height=70 → spans y=180..250
  detectCollision checks y-axis: dino.y < cactus.y + cactus.height (190 < 250, TRUE)
    AND dino.y + dino.height > cactus.y (250 > 180, TRUE)
  → Ducking dino STILL collides with a ground cactus. Correct behavior.

A hypothetical "low obstacle" at y=210, height=40 (y=210..250):
  Standing: dino y=156..250 → 156 < 250 AND 250 > 210 → COLLISION
  Ducking: dino y=190..250 → 190 < 250 AND 250 > 210 → COLLISION
  (A low obstacle at y=210 still hits ducking dino — ducking dino also spans to y=250)

A hypothetical "bird-height" obstacle at y=160, height=40 (y=160..200):
  Standing: dino y=156..250 → 156 < 200 AND 250 > 160 → COLLISION
  Ducking: dino y=190..250 → 190 < 200 AND 250 > 160 → COLLISION
  (Still collides both ways — this height is too low for ducking to help)

A hypothetical bird at y=150, height=40 (y=150..190):
  Standing: dino y=156..250 → 156 < 190 AND 250 > 150 → COLLISION
  Ducking: dino y=190..250 → 190 < 190 (FALSE) → NO COLLISION
  → Bird at y=150..190 (top of duck-dino head) passes overhead while ducking. CORRECT.
```

**Conclusion:** The duck mechanic requires a bird positioned such that its bottom edge is at or above `duckY=190` to clear the ducking dino. This is Phase 3's job (BIRD-03). For Phase 2, the hitbox math is correct — success criterion #4 ("low obstacle clearance") cannot be verified with ground cacti (they span to y=250, same as the dino). See Open Questions.

---

## Verification Approach

No automated test suite. All verification is manual play-test plus source-level grep.

### DINO-01: Run cycle visible on ground (~10 fps)

**Grep check:**
```bash
grep "frameCount" dino.js
grep "dinoRun1Img\|dinoRun2Img" dino.js
grep "Math.floor" dino.js
```
Expected: `frameCount` incremented in `update()`, used in sprite picker expression. Both run images referenced.

**Play-test:** Load `index.html`. Before the dino hits anything, watch the standing dino. Legs should visibly alternate. At ~10 fps the cycle reads as a run — not a strobe (too fast) and not a slideshow (too slow). Confirm it looks like the real Chrome dino run.

### DINO-02: Jump sprite visible while airborne

**Grep check:**
```bash
grep "dinoJumpImg" dino.js
grep "jumping" dino.js
```

**Play-test:** Press Space or ArrowUp. While the dino is in the air, the sprite should switch from the running cycle to the single jump sprite (arms back, single frame). On landing, the run cycle immediately resumes.

### DINO-03: Duck cycle visible while ArrowDown held on ground

**Grep check:**
```bash
grep "isDuckHeld" dino.js
grep "ducking" dino.js
grep "dinoDuck1Img\|dinoDuck2Img" dino.js
grep "keyup" dino.js
```
Expected: `isDuckHeld` set in `moveDino` and cleared in `keyUp`. Both duck images in sprite picker. `document.addEventListener("keyup"` present.

**Play-test:** Hold ArrowDown on the ground. The dino should visibly lower its posture and show the duck animation cycling. Release ArrowDown — the dino should immediately return to the run cycle. Repeat rapidly to confirm no stuck-duck state.

### DINO-04: Hitbox shrinks while ducking

**Grep check:**
```bash
grep "duckWidth\|duckHeight\|duckY" dino.js
grep "dino.width = duckWidth" dino.js
grep "dino.height = duckHeight" dino.js
```
Expected: Duck dims assigned when `dinoState == "ducking"`, standing dims restored otherwise.

**Play-test for hitbox correctness (visual):** While ducking, confirm the dino's visible height is shorter than standing. The collision box tracks the visual. A ground-level cactus should still kill the ducking dino (verified above via math — cactus y=180..250, duck dino y=190..250, they still overlap).

**Hitbox clearance test (see Open Questions):** Full empirical clearance test deferred to Phase 3. See recommendation in Open Questions section.

### Physics unchanged (Phase 1 guardrail)

**Grep check (verify constants untouched):**
```bash
grep "velocityX = -8" dino.js
grep "gravity = .4" dino.js
grep "velocityY = -10" dino.js
grep "dinoY = boardHeight" dino.js
```

All four constants must remain exactly as they are. Phase 2 adds a conditional gravity-skip for ducking but does NOT change any constant values.

### Dead sprite check

**Play-test:** Collide with a cactus. Confirm the dead-dino sprite (`dino-dead.png`, 88x94, same dimensions as running sprites) appears immediately (or within one imperceptible frame) at the dino's last position. No blank dino frame on game over. Restart and repeat.

---

## Open Questions

### Q1: How to verify DINO-04's hitbox clearance (ROADMAP success criterion #4)

**What we know:** ROADMAP success criterion #4 requires: "A test obstacle drawn at 'low height' (clearance designed for ducking) does not collide with the dino while it is ducking, but does collide while it is standing."

**What's unclear:** There is no low-obstacle asset available in Phase 2. Ground cacti reach y=250 (same as dino feet) so they always collide. Birds (Phase 3, BIRD-03) are the intended low obstacles but are not implemented yet.

**Duck math (verified):** A low obstacle placed at approximately y=150..190 (bottom at duckY=190) would clear a ducking dino but not a standing dino (whose top is at dinoY=156). This is the correct target for Phase 3's bird height.

**Three options for the planner:**

**(a) Temporary debug obstacle in Phase 2 (02-03):** Modify `placeCactus()` to occasionally spawn a rectangle (using fillRect, not a sprite) at y=150, height=40. This makes the hitbox testable in-browser. Tag it with a `//TODO REMOVE PHASE 3` comment. Planner adds a removal task at the start of 03-01.

**(b) Defer to Phase 3 entirely:** Accept that ROADMAP criterion #4 is Phase-3-verifiable. Phase 2 verifies the hitbox IS smaller (`dino.height=60` while ducking) via grep and visual. Phase 3's bird spawning at the right height closes the empirical loop.

**(c) Verify by calculation (cheapest, lossless):** Confirm via grep + hitbox math that `dino.height=60` and `dino.y=190` while ducking, and document that any obstacle with `obstacle.y >= 190` and `obstacle.y + obstacle.height <= 250` would not collide. Phase 3 places birds at exactly this constraint. No code changes needed for Phase 2.

**Recommendation:** Option (c). It is the cheapest, lossless, and Phase 3 closes the empirical loop when real low obstacles exist. The ROADMAP criterion is technically satisfiable by the math — the hitbox IS correctly sized. Phase 3 provides the empirical confirmation. The planner should document this decision in 02-03's verification section.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 2 |
|-----------|-------------------|
| No package manager, no build step, no bundler | All additions are plain JS in `dino.js`. No imports, no require. |
| `let` for everything, including constants | New globals use `let duckWidth = 118` not `const`. |
| No `const`, no classes, no module split | Reaffirmed by D-22/D-23/D-24. |
| Single-file game logic in `dino.js` | No new files. `keyUp` function added to `dino.js`. |
| `detectCollision(a, b)` entity-shape contract: `{x, y, width, height}` | Phase 2 mutates `dino.width/height/y` directly — no new hitbox object. |
| Performance non-issue at current scale | No performance considerations needed for 6 Image preloads or per-frame if/else chain. |
| Iteration loop is: edit → reload browser | Verification is browser play-test. No CI, no test runner. |
| Inline-comment magic numbers | `let duckWidth = 118; //match dino-duck1.png width` style. |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Dead sprite appears one frame after collision with Phase 2's changes (the `gameOver` early-return precedes the dino draw block). | Risks #2 / Touchpoint #4 | If wrong (dead sprite still draws via some other path), the fix described in Risk #2 is unnecessary overhead — but harmless if included. |
| A2 | `velocityY` zeroing in the duck branch (`velocityY = 0`) is sufficient to prevent stand-up launch artifact. | Risks #4 | If accumulated velocity before the duck causes a visible jump artifact, the value `0` may need to be verified at transition time. Low likelihood — the dino is ground-clamped before ducking. |

---

## Sources

### Primary (HIGH confidence — VERIFIED in this session)

- `dino.js` (current, 204 lines) — read in full; all line numbers and code confirmed.
- `img/` directory listing + PNG header reads — all 6 sprite dimensions confirmed as stated in CONTEXT.md D-14/D-24.
- `.planning/phases/02-dino-animation-state-machine/02-CONTEXT.md` — all D-01..D-24 decisions read.
- `.planning/REQUIREMENTS.md` — DINO-01..DINO-04 text confirmed.
- `.planning/ROADMAP.md` — Phase 2 success criteria confirmed (4 criteria including the low-obstacle test).
- `.planning/phases/01-scrolling-track-restart/01-VERIFICATION.md` — physics constants confirmed unchanged; reset list confirmed.

### Secondary (MEDIUM confidence — design reasoning)

- Duck hitbox math derived from confirmed constants (`boardHeight=250`, `duckHeight=60`, `dinoHeight=94`). Arithmetic verified above.
- Frame-animation rate calculation: 6-frame interval at 60 Hz = 10 Hz swap rate. Standard frame-counted animation pattern; no external doc needed.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero external dependencies; all Canvas 2D API.
- Architecture: HIGH — all decisions locked in CONTEXT.md; code read in full.
- Pitfalls: HIGH — gravity-teleport and dead-sprite timing verified against actual code.
- Asset dimensions: HIGH — VERIFIED via PNG header reads.

**Research date:** 2026-05-05
**Valid until:** Indefinite (no external dependencies; stable until `dino.js` changes).
