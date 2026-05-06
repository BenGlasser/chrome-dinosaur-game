---
phase: 02-dino-animation-state-machine
verified: 2026-05-05T00:00:00Z
status: human_needed
score: 4/4 must-haves verified (SC4 verified by calculation; empirical low-obstacle deferred to Phase 3)
overrides_applied: 0
deferred:
  - truth: "A test obstacle drawn at 'low height' does not collide with the dino while it is ducking, but does collide while it is standing — empirical in-browser confirmation"
    addressed_in: "Phase 3"
    evidence: "Phase 3 success criteria #3: 'at least one height clears a standing dino (jump-or-duck-required) and at least one height requires ducking specifically (cannot be cleared by jumping).' Phase 3 depends on Phase 2's DINO-04 hitbox being correct, which is verified here by calculation."
human_verification:
  - test: "Run cycle alternates visibly at ~10 fps while dino is on the ground"
    expected: "Dino legs alternate between dino-run1.png and dino-run2.png at a rate that reads as a run — not a strobe (too fast) and not a slideshow (too slow). Approximately 10 frame-swaps per second at 60 Hz."
    why_human: "Animation rate is a perceptual judgment. The code (Math.floor(frameCount/6)%2) is correct mechanically, but whether the resulting visual reads as 'a run cycle' requires a human watching the canvas."

  - test: "Jump sprite (dino-jump.png) shows while airborne, run cycle does not"
    expected: "After pressing Space or ArrowUp, while the dino is in the air the sprite shows a single static jump pose. On landing, the run cycle immediately resumes."
    why_human: "Whether the state transition is visually clean (no flickering run frame while airborne, no jump frame after landing) requires watching in a browser."

  - test: "Duck cycle alternates while ArrowDown held on ground; dino is visibly shorter and wider"
    expected: "Holding ArrowDown: dino visually lowers into duck posture, duck animation cycles (duck1/duck2 at same rate as run cycle). Releasing ArrowDown: dino immediately returns to standing run cycle. Rapid repeated duck/stand transitions leave no stuck-duck state."
    why_human: "Duck visual height reduction and animation cycling are perceptual. The stuck-duck regression (isDuckHeld flag not clearing on keyup) requires interactive testing."

  - test: "Dead-dino sprite appears immediately on collision with no blank frame"
    expected: "When the dino hits a cactus, the dead-dino sprite (dino-dead.png) renders in the same visual moment as the collision with no single-frame blank or run-cycle flash. The sprite persists on screen until a key is pressed to restart."
    why_human: "The one-frame timing subtlety (dinoDeadImg drawn same-frame in collision block, then gameOver early-return holds it) requires visual confirmation. A blank frame on death would be imperceptible to grep but noticeable to a human."
---

# Phase 2: Dino Animation & State Machine — Verification Report

**Phase Goal:** The dino plays the correct sprite for each gameplay state — running, jumping, ducking — and its collision hitbox tracks the visual state (smaller while ducking) so a low obstacle can be cleared by ducking.
**Verified:** 2026-05-05
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | While on the ground and game running, sprite alternates dino-run1.png / dino-run2.png at ~10 fps | VERIFIED | `Math.floor(frameCount / 6) % 2` picker at lines 165; both images preloaded lines 79-81; frameCount++ at line 113 |
| 2 | While airborne, sprite is dino-jump.png (not running cycle) | VERIFIED | State derivation: `dino.y < dinoY` → "jumping" at line 136 (precedes duck check); `dinoJumpImg` selected at line 163 |
| 3 | While ArrowDown held and on ground, sprite alternates dino-duck1.png / dino-duck2.png and hitbox is shorter + wider | VERIFIED | `isDuckHeld=true` in moveDino line 199, cleared in keyUp line 206; duck dims applied lines 144-146; `Math.floor(frameCount/6)%2` picker at line 164 |
| 4 | A low-height obstacle does not collide with ducking dino, does collide with standing dino | VERIFIED (calculation) | Duck AABB: y=190, height=60 (spans 190..250). Standing AABB: y=156, height=94 (spans 156..250). Obstacle with bottom edge at or above y=190 clears ducking dino (190 < 190 is FALSE) but hits standing dino (156 < 190 is TRUE). Math verified in RESEARCH.md duck hitbox section. Empirical in-browser test deferred to Phase 3 (BIRD-03). |

**Score:** 4/4 truths verified

---

### Deferred Items

Items not yet met empirically but addressed in a later milestone phase.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Empirical in-browser low-obstacle clearance confirmation | Phase 3 | Phase 3 SC #3 requires birds at heights that demand ducking, building directly on Phase 2's DINO-04 hitbox. Phase 3 explicitly depends on Phase 2's duck hitbox being correct. |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `let dinoRun1Img` | Sprite global | VERIFIED | Line 22 |
| `let dinoRun2Img` | Sprite global | VERIFIED | Line 23 |
| `let dinoJumpImg` | Sprite global | VERIFIED | Line 24 |
| `let dinoDuck1Img` | Sprite global | VERIFIED | Line 25 |
| `let dinoDuck2Img` | Sprite global | VERIFIED | Line 26 |
| `let dinoDeadImg` | Sprite global | VERIFIED | Line 27 |
| `let dinoState` | State string global | VERIFIED | Line 28, initialized "running" |
| `let isDuckHeld` | Boolean global | VERIFIED | Line 29, initialized false |
| `let frameCount` | Frame counter global | VERIFIED | Line 30, initialized 0 |
| `let duckWidth = 118` | Duck dimension | VERIFIED | Line 31 |
| `let duckHeight = 60` | Duck dimension | VERIFIED | Line 32 |
| `let duckY` | Duck ground y (190) | VERIFIED | Line 33: `boardHeight - duckHeight` |
| `dinoImg` global | Must NOT exist | VERIFIED | `grep -c 'dinoImg' dino.js` → 0 |
| Sprite preloads (6) | All 6 in window.onload | VERIFIED | Lines 78-89: all six `.src` assignments present |
| `frameCount++` as first line of `update()` | Before gameOver check | VERIFIED | Line 113, before `requestAnimationFrame(update)` early gate |
| State derivation in `update()` (priority order) | gameOver→dead, airborne→jumping, duck→ducking, else→running | VERIFIED | Lines 133-141, exact D-06 priority order |
| Hitbox mutation block | Duck: dino.width=118, height=60, y=190; else: restore standing | VERIFIED | Lines 143-151 |
| Gravity gate (skip while ducking) | `if (dinoState != "ducking")` with `velocityY=0` in else | VERIFIED | Lines 154-159 |
| Sprite picker (inline if/else chain) | `Math.floor(frameCount/6)%2` for run+duck | VERIFIED | Lines 161-166 |
| `context.drawImage(dinoDeadImg, ...)` in collision block | Same-frame dead draw | VERIFIED | Line 177 |
| `function keyUp(e)` | Named function, ArrowDown only | VERIFIED | Lines 204-208 |
| `document.addEventListener("keyup", keyUp)` | Registered in window.onload | VERIFIED | Line 109 |
| `addEventListener` count = 2 | keydown + keyup, no parallel listeners | VERIFIED | `grep -c 'document.addEventListener' dino.js` → 2 |
| `resetGame()` extensions | dinoState, isDuckHeld, frameCount, dino.width, dino.height reset | VERIFIED | Lines 253-257 |
| `dinoImg.src = "./img/dino.png"` removed from resetGame | Must not exist | VERIFIED | No dinoImg reference anywhere in dino.js |
| `img/dino.png` file | Still present (unreferenced, not deleted) | VERIFIED | File exists at `img/dino.png` |
| No `const` introduced | `let` only | VERIFIED | `grep -c '\bconst\b' dino.js` → 0 |
| Single file `dino.js` | No new source files | VERIFIED | Only dino.js, index.html, dino.css in repo root |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `window.onload` | `dinoRun1Img..dinoDeadImg` | `.src` assignment | WIRED | Lines 78-89: all 6 images preloaded |
| `window.onload` | `keyUp` | `addEventListener("keyup")` | WIRED | Line 109 |
| `moveDino(e)` | `isDuckHeld` | `isDuckHeld = true` on ArrowDown | WIRED | Line 199, no ground gate (D-18 compliant) |
| `keyUp(e)` | `isDuckHeld` | `isDuckHeld = false` on ArrowDown | WIRED | Line 206 |
| `update()` → state derivation | `dino.y`, `isDuckHeld`, `gameOver` | if/else priority chain | WIRED | Lines 133-141 |
| `update()` → hitbox mutation | `dino.width`, `dino.height`, `dino.y` | conditional assignment | WIRED | Lines 143-151 |
| `update()` → gravity gate | `dinoState` | `if (dinoState != "ducking")` | WIRED | Lines 154-159 |
| `update()` → sprite picker | `dinoState`, `frameCount` | inline if/else chain | WIRED | Lines 161-166 |
| Collision block → dead sprite | `dinoDeadImg` | `context.drawImage` | WIRED | Line 177 |
| `resetGame()` → animation state | `dinoState`, `isDuckHeld`, `frameCount`, `dino.width/height` | direct assignment | WIRED | Lines 253-257 |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| Sprite picker (lines 161-166) | `frameCount`, `dinoState` | `frameCount++` line 113; state derivation lines 133-141 | Yes — frameCount is a live counter; dinoState is derived from live globals | FLOWING |
| Hitbox mutation (lines 143-151) | `dino.width`, `dino.height`, `dino.y` | `duckWidth/duckHeight/duckY` constants + `dinoWidth/dinoHeight` constants | Yes — written each frame from defined constants | FLOWING |
| Gravity gate (lines 154-159) | `velocityY`, `dino.y` | Accumulated gravity or zeroed by duck state | Yes — real physics state; `Math.min` clamp against `dinoY` constant | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — no runnable entry points available without a browser. The game runs from `file://` / static HTTP; Canvas 2D cannot be tested via Node.js or CLI. All behavioral verification routes to the Human Verification section.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DINO-01 | 02-01-PLAN.md | Running animation alternates dino-run1/run2 at ~10 fps | SATISFIED | `Math.floor(frameCount/6)%2` picker line 165; both images preloaded; frameCount incremented every frame |
| DINO-02 | 02-01-PLAN.md | Jump sprite dino-jump.png while airborne | SATISFIED | Airborne check line 136 (priority before duck); dinoJumpImg selected line 163 |
| DINO-03 | 02-02-PLAN.md | Duck animation alternates dino-duck1/duck2 while ArrowDown held on ground | SATISFIED | isDuckHeld set/cleared lines 199/206; duck picker line 164; keyup listener registered line 109 |
| DINO-04 | 02-02-PLAN.md | Ducking hitbox shorter+wider; low obstacle clears ducking, hits standing | SATISFIED (calculation) | dino.width=118, height=60, y=190 while ducking (lines 144-146); AABB math confirms clearance geometry; empirical test deferred to Phase 3 |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | — |

No anti-patterns found. Specific checks:

- **`const` introduced:** None. `grep -c '\bconst\b' dino.js` → 0. All new declarations use `let`.
- **`dinoImg` remnant:** None. `grep -c 'dinoImg' dino.js` → 0. Old single-image global fully removed.
- **`dinoImg.src` in resetGame:** Removed. resetGame contains no `.src` assignments.
- **Physics constant changes:** All unchanged. `velocityX = -8` (line 51), `gravity = .4` (line 53), `velocityY = -10` (line 196), `dinoY = boardHeight - dinoHeight` (line 12).
- **Parallel keydown listener:** Not present. Only 2 `addEventListener` calls, one keydown and one keyup.
- **Ground gate on ArrowDown:** Not present. `moveDino` ArrowDown branch (line 198) sets `isDuckHeld = true` with no `dino.y == dinoY` gate (D-18 compliant).
- **TODO/FIXME/placeholder comments:** None found in modified code.
- **dino.png deleted:** Not deleted. `img/dino.png` still present (D-03 compliant).
- **New files introduced:** None. Only `dino.js` was modified.

---

### Human Verification Required

#### 1. Run Cycle — Visual Alternation at ~10 fps

**Test:** Open `index.html` in a browser (or `http://localhost:8000`). Watch the dino on the ground before any jump or duck. Observe the legs.
**Expected:** The run cycle visibly alternates between the two run sprites. The animation reads as a run — not a strobe (too fast) and not a slideshow (too slow). Approximately 10 frame-swaps per second at 60 Hz. This should look like the real Chrome dino game.
**Why human:** Animation rate is a perceptual judgment. The mechanical formula (`Math.floor(frameCount/6)%2`) is verified correct, but whether the result reads as "a run cycle" requires a human watching the canvas.

#### 2. Jump Sprite — Correct State Transition

**Test:** Press Space or ArrowUp while the dino is on the ground. Watch the sprite during the full arc.
**Expected:** While airborne, the sprite shows a single static jump pose (`dino-jump.png`). The run cycle stops; no alternation in the air. On landing, the run cycle immediately resumes. No jump frame visible while on the ground.
**Why human:** State transition timing — particularly whether a run frame flickers during the airborne→ground transition — requires visual observation.

#### 3. Duck Cycle — Visual, State Transitions, No Stuck-Duck

**Test:** (a) Hold ArrowDown while the dino is on the ground. (b) Release ArrowDown. (c) Rapidly alternate press/release several times.
**Expected:** While held: dino visually lowers (shorter silhouette, wider body), duck animation cycles. On release: dino immediately returns to standing run cycle. Rapid alternation: no stuck-duck state; dino always matches the current key state.
**Why human:** Duck visual height reduction and the stuck-duck regression (isDuckHeld flag not clearing) require interactive testing with the DOM keyup event.

#### 4. Dead-Dino Sprite — Same-Frame Appearance on Collision

**Test:** Let the dino run into a cactus. Observe the exact moment of collision.
**Expected:** The dead-dino sprite (`dino-dead.png`) appears at the dino's last position immediately — no single blank frame, no run-cycle frame visible at the moment of death. The dead sprite persists until a key is pressed.
**Why human:** The one-frame timing of `context.drawImage(dinoDeadImg, ...)` in the collision block (line 177) vs. the `gameOver` early-return on subsequent frames is correct in the code but the visual result must be confirmed imperceptible in the browser.

---

### Gaps Summary

No code-level gaps found. All 4 ROADMAP success criteria are satisfied:

- SC1 (run cycle): Fully implemented and wired.
- SC2 (jump sprite): Fully implemented and wired.
- SC3 (duck cycle + hitbox): Fully implemented and wired.
- SC4 (low-obstacle hitbox clearance): Verified by calculation. The duck AABB (y=190..250) is smaller than the standing AABB (y=156..250) and the geometry is correct. Empirical in-browser confirmation with a real low obstacle is deferred to Phase 3 (BIRD-03), per RESEARCH.md Q1 resolution (option c).

Status is `human_needed` because four browser-only visual behaviors require human play-testing before the phase can be closed as fully shipped.

---

_Verified: 2026-05-05_
_Verifier: Claude (gsd-verifier)_
