---
phase: 01-scrolling-track-restart
verified: 2026-05-05T00:00:00Z
status: human_needed
score: 3/3 must-haves verified (automated)
overrides_applied: 0
human_verification:
  - test: "Open index.html in a browser. Confirm the track.png strip is visible at the bottom of the canvas from frame 1 (no gray band, no missing texture), scrolls left smoothly at the same speed as cacti, and shows no gap or 1-pixel flicker at the wrap seam after 5+ seconds of play."
    expected: "Continuous, seamless left-scroll of the track strip at velocityX=-8. Upper canvas area (sky) is white."
    why_human: "Canvas rendering and pixel-level seam correctness cannot be verified by grep. The wrap condition (<= 0) is correct in code, but actual frame rendering requires visual confirmation."
  - test: "Play until the dino collides with a cactus (game-over). Press Space — confirm game resumes immediately with dino.png sprite at ground level, score=0, all cacti cleared. Repeat with ArrowUp, then a letter key (e.g. 'a'). Repeat the die-and-restart loop for at least 3 cycles."
    expected: "Any keypress after death restarts the run without a page reload. No console errors. Track continues scrolling (track positions are not reset). New cacti spawn within 0-1000 ms."
    why_human: "State-reset correctness and loop stability across multiple restart cycles requires live game execution."
  - test: "Verify the overall game feel is unchanged: jump height, airtime, gravity, cactus collision trigger, and score increment rate all match the pre-phase build."
    expected: "Physics constants (velocityX=-8, gravity=0.4, jump velocityY=-10, dinoY=boardHeight-dinoHeight) produce identical feel. Collision still triggers dead-sprite swap and scroll halt."
    why_human: "Subjective feel comparison and timing of the score counter require human observation during play."
---

# Phase 1: Scrolling Track & Restart — Verification Report

**Phase Goal:** Replace the flat lightgray canvas background with a tiled, scrolling `track.png`, and let the player restart with a keypress after game over (no page reload).
**Verified:** 2026-05-05
**Status:** human_needed
**Re-verification:** No — initial verification

All automated checks pass. Three browser play-test items remain for human confirmation.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | While the game is running, the ground visibly scrolls left as a tiled sequence of track.png (no gap, no jitter). | VERIFIED (automated) / NEEDS HUMAN (visual) | `track1.x += velocityX` and `track2.x += velocityX` at lines 99-100; wrap condition `<= 0` at lines 101, 104 (correct operator per RESEARCH pitfall 3); `context.drawImage(track1.img, ...)` and `context.drawImage(track2.img, ...)` at lines 107-108; block positioned after `clearRect` (line 96) and before `//dino` (line 110). `img/track.png` asset confirmed present. |
| 2 | After the dino dies, pressing any key clears the cacti, resets the score and dino state, and starts a new run without reloading the page. | VERIFIED (automated) | `function resetGame()` at line 190 contains all 6 D-12 reset statements in canonical order. `moveDino()` at line 138-141: `if (gameOver) { resetGame(); return; }` — any key triggers reset, no key filtering. Single `document.addEventListener("keydown", moveDino)` confirmed (`grep -c 'document.addEventListener' dino.js` = 1). No `clearInterval`, no new RAF call, no debounce. |
| 3 | The game's overall feel — physics, collision, score increment — remains unchanged from before this phase. | VERIFIED (automated) / NEEDS HUMAN (feel) | `let velocityX = -8` (line 38), `let velocityY = 0` (line 39), `let gravity = .4` (line 40), `velocityY = -10` jump assignment (line 145), `let dinoY = boardHeight - dinoHeight` (line 12) — all unchanged. No `const` introduced (one grep match for "const" at line 186 is inside the word "constantly" in a comment, not a declaration). `requestAnimationFrame` count = 2 (unchanged). |

**Score:** 3/3 truths have automated evidence; 3/3 require browser confirmation for visual/behavioral aspects.

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `dino.js` — track globals | `let trackImg`, `let trackWidth = 2404`, `let trackHeight = 28`, `let trackX = 0`, `let trackY = boardHeight - trackHeight`, `let track1`, `let track2` | VERIFIED | Lines 46-52. All declared at module level with `let`, no `const`. |
| `dino.js` — window.onload init | `trackImg = new Image()`, `trackImg.src = "./img/track.png"`, `track1 = { img: trackImg, x: trackX, ... }`, `track2 = { img: trackImg, x: trackX + trackWidth, ... }` | VERIFIED | Lines 80-84. Placed after `cactus3Img.src` (line 78) and before `requestAnimationFrame(update)` (line 86). |
| `dino.js` — update() track block | Scroll+wrap+draw after `clearRect`, before `//dino` block | VERIFIED | Lines 98-108. Block structure: advance both `x` by `velocityX`, wrap each on `<= 0`, draw both. Positioned correctly in update() flow. |
| `dino.js` — resetGame() function | 6-statement D-12 reset; between `placeCactus` and `detectCollision` | VERIFIED | Lines 190-197. All 6 statements present in canonical order (`gameOver`, `score`, `cactusArray`, `velocityY`, `dino.y`, `dinoImg.src`). Function order: `placeCactus` (153) < `resetGame` (190) < `detectCollision` (199). |
| `dino.js` — moveDino() restart branch | `if (gameOver) { resetGame(); return; }` | VERIFIED | Lines 138-141. No key filtering (any key triggers). `return` after `resetGame()` prevents fall-through to jump branch. |
| `dino.css` — background-color | `background-color: white` (not `lightgray`) | VERIFIED | Line 7. `lightgray` not found anywhere in dino.css. `border-bottom: 1px solid black` preserved. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `update()` | `track1`, `track2` globals | `track1.x += velocityX` per frame, wrap on `<= 0`, `context.drawImage` | VERIFIED | Lines 99-108. Both entities advanced and drawn every non-game-over frame. |
| `update()` track block | `velocityX` (existing global) | Direct read — no parallel `trackVelocityX` | VERIFIED | Line 99-100 use `velocityX` directly. `trackVelocityX` not found anywhere in file. |
| `window.onload` | `trackImg`, `track1`, `track2` | `new Image()` + `.src` + object literal init | VERIFIED | Lines 80-84. Fire-and-forget pattern matching cactus images. |
| `moveDino()` | `resetGame()` | `if (gameOver) { resetGame(); return; }` | VERIFIED | Line 139. Single call site, no second listener. |
| `resetGame()` | module-level globals | Direct reassignment of all 6 D-12 items | VERIFIED | Lines 191-196. All globals written; track positions (`track1.x`, `track2.x`) correctly excluded. |
| `resetGame()` | `dinoImg.src` | `dinoImg.src = "./img/dino.png"` | VERIFIED | Line 196. Undoes the `dino-dead.png` swap from line 123. |

---

## Data-Flow Trace (Level 4)

Track and restart are rendering/state artifacts, not data-fetching components. The data sources are:

- `track1.img` / `track2.img`: point to `trackImg` (a browser `Image` object loaded from `./img/track.png`). Asset confirmed present at `img/track.png`. Flow: `trackImg.src = "./img/track.png"` (line 81) → `track1.img = trackImg` (line 83) → `context.drawImage(track1.img, ...)` (line 107). FLOWING.
- `resetGame()` state writes: all target existing module-level globals (not a data source). WIRED.
- No static returns, no empty arrays flowing to rendering. The `//duck` placeholder in `moveDino()` (line 148) is a pre-existing stub from before this phase and does not affect phase 1 functionality.

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `dino.js` parses without errors | `node --check dino.js` | exit 0 | PASS |
| `resetGame` function exported to global scope (callable post-game-over) | `grep -c 'function resetGame' dino.js` | 1 | PASS |
| Single keydown listener | `grep -c 'document.addEventListener' dino.js` | 1 | PASS |
| RAF count unchanged | `grep -c 'requestAnimationFrame' dino.js` | 2 | PASS |
| Live browser rendering of track / restart loop | browser required | N/A | SKIP — needs human |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BG-01 | 01-01 | Ground rendered as tiled track.png scrolling left at cactus speed, replacing flat lightgray background | SATISFIED | Track globals declared; `window.onload` loads `track.png` and initializes `track1`/`track2`; `update()` scrolls both by `velocityX` and draws them after `clearRect`; `dino.css` background is `white`. |
| RESTART-01 | 01-02 | After game-over, any keypress resets state and starts a new run without page reload | SATISFIED | `resetGame()` performs all 6 D-12 resets; wired into `moveDino()` on `gameOver` branch with no key filtering; no second listener; no `clearInterval`; state-flip is sufficient because both loops self-perpetuate. |

No orphaned requirements for Phase 1 found in REQUIREMENTS.md. Both BG-01 and RESTART-01 are marked complete in the traceability table.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `dino.js` | 148 | `else if (e.code == "ArrowDown" && dino.y == dinoY) { //duck }` — empty body | Info | Pre-existing stub from before this phase. Phase 2 owns ducking (DINO-03/DINO-04). Does not affect phase 1 functionality. |
| `dino.js` | — | File is 203 lines; D-18 target was "well under 200" | Info | 3 lines over the informal target. Immaterial — the constraint was a guideline, not a hard limit. No functional impact. |

No blockers. No new stubs introduced by this phase. The ArrowDown placeholder and line-count note are pre-existing / negligible.

---

## Human Verification Required

### 1. Track scrolling — visual and seam check

**Test:** Open `index.html` in a browser (or `python3 -m http.server` + `http://localhost:8000`). Start the game and watch the ground strip.
**Expected:** The bottom 28px of the canvas shows `track.png` scrolling left continuously. The upper area (sky) is white. After approximately 5 seconds (~300 frames at 60 fps), no visible gap, stutter, or 1-pixel flicker appears at the wrap seam. The track halts when the dino hits a cactus (game-over state).
**Why human:** Canvas pixel rendering and seam continuity at the wrap point require visual inspection during live play. The wrap operator (`<= 0` vs `< 0`) is correct in code, but the resulting frame appearance can only be confirmed by a human.

### 2. Any-key restart — functional correctness

**Test:** Play until the dino collides with a cactus. Dead-sprite appears, scroll halts. Press `Space` — confirm the run resumes (running dino sprite, score=0, cacti cleared, track still scrolling). Die again, press `ArrowUp` — same result. Die again, press a letter key (e.g. `a`) — same result. Repeat the die-and-restart loop for at least 3 full cycles.
**Expected:** Every keypress after game-over immediately restarts the run. No page reload. No console errors. New cacti spawn within 0-1000 ms after restart. Track continues scrolling seamlessly across restart.
**Why human:** State reset correctness, sprite swap timing, loop stability across multiple restart cycles, and absence of console errors all require live game execution.

### 3. Game feel unchanged — physics and collision

**Test:** Play through a normal run before and after this phase, or compare against the pre-phase build. Observe jump arc, apex height, fall speed, cactus collision trigger, and score increment rate.
**Expected:** Jump feel is identical. Cactus collision still triggers game-over (dead sprite appears, scroll stops, score freezes). Score increments at the same per-frame rate as before. Dino and cactus positions look correct relative to the new track strip.
**Why human:** Subjective physics feel and timing comparisons require human play-testing against the original experience.

---

## Gaps Summary

No automated gaps found. All must-haves are verified programmatically. The three items in the human verification section are standard browser play-test confirmations for a canvas game with no test suite — they are not gaps in the implementation, but necessary checks that cannot be done programmatically.

---

_Verified: 2026-05-05T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
