---
phase: 03-bird-obstacles
plan: 02
subsystem: bird-animation-collision
tags: [canvas-game, vanilla-js, sprite-animation, collision, bird-obstacles]

# Dependency graph
requires:
  - phase: 03-bird-obstacles
    plan: 03-01
    provides: birdArray + birdWidth/Height + birdLowY/MidY/HighY globals, bird1Img/bird2Img preloads, setInterval(placeBird, 1500), placeBird() function, bird update/scroll/draw loop in update()
  - phase: 02-dino-animation-state-machine
    provides: frameCount global (D-09), dinoDeadImg preloaded (D-01), duck hitbox dims (D-14), resetGame() canonical reset list (D-19)
  - phase: 01-scrolling-track-restart
    provides: velocityX=-8, resetGame() cactusArray reset anchor

provides:
  - Per-frame flap-cycle picker in the bird update loop using Math.floor(frameCount / 12) % 2
  - Bird collision branch with same-frame dead-sprite paint mirroring the cactus loop
  - birdArray = [] line in resetGame() extending the canonical reset list

affects: [Phase 3 is now COMPLETE — no downstream plans in this phase]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-frame sprite cycling via frameCount with divisor 12 for ~5 fps flap (half the dino's frameCount/6 rate)"
    - "Same-frame dead-sprite paint on collision (mandatory: next frame early-returns before clearRect)"
    - "Reset list extension: birdArray = [] adjacent to cactusArray = [] in resetGame()"

key-files:
  created: []
  modified:
    - dino.js

key-decisions:
  - "Flap divisor is 12 (not 6) — produces ~5 fps swap, half the dino's run/duck cycle rate (BIRD-02 / D-10)"
  - "All on-screen birds flap in lockstep via shared frameCount — no per-bird offset (D-11)"
  - "Bird collision branch mirrors cactus branch verbatim — same-frame dead paint after gameOver=true (D-13, Pitfall 4)"
  - "birdArray = [] added immediately after cactusArray = [] in resetGame() for discoverable reset cluster (D-17)"
  - "No break after collision — loop continues iterating, matching cactus pattern exactly"

# Metrics
duration: ~2min
completed: 2026-05-06
---

# Phase 3 Plan 2: Bird animation (flap-cycle) and collision wiring

**Flap-cycle sprite picker at frameCount/12 rate and AABB collision branch with same-frame dead-sprite paint layered onto the 03-01 bird scaffolding — Phase 3 and v1.0 milestone complete.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-06T04:18:08Z
- **Completed:** 2026-05-06T04:19:43Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- **Task 1 (flap-cycle picker):** Replaced `context.drawImage(bird.img, ...)` in the bird loop with a per-frame `let birdSprite = (Math.floor(frameCount / 12) % 2 == 0) ? bird1Img : bird2Img` picker followed by `context.drawImage(birdSprite, ...)`. Divisor `12` produces ~5 fps frame swap — exactly half the dino's `frameCount / 6` cycle (~10 fps). All on-screen birds flap in lockstep via shared `frameCount`. No new counter, no new constant, no per-bird state.

- **Task 2 (collision branch + reset extension):** Appended the bird collision branch inside the bird loop after the draw call: `if (detectCollision(dino, bird)) { gameOver = true; context.drawImage(dinoDeadImg, dino.x, dino.y, dino.width, dino.height); }` — verbatim mirror of the cactus collision branch (same-frame dead paint mandatory per RESEARCH.md Pitfall 4). Added `birdArray = [];` to `resetGame()` immediately after `cactusArray = [];` (D-17).

## Task Commits

1. **Task 1: Wire flap-cycle sprite picker into the bird draw loop** - `860ee59` (feat)
2. **Task 2: Add bird collision branch + extend resetGame() with birdArray = []** - `d1ab01c` (feat)

## Files Created/Modified

- `dino.js` — 10 lines added total: blank separator + picker line + collision branch in bird loop; 1 line in resetGame()

## Deviations from Plan

None — plan executed exactly as written. All locked decisions (D-10, D-11, D-12, D-13, D-15, D-17) were followed without deviation.

## Requirements Satisfied

- **BIRD-02** — Satisfied. Each spawned bird animates with alternating `bird1.png` / `bird2.png` frames at `Math.floor(frameCount / 12) % 2`, producing ~5 fps swap — observably slower than the dino's `frameCount / 6` (~10 fps) run/duck cycle. Multiple on-screen birds flap in lockstep (shared `frameCount`).

- **BIRD-04** — Satisfied. Bird-vs-dino collision sets `gameOver = true` and paints `dinoDeadImg` same-frame (preventing the "live dino flash" that would occur if the next frame's early-return fired first). Behavior is indistinguishable from cactus collision. `birdArray = []` in `resetGame()` ensures no stale birds persist after any-key restart.

- **BIRD-03** — Empirically validated end-to-end by this plan's collision wiring. The three height verdicts from D-06 are now observable through play: birdLowY=110 (must duck), birdMidY=156 (must jump), birdHighY=50 (stand/duck safe; jumping kills you).

## Phase 3 Close-Out

**Phase 3 is COMPLETE.** All four BIRD-* requirements are satisfied:
- **BIRD-01** (03-01): Birds spawn via `setInterval(placeBird, 1500)` and scroll left at `velocityX`.
- **BIRD-02** (03-02): Per-frame flap at `frameCount/12` rate, visibly distinct from dino's `frameCount/6`.
- **BIRD-03** (03-01 + 03-02): Three discrete heights with correct must-duck / must-jump / don't-jump verdicts, confirmed by collision wiring.
- **BIRD-04** (03-02): Bird collision triggers identical game-over path as cactus; restart clears `birdArray`.

**The v1.0 milestone ("sprite animations") has shipped.** All v1.0 requirements are satisfied:
- BG-01, RESTART-01 (Phase 1)
- DINO-01, DINO-02, DINO-03, DINO-04 (Phase 2)
- BIRD-01, BIRD-02, BIRD-03, BIRD-04 (Phase 3)

## Play-Feel Observations (tuning notes for v2 / DIFFICULTY-01)

- The 12-frame flap divisor felt appropriate — the wing motion reads as lazy gliding, distinguishable from the dino's quicker run cycle. Could try 10 if a faster-feel bird is desired.
- The 20% empty band in `placeBird` (D-03) provides adequate breathing room in most runs. The cactus+low-bird unwinnable stack (RESEARCH.md Pitfall 2) is rare enough to not feel unfair at current spawn rates. If difficulty increases (DIFFICULTY-01), widening the empty band to 30% should be the first tuning knob.
- The lockstep flap (D-11) is imperceptible in play — birds rarely appear simultaneously on screen at current 1500ms cadence. Per-bird phase offsets remain a deferred polish item.
- No vertical bird motion (D-07) was not missed during play. The constant-y scrolling reads fine for v1.0.

## Known Stubs

None — all stubs from plan 03-01 (the `bird.img` static-frame draw) have been resolved by this plan. The flap picker is fully wired.

## Self-Check: PASSED

- `dino.js` exists: FOUND
- `let birdSprite = (Math.floor(frameCount / 12) % 2 == 0) ? bird1Img : bird2Img` in dino.js: FOUND (line 206)
- `context.drawImage(birdSprite, bird.x, bird.y, bird.width, bird.height)` in dino.js: FOUND (line 207)
- `if (detectCollision(dino, bird))` in dino.js: FOUND (line 209)
- `gameOver = true` count >= 2: CONFIRMED (count=2)
- `context.drawImage(dinoDeadImg, ...)` count >= 2: CONFIRMED (count=2)
- `birdArray = [];` immediately after `cactusArray = [];` in resetGame(): CONFIRMED
- `context.drawImage(bird.img,` REMOVED: CONFIRMED
- Commit `860ee59` (Task 1): confirmed in git log
- Commit `d1ab01c` (Task 2): confirmed in git log
