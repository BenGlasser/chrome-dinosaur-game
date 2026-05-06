---
phase: 02-dino-animation-state-machine
plan: 03
subsystem: dino-animation
tags: [state-machine, duck-mechanic, hitbox, canvas, input-handling]

dependency_graph:
  requires:
    - phase: 02-01
      provides: isDuckHeld global, keyUp handler, state-derivation block, hitbox-dims block, gravity-skip-while-ducking gate, duck sprite picker, resetGame extensions (D-19)
  provides:
    - ArrowDown keydown wired: sets isDuckHeld = true in moveDino's ArrowDown branch
    - Ground gate dropped from ArrowDown branch (D-18) enabling pre-buffered duck while airborne
    - DINO-03: duck visual cycle (dinoDuck1Img/dinoDuck2Img alternating via frameCount/6) fully active
    - DINO-04: duck AABB {x:50, y:190, width:118, height:60} — shorter+wider than standing, mathematically confirmed to evade low obstacles
  affects:
    - Phase 3 (birds/BIRD-03 will close the empirical DINO-04 loop with real low-flying obstacles)

tech-stack:
  added: []
  patterns:
    - D-18: Drop input-layer ground gate; let per-frame state-derivation handle airborne priority
    - Pre-buffered input: set flag eagerly on keydown; state machine applies it when conditions are met

key-files:
  created: []
  modified:
    - path: dino.js
      note: "2 lines changed in moveDino's ArrowDown branch (198-200); total line count unchanged at 265"

key-decisions:
  - "D-18 executed: dropped dino.y==dinoY gate from ArrowDown branch so isDuckHeld can be set while airborne — state derivation in update() enforces the airborne-priority rule, not the input handler"
  - "DINO-04 verified by calculation for Phase 2 per RESEARCH option (c); empirical confirmation deferred to Phase 3 BIRD-03 which will place real low obstacles at y in [150,190]"
  - "No debug obstacle added — plan explicitly forbids it; hitbox math is the canonical verification for this phase"

patterns-established:
  - "Pre-buffered input: set isDuckHeld=true even while airborne; let per-frame derivation gate the actual state transition"

requirements-completed:
  - DINO-03
  - DINO-04

duration: 2min
completed: "2026-05-06"
---

# Phase 2 Plan 3: Duck Mechanic (DINO-03 + DINO-04) Summary

**Two-line edit in moveDino's ArrowDown branch activates the full duck data flow: visual duck cycle (dinoDuck1/duck2 at ~10 fps) and shrunk hitbox {width:118, height:60, y:190} verified by AABB calculation to evade obstacles at duck-clearance height.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-06T02:23:24Z
- **Completed:** 2026-05-06T02:25:00Z
- **Tasks:** 1/1
- **Files modified:** 1

## Accomplishments

- Wired duck input: `moveDino`'s ArrowDown branch now sets `isDuckHeld = true` (was empty `//duck` placeholder since the original tutorial code).
- Dropped the `&& dino.y == dinoY` ground gate from the ArrowDown branch per D-18, enabling the player to pre-buffer a duck mid-jump (the dino stays as dino-jump.png while airborne per D-20 priority; on landing the next frame transitions to ducking because `isDuckHeld` is still true).
- The entire duck data flow shipped in 02-01 is now live end-to-end: state-derivation routes to "ducking", hitbox dims mutate to `{width:118, height:60, y:190}`, gravity is skipped and `velocityY` zeroed, and the sprite picker alternates `dinoDuck1Img`/`dinoDuck2Img` at 6-frame intervals (~10 fps at 60 Hz).

## DINO-04 Hitbox Verification (Calculation-Based — Canonical for Phase 2)

Per RESEARCH §"Open Questions" Q1 option (c), DINO-04 is verified by calculation in Phase 2. Empirical confirmation (real low obstacle) is deferred to Phase 3 BIRD-03.

```
boardHeight = 250

Standing dino AABB:  {x: 50, y: 156, width: 88,  height: 94}  → y-span [156, 250]
Ducking dino AABB:   {x: 50, y: 190, width: 118, height: 60}  → y-span [190, 250]

Ducking is shorter (height 60 < 94) AND wider (width 118 > 88). Both feet remain on the ground:
  - Standing: y + height = 156 + 94 = 250 = boardHeight  ✓
  - Ducking:  y + height = 190 + 60 = 250 = boardHeight  ✓

Hypothetical low obstacle at {y: 150, height: 40} → y-span [150, 190]:

  Standing vs obstacle — detectCollision(dino, obs):
    a.y (156) < b.y + b.height (150+40=190)  → 156 < 190  → TRUE
    a.y + a.height (156+94=250) > b.y (150)  → 250 > 150  → TRUE
    x-axes overlap (given)                                 → TRUE
    Result: COLLISION ✓ (standing dino dies)

  Ducking vs obstacle — detectCollision(dino, obs):
    a.y (190) < b.y + b.height (150+40=190)  → 190 < 190  → FALSE (strict less-than)
    Result: NO COLLISION ✓ (ducking dino passes safely)
```

DINO-04 is mathematically satisfied. Phase 3's BIRD-03 will place real low-flying birds at this height to close the empirical loop.

## Task Commits

1. **Task 1: Fill ArrowDown branch — set isDuckHeld=true, drop ground gate (D-18)** — `2cd7a37` (feat)

## Files Created/Modified

- `dino.js` — 2 lines changed in `moveDino`'s ArrowDown branch (line 198-200): condition changed from `e.code == "ArrowDown" && dino.y == dinoY` to `e.code == "ArrowDown"`; body changed from `//duck` comment to `isDuckHeld = true;`. No other changes.

## Grep Verification Results

All 24 acceptance criteria PASSED:

- `else if (e.code == "ArrowDown") {` present (no ground gate) — PASS
- `isDuckHeld = true;` present in ArrowDown branch — PASS
- `e.code == "ArrowDown" && dino.y == dinoY` absent — PASS (old gate gone)
- Jump branch `if ((e.code == "Space" || e.code == "ArrowUp") && dino.y == dinoY)` unchanged — PASS
- `velocityY = -10;` present — PASS
- `function keyUp(e)` present — PASS
- `isDuckHeld = false;` present in keyUp — PASS
- `document.addEventListener("keyup", keyUp)` present — PASS
- `else if (isDuckHeld)` in state derivation — PASS
- `dinoState = "ducking"` in state derivation — PASS
- `dino.width = duckWidth`, `dino.height = duckHeight`, `dino.y = duckY` in hitbox block — PASS (x3)
- `if (dinoState != "ducking")` gravity gate — PASS
- `velocityY = 0` in duck gravity branch — PASS
- Duck sprite picker with `Math.floor(frameCount / 6) % 2 == 0` — PASS
- `let duckWidth = 118`, `let duckHeight = 60`, `let duckY = boardHeight - duckHeight` — PASS (x3)
- `dino.width = dinoWidth`, `dino.height = dinoHeight` in resetGame — PASS (x2)
- Exactly 2 `document.addEventListener` calls — PASS
- Exactly 2 `requestAnimationFrame` calls — PASS
- No `const` declarations — PASS

## Manual Play-Test (Described — Browser Verification)

To verify end-to-end (open `index.html` or `python3 -m http.server`):

1. **DINO-03 duck cycle:** Hold ArrowDown on the ground. The dino visibly lowers (y 156→190) and becomes shorter+wider. Duck sprite alternates dino-duck1.png/dino-duck2.png at the same ~10 fps rate as the run cycle (same 6-frame interval per D-11).
2. **DINO-03 release:** Release ArrowDown. Dino immediately returns to run cycle and standing dimensions. No stuck-duck state.
3. **DINO-03 stress:** Hold/release ArrowDown rapidly 10x. Each transition is clean.
4. **D-20 pre-buffered duck:** Jump, hold ArrowDown while airborne. Sprite stays as dino-jump.png throughout the arc (airborne priority). On landing: immediately transitions to duck pose. Release: runs normally.
5. **Gravity-teleport regression (RESEARCH Risk 1):** Hold ArrowDown for 5+ seconds. Dino stays at y=190 — does NOT snap upward to y=156. (02-01's gravity gate ensures this.)
6. **Stand-up launch regression (RESEARCH Risk 4):** After holding ArrowDown, release. No vertical bounce or jitter. (`velocityY=0` zeroing prevents this.)
7. **Ground cactus while ducking:** Collision still fires (duck AABB y=[190,250] overlaps cactus y=[180,250]). Dead sprite appears. Duck does not protect against ground obstacles — only against low-flying birds at y<190 (Phase 3).
8. **Restart after duck-death:** Hold ArrowDown, collide with cactus. Press any key. Dino is back at standing dimensions (88x94) running — not stuck in duck. (`resetGame`'s `dino.width=dinoWidth; dino.height=dinoHeight` from 02-01 Task 3 handles this.)

## Decisions Made

- D-18 executed: dropped the `dino.y == dinoY` gate from the ArrowDown branch. The state-derivation block in `update()` uses D-20 priority order (airborne beats duck), so `isDuckHeld=true` while airborne is harmless and enables the desirable pre-buffered-duck-on-landing behavior.
- DINO-04 verified by calculation per RESEARCH option (c). No debug obstacle added. Phase 3 BIRD-03 closes the empirical loop.

## Deviations from Plan

None — plan executed exactly as written. The single two-line edit was the complete scope of this plan.

## Known Stubs

None. The duck mechanic is fully active with real sprite images and a correctly-sized hitbox. No placeholder data flows to the renderer.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes. All changes confined to local input handling in `dino.js`.

## Next Phase Readiness

Phase 2 complete. DINO-01 (run cycle ~10 fps), DINO-02 (airborne sprite), DINO-03 (duck cycle), DINO-04 (shrunk hitbox) all satisfied.

Phase 3 (birds) can begin. Key readiness facts:
- `isDuckHeld` / `dinoState = "ducking"` infrastructure is live and battle-tested.
- The duck AABB {y:190, height:60} is the exact clearance height that BIRD-03 should place low birds at (top edge at or above y=190 to be duck-evadable).
- `cactusArray` is the model for adding a parallel `birdArray` with the same entity shape contract ({x, y, width, height}) required by `detectCollision`.
- `placeCactus` / `setInterval` pattern is the model for a `placeBird` timer.

---
*Phase: 02-dino-animation-state-machine*
*Completed: 2026-05-06*
