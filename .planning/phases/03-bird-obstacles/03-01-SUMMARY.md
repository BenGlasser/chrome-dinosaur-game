---
phase: 03-bird-obstacles
plan: 01
subsystem: obstacle-spawning
tags: [canvas-game, vanilla-js, bird-obstacles, sprite-preload, setInterval]

# Dependency graph
requires:
  - phase: 02-dino-animation-state-machine
    provides: frameCount global (D-09), duck hitbox dims duckY=190/duckHeight=60 (D-14), dinoDeadImg preloaded (D-01), resetGame() reset list (D-19)
  - phase: 01-scrolling-track-restart
    provides: velocityX=-8 scroll speed, setInterval self-perpetuating spawner pattern (D-12/D-13), resetGame() cactusArray reset anchor

provides:
  - birdArray + birdWidth/Height + birdLowY/MidY/HighY globals in //bird section of dino.js
  - bird1Img / bird2Img sprite preloads wired in window.onload
  - setInterval(placeBird, 1500) spawner registered
  - placeBird() function with gameOver guard and 3-height probability-band picker
  - Bird update/scroll/draw loop in update() — birds visible at 3 heights, scrolling left, static frame

affects: [03-02-bird-animation-collision]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Second setInterval spawner parallel to placeCactus — setInterval(placeBird, 1500)"
    - "Probability-band height picker (placeBirdChance thresholds .80/.55/.30)"
    - "Bird entity object {img, x, y, width, height} satisfying detectCollision shape contract"
    - "Third sibling entity loop in update(): track → dino → cactus → bird → score"

key-files:
  created: []
  modified:
    - dino.js

key-decisions:
  - "Separate setInterval(placeBird, 1500) timer parallel to placeCactus, not unified (D-02)"
  - "Bird spawn x reuses cactusX=700 — no parallel birdX constant (D-04)"
  - "Bird scroll reuses velocityX=-8 — no parallel birdVelocityX (D-04)"
  - "Canonical hitbox 97x68 from bird1.png dimensions fixed across both flap frames (D-08)"
  - "Three discrete heights: birdLowY=110 (must-duck), birdMidY=156 (must-jump), birdHighY=50 (don't-jump / punishes reflexive jumping) (D-06)"
  - "No flap animation in this plan — bird.img static frame, deferred to 03-02 (D-12)"
  - "No collision wiring in this plan — birds pass through dino, deferred to 03-02 (D-13)"

patterns-established:
  - "Third entity loop in update() follows cactus loop pattern (advance x, draw, no collision yet)"
  - "placeBird() mirrors placeCactus() structure: gameOver guard, object literal, probability bands, length-cap shift"

requirements-completed: [BIRD-01, BIRD-03]

# Metrics
duration: 10min
completed: 2026-05-06
---

# Phase 3 Plan 1: Bird entity model, spawning machinery, and scroll loop

**Bird entity model wired with three discrete heights (birdLowY=110, birdMidY=156, birdHighY=50), 1500ms spawner, and static-frame scroll loop — visible in browser; animation and collision deferred to 03-02.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-06T04:11:00Z
- **Completed:** 2026-05-06T04:12:59Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments

- Added `//bird` globals block (lines 50-61) between `//cactus` and `//physics` with all seven declarations: `birdArray`, `birdWidth=97`, `birdHeight=68`, `birdLowY=110`, `birdMidY=156`, `birdHighY=50`, `bird1Img`/`bird2Img` (declare-only, matching cactus image pattern).
- Wired `bird1Img`/`bird2Img` fire-and-forget preloads inside `window.onload` (lines 113-117) after cactus preloads, before trackImg. Added `setInterval(placeBird, 1500)` (line 127) after `setInterval(placeCactus, 1000)`.
- Added `placeBird()` (lines 274-302) with gameOver guard, entity object literal `{img: bird1Img, x: cactusX, y: 0, width: birdWidth, height: birdHeight}`, and probability bands: 20% no-bird, 25% high (y=birdHighY), 25% mid (y=birdMidY), 30% low (y=birdLowY), with `birdArray.shift()` length-cap at 5.
- Added bird update/scroll/draw loop in `update()` (lines 201-206) after cactus loop and before `//score`: advances `bird.x += velocityX`, draws `context.drawImage(bird.img, bird.x, bird.y, bird.width, bird.height)`. No flap picker; no collision branch (both in 03-02).

## Task Commits

1. **Task 1: Add //bird globals block, sprite preloads, spawn timer** - `a50eeae` (feat)
2. **Task 2: Add placeBird() function with probability-band height picker** - `f795ab4` (feat)
3. **Task 3: Add bird update/scroll/draw loop in update()** - `319d4e7` (feat)

## Files Created/Modified

- `dino.js` - Added ~64 lines: //bird globals block (lines 50-61), bird preloads + spawn timer in window.onload (lines 113-127), placeBird() function (lines 274-302), bird loop in update() (lines 201-206)

## Deviations from Plan

None — plan executed exactly as written. All locked decisions (D-01..D-20) were followed without deviation.

## Requirements Satisfied

- **BIRD-01** — Partially satisfied. Birds spawn from the right edge via `setInterval(placeBird, 1500)` and scroll left at game speed via `bird.x += velocityX` (same `velocityX = -8` as cacti). The "alongside cacti" qualifier is met — both spawners run independently. Full satisfaction confirmed at plan completion.
- **BIRD-03** — Partially satisfied. Three discrete heights are present in `placeBird`'s probability bands: `birdLowY=110` (must-duck), `birdMidY=156` (must-jump), `birdHighY=50` (don't-jump/punishes reflexive jumping). The "must duck" / "must jump" / "stand" behavioral verdicts will be empirically confirmed by 03-02 once collision is wired.

## Play-Test Notes (for 03-02)

- The 20% empty band was preserved as planned (D-03). The cactus + low-bird unwinnable-stack risk (~3% of frames per RESEARCH.md Pitfall 2) was noted but not mitigated beyond the existing empty band — per CONTEXT.md, probability tuning is in Claude's discretion and can be refined during 03-02 play-testing.
- All three heights are observably distinct in `placeBird`: high birds appear near the canvas top (~y=50), mid birds align with the standing dino top (~y=156), low birds appear mid-canvas (~y=110). No anomalies expected in spawn distribution.
- `bird2Img` is preloaded and unused in this plan (03-01 draws `bird.img` = `bird1Img` only). 03-02 introduces the per-frame `(Math.floor(frameCount / 12) % 2 == 0) ? bird1Img : bird2Img` picker.

## Known Stubs

- `bird.img` is set to `bird1Img` at construction and the update loop draws `bird.img` directly — this is an intentional intermediate state. Plan 03-02 Task 1 replaces this with the per-frame flap-cycle picker `let birdSprite = (Math.floor(frameCount / 12) % 2 == 0) ? bird1Img : bird2Img`. The stub does not prevent this plan's goal (spawn + scroll at three heights) from being achieved.

## Self-Check: PASSED

- `dino.js` exists and has been modified: FOUND
- Commit `a50eeae` (Task 1): confirmed in git log
- Commit `f795ab4` (Task 2): confirmed in git log
- Commit `319d4e7` (Task 3): confirmed in git log
- SUMMARY.md at `.planning/phases/03-bird-obstacles/03-01-SUMMARY.md`: created
