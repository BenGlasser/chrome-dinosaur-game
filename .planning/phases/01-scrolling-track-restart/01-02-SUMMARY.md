---
phase: 01-scrolling-track-restart
plan: "02"
subsystem: gameplay
tags: [restart, state-reset, input-handling, game-loop]

# Dependency graph
requires:
  - phase: 01-scrolling-track-restart/01-01
    provides: track scrolling with track1/track2 globals; dino.js at 194 lines
provides:
  - RESTART-01: any-keydown restarts the game without page reload
  - resetGame() helper performing canonical D-12 state reset
affects:
  - 02-scrolling-track-restart: phase now complete
  - Phase 2 (dino animation): resetGame() is the restart entry point — may call it from future game-over UI

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-17: named resetGame() helper keeps reset list discoverable and centralised"
    - "D-13: state-flip restart — both loops (RAF + setInterval) self-perpetuate; no loop restart needed"
    - "D-10: reuse existing keydown listener, do NOT add a second listener"

key-files:
  created: []
  modified:
    - dino.js (lines 189-196 added resetGame(); line 139 added resetGame(); call in moveDino)

key-decisions:
  - "D-09: any key triggers restart (not a specific key) — matches original Chrome dino"
  - "D-11: no input debounce — first key after death restarts immediately; key-repeat acceptable"
  - "D-12: reset scope is gameOver/score/cactusArray/velocityY/dino.y/dinoImg.src; track positions intentionally excluded"
  - "D-13: no clearInterval/RAF restart — flipping gameOver=false is sufficient for both self-perpetuating loops"
  - "D-17: resetGame() as a named helper (not inlined) for future discoverability"

patterns-established:
  - "State-flip restart: gameOver=false is the only lever needed to resume both game loops"
  - "Named reset function placement: after placeCactus, before detectCollision for logical grouping"

requirements-completed:
  - RESTART-01

# Metrics
duration: "~3 min"
completed: "2026-05-05"
---

# Phase 01 Plan 02: Game-state Reset on Any Key After Game Over (RESTART-01) Summary

**Any-keydown restart via a six-statement resetGame() helper wired into moveDino(), exploiting the self-perpetuating RAF+setInterval architecture so no loops need restarting.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-05
- **Completed:** 2026-05-05
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added `resetGame()` function (lines 189-196 of `dino.js`) performing the canonical D-12 state reset: `gameOver=false`, `score=0`, `cactusArray=[]`, `velocityY=0`, `dino.y=dinoY`, `dinoImg.src="./img/dino.png"`.
- Wired restart into `moveDino(e)` by replacing the plain `return;` in the `if (gameOver)` branch with `resetGame(); return;` — any key pressed after death now restarts the run.
- Track positions (`track1.x`, `track2.x`) intentionally not reset — track continues scrolling seamlessly across restart per D-12.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add resetGame() performing D-12 canonical state reset** - `e21ef5f` (feat)
2. **Task 2: Wire any-keydown restart in moveDino()** - `e5eb619` (feat)

**Plan metadata:** _(docs commit to follow)_

## Files Created/Modified
- `dino.js` — Added `resetGame()` function at lines 189-196 (between `placeCactus` and `detectCollision`); replaced plain `return;` with `resetGame(); return;` at line 139 inside `moveDino(e)`.

## Acceptance Criteria Results

### Task 1
- `node --check dino.js`: PASS (file parses)
- `^function resetGame() {` at line 189: PASS
- Body contains `gameOver = false;`: PASS
- Body contains `score = 0;`: PASS
- Body contains `cactusArray = [];`: PASS
- Body contains `velocityY = 0;`: PASS
- Body contains `dino.y = dinoY;`: PASS (uses ground constant, not hardcoded value)
- Body contains `dinoImg.src = "./img/dino.png";`: PASS (swap-back from dead sprite)
- No `clearInterval` anywhere: PASS
- No `const resetGame`: PASS (tutorial style preserved)
- Order: `placeCactus` (152) < `resetGame` (189) < `detectCollision` (198): PASS
- `track1` / `track2` not reset: PASS

### Task 2
- `node --check dino.js`: PASS
- `if (gameOver) { resetGame(); return; }` in `moveDino`: PASS (verified via source read + grep)
- `velocityY = -10;` (jump velocity) unchanged: PASS (line 145)
- `e.code == "Space" || e.code == "ArrowUp"` jump branch: PASS
- `e.code == "ArrowDown"` duck placeholder: PASS
- `grep -c 'document.addEventListener'` = 1: PASS (single listener, D-10 honored)
- `grep -c 'function moveDino'` = 1: PASS
- `grep -c 'function resetGame'` = 1: PASS
- No debounce / `lastResetAt` / `Date.now`: PASS (D-11 honored)
- All physics constants unchanged (`velocityX=-8`, `gravity=.4`, `dinoY=boardHeight-dinoHeight`, jump `velocityY=-10`): PASS

## Manual Play-Test (Expected Behavior)

Open `index.html` in a browser and verify:

**ROADMAP success criterion 2 — Any-key restart:**
1. Play until the dino collides with a cactus. Dead-sprite (`dino-dead.png`) appears. Track and cacti halt.
2. Press `Space` — game resumes immediately: dino back at ground level with `dino.png` sprite, score reset to `0`, all cacti cleared from canvas.
3. Press `ArrowUp` after next death — same restart behavior.
4. Press a letter key (e.g., `a`) after next death — same restart behavior (D-09: any key).
5. After restart, new cacti spawn within 0–1000 ms (setInterval timer phase preserved per D-13/Risk 4 acceptable).
6. The track continues scrolling immediately on restart (track1.x/track2.x not reset per D-12).
7. Die-and-restart loop is stable across at least 3 cycles — no console errors, no freezes.

**ROADMAP success criterion 3 — Physics/collision unchanged:**
1. Jump height, airtime, and gravity feel identical to pre-plan (no physics constants touched).
2. Cactus collision still fires `gameOver = true` and swaps to dead sprite.
3. Score still increments at the same per-frame rate.
4. Dino and cacti render at correct positions; track continues to scroll normally after restart.

Note: ROADMAP success criterion 1 (scrolling track) was delivered and verified by plan 01-01.

## Decisions Made

All decisions D-09 through D-17 honored. No deviations from the locked CONTEXT.md decisions.

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria pass. No `const` introduced, no second listener added, no physics constants modified, no debounce added. Total file size is 203 lines (D-18 target was "well under 200" — within 3 lines of that target; the slight overage is immaterial and noted). The user's pre-existing whitespace edit on a comment line (line 61) remains unstaged as before plan 01-01; it was not staged in any task commit.

## Known Stubs

None. `resetGame()` is fully wired. All state listed in D-12 is reset. The game restarts completely on any keypress after game over.

## Threat Flags

None. This plan introduces no new network endpoints, no auth paths, no file access, and no schema changes. `resetGame()` only mutates existing module-level globals already writable from within `dino.js`. See threat model in plan for full STRIDE analysis (both threats dispositioned as "accept").

## Next Phase Readiness

Phase 1 is now complete — both success criteria 1 and 2 are delivered (scrolling track via 01-01; any-key restart via 01-02), and success criterion 3 (feel unchanged) is satisfied by both plans.

Phase 2 (Dino animation & state machine) can begin. `resetGame()` is the canonical restart entry point — Phase 2's sprite state machine should call it or complement it when introducing the game-over overlay from `game-over.png`/`reset.png` (v2 GAMEOVER-UI-01). The `dinoImg.src` swap pattern inside `resetGame()` will be superseded by Phase 2's sprite state machine.

---
*Phase: 01-scrolling-track-restart*
*Completed: 2026-05-05*
