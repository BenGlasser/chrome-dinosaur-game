---
phase: 03-bird-obstacles
verified: 2026-05-05T00:00:00Z
status: human_needed
score: 9/9 must-haves verified
overrides_applied: 0
gaps: []
human_verification:
  - test: "Birds visibly appear within ~10 seconds of play and scroll left at the same horizontal speed as cacti."
    expected: "Bird sprites materialize from the right edge and traverse the canvas left in lockstep with cactus scroll speed — no visual lead or lag."
    why_human: "Horizontal speed matching cannot be verified by grep; requires real-time visual inspection of simultaneous bird and cactus motion."
  - test: "Birds visibly flap — alternating sprite is observable — and the flap rate is noticeably slower than the dino's run/duck animation."
    expected: "Wing alternation is visible but slower than the leg cycle; qualitative '~5 fps vs ~10 fps' distinction reads as a separate species of motion."
    why_human: "Frame rate perception is subjective; the code uses divisor 12 vs 6 which is mathematically correct, but whether it 'reads as flapping' needs eyes on it."
  - test: "Low bird (y=110): standing dino dies on contact; ducking dino survives."
    expected: "Hold no key → dead sprite + scroll halt. Hold ArrowDown → bird passes over, game continues."
    why_human: "AABB math confirms clearance (duck dino [190,250] vs bird [110,178]: 178 < 190, no overlap), but live collision feel requires browser play-test."
  - test: "Mid bird (y=156): standing dino dies; ducking dino also dies; jumping dino survives."
    expected: "No key → dead. ArrowDown → also dead. Space/ArrowUp while grounded → safe."
    why_human: "Requires interactive verification of all three dino-state interactions against mid-height bird."
  - test: "High bird (y=50): standing dino survives; ducking dino survives; jumping dino dies."
    expected: "Standing or ducking → bird passes above harmlessly. Jump → dead."
    why_human: "The 'punishes reflexive jumping' behavior is the most critical player-feel check for BIRD-03; requires intentional jump-into-bird test."
  - test: "Bird collision triggers identical game-over behavior to cactus collision (dead sprite, scroll halts, score freezes)."
    expected: "On bird contact: dinoDeadImg paints same-frame, subsequent frames early-return, scrolling stops, score number freezes."
    why_human: "Behavioral identity with cactus path ('indistinguishable') is a qualitative feel check beyond what grep can confirm."
  - test: "Any-key restart after a bird-induced game-over clears birdArray — no leftover bird sprites visible after restart."
    expected: "Press any key after bird death → score 0, running dino, no ghost birds, clean canvas, new spawning resumes."
    why_human: "Requires observing the visual state of the canvas immediately after restart; specifically that no stale birds remain at their frozen positions."
---

# Phase 3: Bird Obstacles Verification Report

**Phase Goal:** Birds spawn periodically alongside cacti at multiple heights, flap their wings via 2-frame animation, scroll left at game speed, and trigger the same game-over path as cacti on collision. At least one bird height demands the duck mechanic from Phase 2.
**Verified:** 2026-05-05T00:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                         | Status     | Evidence                                                                                           |
|----|-----------------------------------------------------------------------------------------------|------------|----------------------------------------------------------------------------------------------------|
| 1  | Birds spawn from the right edge periodically during play (not every tick, not never)          | ✓ VERIFIED | `placeBird()` at line 282 with `setInterval(placeBird, 1500)` at line 127; 20% empty band via `placeBirdChance > .80` |
| 2  | Birds scroll left at the same speed as cacti                                                  | ✓ VERIFIED | `bird.x += velocityX` at line 204 — reuses the same `velocityX = -8` global as the cactus loop (line 191) |
| 3  | Birds spawn at three distinct heights (birdLowY=110, birdMidY=156, birdHighY=50)             | ✓ VERIFIED | Lines 56-58 declare the three height constants; lines 302-312 assign each height in probability branches |
| 4  | Low bird (y=110) requires ducking — cannot be cleared by jumping or standing                  | ✓ VERIFIED | AABB math: standing dino [156,250] vs bird [110,178] → overlap; duck dino [190,250] vs bird [110,178] → 178<190, no overlap; jump apex [31,125] vs bird [110,178] → overlap |
| 5  | Mid bird (y=156) requires jumping — cannot be cleared by ducking                              | ✓ VERIFIED | AABB math: duck dino [190,250] vs bird [156,224] → overlap at [190,224]; jump apex [31,125] vs bird [156,224] → 125<156, no overlap |
| 6  | High bird (y=50) punishes reflexive jumping — standing/ducking safe, jumping kills             | ✓ VERIFIED | AABB math: standing [156,250] vs bird [50,118] → 118<156, no overlap; jump apex [31,125] vs bird [50,118] → overlap at [50,118] |
| 7  | Each bird visibly flaps via `bird1.png`/`bird2.png` alternation at half the dino's cycle rate | ✓ VERIFIED | `let birdSprite = (Math.floor(frameCount / 12) % 2 == 0) ? bird1Img : bird2Img` at line 206 — divisor 12 vs dino's divisor 6 (line 184) |
| 8  | Bird collision triggers the same game-over path as cactus collision                           | ✓ VERIFIED | Lines 209-213: `detectCollision(dino, bird)` → `gameOver = true` + same-frame `context.drawImage(dinoDeadImg, ...)` — verbatim mirror of cactus branch (lines 194-198) |
| 9  | Pressing any key after a bird-induced game-over restarts cleanly — birdArray cleared          | ✓ VERIFIED | `resetGame()` at line 319 contains `birdArray = [];` at line 323, immediately after `cactusArray = [];` at line 322 |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact                    | Expected                                          | Status     | Details                                                    |
|-----------------------------|---------------------------------------------------|------------|------------------------------------------------------------|
| `dino.js` — `//bird` globals block | `birdArray`, `birdWidth/Height`, height constants, `bird1Img`/`bird2Img` | ✓ VERIFIED | Lines 50-61; all 8 declarations present with correct values and locked inline comments |
| `dino.js` — `placeBird()` function | Probability-band height picker with gameOver guard | ✓ VERIFIED | Lines 282-317; gameOver guard at line 283, three push branches at lines 303/307/311, length-cap at line 314 |
| `dino.js` — `setInterval(placeBird, 1500)` in `window.onload` | Spawn timer registered | ✓ VERIFIED | Line 127, positioned after `setInterval(placeCactus, 1000)` at line 126 |
| `dino.js` — bird preloads in `window.onload` | `bird1Img`/`bird2Img` fire-and-forget | ✓ VERIFIED | Lines 113-117; `new Image()` + `.src` assignments present |
| `dino.js` — flap picker in bird loop | `Math.floor(frameCount / 12) % 2` expression | ✓ VERIFIED | Line 206; divisor is 12 (not 6), `==` comparison, ternary style, `birdSprite` local |
| `dino.js` — bird collision branch in bird loop | `detectCollision(dino, bird)` + same-frame dead paint | ✓ VERIFIED | Lines 209-213; mirrors cactus branch verbatim including the inline comment |
| `dino.js` — `birdArray = []` in `resetGame()` | Single line adjacent to `cactusArray = []` | ✓ VERIFIED | Line 323, immediately after line 322 `cactusArray = []` |
| `img/bird1.png` | Flap frame 1 asset, 97×68 | ✓ VERIFIED | File exists at `img/bird1.png` |
| `img/bird2.png` | Flap frame 2 asset, 93×62 | ✓ VERIFIED | File exists at `img/bird2.png` |

### Key Link Verification

| From                          | To                              | Via                                    | Status     | Details                                       |
|-------------------------------|---------------------------------|----------------------------------------|------------|-----------------------------------------------|
| `window.onload`               | `placeBird()`                   | `setInterval(placeBird, 1500)` line 127 | ✓ WIRED    | Timer registered, function defined at line 282 |
| `placeBird()`                 | `birdArray`                     | `birdArray.push(bird)` — 3 branches    | ✓ WIRED    | Lines 303, 307, 311 — all three height branches push |
| `update()` bird loop          | `velocityX` global              | `bird.x += velocityX` line 204         | ✓ WIRED    | Shared scroll constant, no parallel birdVelocityX |
| `update()` bird loop          | `frameCount` global             | `Math.floor(frameCount / 12) % 2` line 206 | ✓ WIRED | Reuses Phase 2 counter, no new global |
| `update()` bird loop          | `detectCollision(a, b)`         | `detectCollision(dino, bird)` line 209 | ✓ WIRED    | AABB function at line 333 called unchanged |
| `update()` bird collision branch | `gameOver` flag + `dinoDeadImg` | `gameOver = true; context.drawImage(dinoDeadImg, ...)` lines 210-212 | ✓ WIRED | Same-frame dead paint confirmed; 2 occurrences of `gameOver = true;` and 2 of `context.drawImage(dinoDeadImg, ...)` |
| `resetGame()`                 | `birdArray`                     | `birdArray = [];` line 323             | ✓ WIRED    | Adjacent to `cactusArray = []` — reset cluster intact |

### Data-Flow Trace (Level 4)

| Artifact         | Data Variable | Source                           | Produces Real Data | Status      |
|------------------|---------------|----------------------------------|--------------------|-------------|
| Bird draw loop   | `birdSprite`  | `Math.floor(frameCount / 12) % 2` → `bird1Img` / `bird2Img` | Yes — preloaded images, counter increments per RAF tick | ✓ FLOWING |
| Bird collision   | `bird` (entity) | `birdArray[i]` populated by `placeBird()` via `setInterval` | Yes — live entity from spawn system | ✓ FLOWING |
| Dino hitbox in collision | `dino.width/height/y` | Derived per frame in state machine (lines 163-179) | Yes — duck hitbox (118×60, y=190) applied live when `isDuckHeld=true` | ✓ FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED for browser-rendered canvas game — no CLI entry points, no API endpoints. All behavioral verification routes to Human Verification Required section below.

### Requirements Coverage

| Requirement | Source Plan | Description                                                                      | Status     | Evidence                                                                                  |
|-------------|-------------|----------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------|
| BIRD-01     | 03-01       | Birds spawn periodically alongside cacti and scroll left at game speed           | ✓ SATISFIED | `setInterval(placeBird, 1500)` independent of `setInterval(placeCactus, 1000)`; `bird.x += velocityX` same constant as cacti |
| BIRD-02     | 03-02       | Each spawned bird animates with alternating `bird1.png`/`bird2.png` at distinct flap rate | ✓ SATISFIED | `Math.floor(frameCount / 12) % 2` divisor 12 vs dino's divisor 6 — half rate locked by D-10 |
| BIRD-03     | 03-01, 03-02 | Birds spawn at multiple discrete heights; low requires duck, high requires jump-or-stand | ✓ SATISFIED (code) / ? HUMAN (behavioral) | Three height constants verified; AABB math confirms all six collision/clearance verdicts; browser play-test needed to confirm feel |
| BIRD-04     | 03-02       | Bird collision triggers same game-over path as cactus                            | ✓ SATISFIED (code) / ? HUMAN (behavioral) | Collision branch at lines 209-213 mirrors cactus branch (194-198) verbatim; visual identity needs play-test |

### Anti-Patterns Found

Scanned all Phase 3 modified regions of `dino.js`.

| File      | Line | Pattern                        | Severity | Impact       |
|-----------|------|--------------------------------|----------|--------------|
| `dino.js` | 289  | `//initial frame; the update() draw loop re-picks per-frame...` comment on `img: bird1Img` in `placeBird` bird object literal | ℹ️ Info | Comment references plan 03-02 as future work but 03-02 is complete. The comment is stale but harmless — `bird.img` is set at spawn time (not used in draw; draw uses `birdSprite` from frameCount picker). Zero impact on correctness. |

No blockers. No stubs. No empty return values on render paths. No `const`. No `birdVelocityX`. No `let birdX`. No `context.drawImage(bird.img,`. No `break` inside bird loop.

**Phase 2 carry-forward — regression scan:**

- `frameCount++` at line 133 (top of `update()`, before `gameOver` early-return) — unchanged.
- `duckWidth=118`, `duckHeight=60`, `duckY=190` at lines 31-33 — unchanged.
- Dino state machine derivation block at lines 153-179 — unchanged.
- `detectCollision(a, b)` at lines 333-338 — pure AABB, unchanged.
- `moveDino(e)` at lines 223-237 — no bird-related input, unchanged.
- `keyUp(e)` at lines 239-243 — ArrowDown release only, unchanged.
- `placeCactus()` at lines 245-280 — unchanged.

### Human Verification Required

#### 1. Birds Scroll at Cactus Speed

**Test:** Play for 30+ seconds. Arrange to have a bird and a cactus visible on screen simultaneously.
**Expected:** Both scroll left at the same horizontal pace — no visual lead or lag between a bird and a cactus at the same x position.
**Why human:** `bird.x += velocityX` and `cactus.x += velocityX` use the identical global — correct by code — but visual confirmation that no rendering anomaly introduces perceived difference is a visual check only.

#### 2. Bird Flap Rate Reads as Flapping (Distinct from Dino Run)

**Test:** Watch a bird cross the canvas. Compare wing alternation rate to the dino's leg cycle.
**Expected:** Bird wings change frame noticeably more slowly than the dino's legs alternate; the bird reads as lazily gliding/flapping, not twitching.
**Why human:** Divisor 12 vs 6 is mathematically half the rate. Whether this ratio reads qualitatively as "distinct" and "flapping" requires subjective perception.

#### 3. Low Bird (y=110) — Must Duck to Survive

**Test A (die):** Wait for a low bird. Do not press any key. Let the standing dino walk into it.
**Expected:** Dead sprite paints, scroll halts, score freezes on contact.
**Test B (survive):** Restart. Wait for another low bird. Hold ArrowDown before the bird reaches the dino. Release after it passes.
**Expected:** Bird passes over the ducking dino without collision. Game continues.
**Why human:** AABB clearance math is verified (`duck dino [190,250]` vs `bird [110,178]` — 12 px gap), but live feel and visual confirmation that the bird is visually above the ducking dino requires play-test.

#### 4. Mid Bird (y=156) — Must Jump, Ducking Does Not Help

**Test A (die standing):** Wait for a mid bird. Stand still. Expect death.
**Test B (die ducking):** Restart. Wait for a mid bird. Hold ArrowDown. Expect death (ducking does NOT clear a mid bird).
**Test C (survive jumping):** Restart. Wait for a mid bird. Press Space/ArrowUp while grounded to jump as it approaches. Expect survival.
**Expected:** Tests A and B end the run; Test C survives.
**Why human:** All three interactions require active input timing against a live obstacle.

#### 5. High Bird (y=50) — Punishes Reflexive Jumping, Standing Safe

**Test A (survive standing):** Wait for a high bird. Stand still. Expect survival — bird passes overhead.
**Test B (die jumping):** Restart. Wait for a high bird. Press Space/ArrowUp as it approaches. Expect death.
**Expected:** Test A survives; Test B dies.
**Why human:** The "punishes reflexive jumping" mechanic is a key player-feel feature that requires intentional verification with jump timing.

#### 6. Bird Collision Is Indistinguishable from Cactus Collision

**Test:** Die on a bird. Observe the game-over state. Compare to dying on a cactus.
**Expected:** Dead sprite appears same-frame. Scroll stops. Score freezes. No "live dino flash" before the dead sprite. Behavior feels identical to a cactus death.
**Why human:** "Indistinguishable" is a qualitative judgment. The same-frame paint mechanism is verified in code (lines 210-212), but perceptual equivalence needs human eyes.

#### 7. Any-Key Restart After Bird Death — No Ghost Birds

**Test:** Die on a bird (the dead bird should freeze on screen with scroll halted). Press any key to restart.
**Expected:** Score resets to 0, dino returns to running state, canvas clears, no bird sprites visible at their frozen positions. New run begins normally with fresh spawning.
**Why human:** Requires visual inspection of the canvas immediately after restart to confirm no stale bird sprites are drawn from birdArray leftovers. `birdArray = []` is confirmed at line 323, but the cleared-canvas experience needs visual verification.

### Gaps Summary

No automated gaps. All 9 must-have truths are verified in code. Requirements BIRD-01 through BIRD-04 are satisfied at the code level.

The 7 human verification items above are the remaining gate before Phase 3 can be declared complete. They are all behavioral/perceptual checks that cannot be automated against a canvas-rendered browser game. None of them identify a suspected code defect — the code implements all locked decisions (D-01 through D-20) exactly as specified.

---

_Verified: 2026-05-05T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
