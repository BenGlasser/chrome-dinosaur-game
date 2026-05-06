---
phase: 02-dino-animation-state-machine
plan: 01
subsystem: dino-animation
tags: [state-machine, sprite-animation, canvas, hitbox, run-cycle]
dependency_graph:
  requires: []
  provides:
    - dinoState string global and per-frame derivation logic
    - frameCount integer global and increment in update()
    - isDuckHeld boolean global and keyUp listener
    - six per-state sprite Image globals (dinoRun1Img, dinoRun2Img, dinoJumpImg, dinoDuck1Img, dinoDuck2Img, dinoDeadImg)
    - duck dimension globals (duckWidth, duckHeight, duckY)
    - D-17-ordered dino block in update() (state derivation, hitbox dims, gravity skip, sprite picker, draw)
    - direct dinoDeadImg same-frame draw at collision
    - resetGame() extended with animation state resets (D-19)
  affects:
    - dino.js (all sections)
    - Plans 02-02 and 02-03 (depend on this scaffolding)
tech_stack:
  added: []
  patterns:
    - Frame-counted two-frame animation via Math.floor(frameCount/6) % 2
    - Per-frame state derivation (priority order — not event-driven transitions)
    - Hitbox mutation via direct dino.{width,height,y} assignment in update()
    - Fire-and-forget sprite preloading matching cactus pattern
key_files:
  created: []
  modified:
    - path: dino.js
      note: "~76 net lines added/changed across 3 task commits (204 -> 265 lines)"
decisions:
  - "D-02 fully executed: let dinoImg global removed; no dinoImg.src references remain anywhere"
  - "D-09: frameCount++ is the first line inside update(), before requestAnimationFrame re-schedule"
  - "D-17 order enforced: state derivation -> hitbox dims -> gravity-skip-while-ducking -> sprite picker -> drawImage"
  - "D-17 gravity trap avoided: if(dinoState != 'ducking') wraps gravity; velocityY zeroed in duck branch to prevent teleport and stand-up launch"
  - "Risk 2 (dead sprite one-frame-late) resolved via option (a): direct context.drawImage(dinoDeadImg,...) at collision time; persists because subsequent frames early-return before clearRect"
  - "D-19: resetGame() extended with 4 additions, 1 removal; no dinoImg.src reference remains"
metrics:
  duration_minutes: 15
  completed_date: "2026-05-06"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 1
---

# Phase 2 Plan 1: State-Machine Scaffolding + Run Cycle (DINO-01) Summary

**One-liner:** Sprite state machine with 6 preloaded Image globals, per-frame dinoState derivation (dead/jumping/ducking/running), frame-counted run cycle at ~10 fps via Math.floor(frameCount/6)%2, and same-frame dead sprite draw at collision.

## What Was Built

Plan 02-01 establishes the Phase 2 animation foundation and delivers DINO-01 (run cycle) end-to-end:

1. **Retired dinoImg.src swap pattern (D-02):** Removed `let dinoImg` global, old `dinoImg = new Image(); onload` block in window.onload, the death-time `.src` swap in the collision branch, and the `dinoImg.src` line in resetGame(). Zero `dinoImg` references remain in dino.js.

2. **12 new module-level globals (D-22/D-23):** Six per-state sprite Images (`dinoRun1Img`, `dinoRun2Img`, `dinoJumpImg`, `dinoDuck1Img`, `dinoDuck2Img`, `dinoDeadImg`), three duck dimension constants (`duckWidth=118`, `duckHeight=60`, `duckY=boardHeight-duckHeight`), and three state vars (`dinoState="running"`, `isDuckHeld=false`, `frameCount=0`). All `let`, no `const`.

3. **Six sprite preloads in window.onload (D-01/D-05):** Fire-and-forget `new Image()` + `.src` pattern matching the existing cactus loading precedent. No per-sprite onload guard.

4. **keyup listener and keyUp(e) function (D-08):** `document.addEventListener("keyup", keyUp)` registered in window.onload alongside the existing keydown listener. `keyUp` body: `if (e.code == "ArrowDown") { isDuckHeld = false; }` — no gameOver gate so held flag flushes correctly after death.

5. **frameCount++ as first line of update() (D-09):** Advances every frame regardless of gameOver; drives the sprite cycle counter.

6. **D-17-ordered dino block in update():** Replaces the original 4-line draw block:
   - State derivation (priority: gameOver → "dead"; dino.y < dinoY → "jumping"; isDuckHeld → "ducking"; else → "running")
   - Hitbox dims (duck: width=118, height=60, y=190; else: width=88, height=94, y owned by gravity)
   - Gravity step gated on `dinoState != "ducking"` — prevents the duck-y teleport trap where `Math.min(190+v, 156)=156` would snap the dino up 34px
   - Inline sprite picker using `Math.floor(frameCount/6)%2` for run and duck cycles
   - `context.drawImage(dinoSprite, ...)` draw call

7. **Same-frame dead sprite draw at collision:** `context.drawImage(dinoDeadImg, dino.x, dino.y, dino.width, dino.height)` called immediately after `gameOver = true` in the collision branch. This is required because the next-frame `gameOver` early-return fires BEFORE clearRect, so the dead sprite drawn at collision time persists across all subsequent frames.

8. **resetGame() extended (D-19):** Added `dinoState="running"`, `isDuckHeld=false`, `frameCount=0`, `dino.width=dinoWidth`, `dino.height=dinoHeight`. Removed `dinoImg.src="./img/dino.png"` (would throw `Cannot set property 'src' of undefined` since dinoImg was deleted).

## Files Modified

- `/Users/benglasser/git/chrome-dinosaur-game/dino.js` — 204 lines before → 265 lines after (+61 lines net). Three atomic commits.

## Grep Verification Results

All 29 acceptance criteria PASSED (verified via Python-based checks after each task):

- All 12 new `let` declarations present with correct identifiers and values
- `let dinoImg` absent; zero `dinoImg.src` or `dinoImg.onload` references remain
- All 6 sprite preloads present with fire-and-forget pattern
- `document.addEventListener("keyup", keyUp)` present; exactly 2 total addEventListener calls
- `function keyUp(e)` defined with `isDuckHeld = false` body
- `frameCount++` first line inside `update()`
- `Math.floor(frameCount / 6) % 2` present in sprite picker
- `if (dinoState != "ducking")` wrapping gravity step
- `context.drawImage(dinoDeadImg` present in collision branch
- Physics constants unchanged: `velocityX = -8`, `gravity = .4`, `velocityY = -10`
- `requestAnimationFrame` appears exactly twice (top of update + window.onload)
- `function resetGame()` contains all Phase 1 resets plus 4 D-19 additions
- No `const` declarations introduced anywhere

## Manual Play-Test Path

To verify DINO-01 and the complete plan end-to-end (browser only — no test runner):

1. Open `index.html` in a browser (or `python3 -m http.server` then visit `http://localhost:8000/`).
2. **Run cycle (DINO-01):** Before pressing any key, watch the standing dino. Legs should visibly alternate between dino-run1.png and dino-run2.png at ~10 fps — reads as a run, not a strobe or slideshow.
3. **Jump (DINO-02 smoke test):** Press Space or ArrowUp. Dino jumps; sprite switches to dino-jump.png while airborne. On landing the run cycle resumes immediately.
4. **Duck (not yet active):** Press ArrowDown — the dino keeps running. Plan 02-03 wires the duck behavior into moveDino's ArrowDown branch.
5. **Dead sprite transition:** Let a cactus hit the dino. The dead-dino sprite (dino-dead.png, 88x94) appears at the dino's last position on the same collision frame and persists — no blank-dino flash.
6. **Restart:** Press any key after death. Score resets, cacti clear, run cycle resumes. Console shows no errors (specifically no `Cannot set property 'src' of undefined`).

## Deviations from Plan

None — plan executed exactly as written. All three tasks completed in order with the exact code specified in the plan.

One note: the RESEARCH.md §"Existing Code Touchpoints" #4 suggests two options for the dead-sprite problem — option (a) direct draw in collision branch (chosen, per PLAN.md) and option (b) move early-return after dino block. The plan explicitly specifies option (a), which was implemented.

## Known Stubs

- `moveDino`'s ArrowDown branch (line 198) still has an empty body — `isDuckHeld` is never set to `true` in this plan. This is intentional: Plan 02-03 wires `isDuckHeld = true` into that branch. The `isDuckHeld` flag infrastructure is in place; only the keydown setter is deferred.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are confined to local canvas rendering logic in dino.js.

## Self-Check: PASSED

- FOUND: .planning/phases/02-dino-animation-state-machine/02-01-SUMMARY.md
- FOUND: dino.js
- FOUND: 52fd242 (Task 1 commit)
- FOUND: b6502bf (Task 2 commit)
- FOUND: 322e5e8 (Task 3 commit)
