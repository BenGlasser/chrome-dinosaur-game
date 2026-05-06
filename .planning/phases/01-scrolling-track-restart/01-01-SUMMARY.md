---
phase: 01-scrolling-track-restart
plan: "01"
subsystem: rendering
tags: [track, scrolling, background, css]
dependency_graph:
  requires: []
  provides: [BG-01]
  affects: [dino.js, dino.css]
tech_stack:
  added: []
  patterns: [two-instance wrap scrolling, fire-and-forget image load, entity object literal]
key_files:
  created: []
  modified:
    - dino.js (lines 45-52 globals block, lines 80-84 window.onload init, lines 98-108 update() track block)
    - dino.css (line 7: background-color lightgray -> white)
decisions:
  - "D-01: Two-instance wrap pattern used (track1/track2 globals, wrap on right-edge <= 0)"
  - "D-02: Track reuses velocityX (-8) directly, no separate trackVelocityX"
  - "D-05: Track image loads fire-and-forget, matching cactus pattern"
  - "D-06: Track entities stored as plain object literals, NOT pushed into cactusArray"
  - "D-08: Track block placed after gameOver early-return so track halts on death"
  - "D-16: All new variables use let, no const introduced"
metrics:
  duration: "152 seconds"
  completed: "2026-05-05"
  tasks_completed: 2
  files_modified: 2
---

# Phase 01 Plan 01: Tiled Scrolling Track Render (BG-01) Summary

**One-liner:** Two-instance left-scrolling track.png strip at y=222 reusing velocityX, plus white CSS sky, replacing the flat lightgray background.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add track globals + load track image + init track1/track2 | b0df4ce | dino.js (+15 lines) |
| 2 | Insert track scroll-wrap-draw block in update() + CSS sky white | 0c96abf | dino.js (+12 lines), dino.css (1 line) |

## Files Modified

### dino.js

**Lines 45-52 (globals block, added after `let score = 0;`):**
- `let trackImg;`
- `let trackWidth = 2404;` with inline comment
- `let trackHeight = 28;` with inline comment
- `let trackX = 0;`
- `let trackY = boardHeight - trackHeight;` with inline comment (= 222)
- `let track1;`
- `let track2;`

**Lines 80-84 (window.onload, added after cactus3Img block, before requestAnimationFrame):**
- `trackImg = new Image(); trackImg.src = "./img/track.png";` (fire-and-forget)
- `track1 = { img: trackImg, x: trackX, y: trackY, width: trackWidth, height: trackHeight };`
- `track2 = { img: trackImg, x: trackX + trackWidth, y: trackY, width: trackWidth, height: trackHeight };`

**Lines 98-108 (update() body, after clearRect, before //dino block):**
- Advances track1.x and track2.x by velocityX each frame
- Wrap condition `<= 0` (not `<`) to avoid 1-pixel gap at seam
- Draws both instances via context.drawImage

### dino.css

**Line 7:** `background-color: lightgray` replaced with `background-color: white`

## Acceptance Criteria Results

### Task 1
- `node --check dino.js`: PASS (file parses)
- `let trackImg;` declared at module level: PASS
- `let trackWidth = 2404;` declared: PASS
- `let trackHeight = 28;` declared: PASS
- `let trackY = boardHeight - trackHeight;` declared: PASS
- `let track1;` and `let track2;` declared: PASS
- `trackImg = new Image();` in window.onload: PASS
- `trackImg.src = "./img/track.png";` present: PASS
- `track1 = { img: trackImg` initializer present: PASS
- `track2 = { img: trackImg` initializer present: PASS
- No `const trackImg/trackWidth/trackHeight/...` anywhere: PASS
- trackImg loading placed after cactus3Img.src, before requestAnimationFrame: PASS
- `grep -c 'requestAnimationFrame' dino.js` = 2: PASS

### Task 2
- `node --check dino.js`: PASS
- `track1.x += velocityX;` in update(): PASS
- `track2.x += velocityX;` in update(): PASS
- `if (track1.x + track1.width <= 0)` (with <=): PASS
- `if (track2.x + track2.width <= 0)` (with <=): PASS
- `context.drawImage(track1.img, ...)` present: PASS
- `context.drawImage(track2.img, ...)` present: PASS
- No `trackVelocityX` anywhere: PASS
- `background-color: white;` in dino.css: PASS
- `background-color: lightgray` fully removed: PASS
- `grep -c 'requestAnimationFrame' dino.js` = 2: PASS
- Track block positioned after clearRect and before //dino comment: PASS
- Physics constants unchanged (velocityX=-8, velocityY=0, gravity=.4, jump=-10, dinoY): PASS

## Manual Play-Test (Expected Behavior)

Open `index.html` in a browser and observe:

**ROADMAP success criterion 1 — Scrolling track:**
1. The ground strip (track.png) is visible immediately along the bottom 28px of the canvas from frame 1 — no gray band, no missing texture.
2. The track scrolls smoothly left at the same speed as cacti (both driven by `velocityX = -8`).
3. After ~5 seconds (~300 frames), no gap or 1-pixel flicker appears at the wrap seam — the `<= 0` condition prevents this.
4. The sky area (upper 222px) is white, not gray — the CSS background-color change applied.
5. On cactus collision, the track halts alongside the dino (the track block is after the `if (gameOver) { return; }` gate).

**ROADMAP success criterion 3 — Physics/collision unchanged:**
1. Jump height, airtime, and gravity feel identical to pre-plan (no physics constants touched).
2. Cactus collision fires `gameOver = true` and swaps the dead sprite as before.
3. Score increments at the same rate as before (score++ per frame unchanged).
4. Dino and cacti render at correct positions relative to the new track strip (track Y = 222; dino Y = boardHeight - dinoHeight = 156; cactus Y = boardHeight - cactusHeight = 180 — all remain above the track strip visually).

Note: ROADMAP success criterion 2 (any-key restart) is delivered by plan 01-02, not this plan.

## Known Stubs

None. This plan delivers complete, wired track rendering. No placeholder data, no hardcoded empty values flow to the UI. The track draws from `track.png` which exists at `img/track.png`.

## Deviations from Plan

None — plan executed exactly as written. All decisions D-01 through D-18 honored. No `const` introduced, no physics constants modified, no module refactor, file remains 194 lines (well under D-18's 200-line limit).

Pre-existing whitespace change in dino.js (line 61: `//draw initial dinosaur` → `// draw initial dinosaur`) was present in the working tree before this plan executed. It was intentionally excluded from both task commits using selective hunk staging (`git add -p`). It remains as an unstaged modification for the user to handle.

## Threat Flags

None. This plan introduces no new network endpoints, no auth paths, no file access patterns beyond a static image load matching the existing cactus image pattern, and no schema changes.

## Self-Check: PASSED

- `/Users/benglasser/git/chrome-dinosaur-game/dino.js`: FOUND (194 lines)
- `/Users/benglasser/git/chrome-dinosaur-game/dino.css`: FOUND (9 lines, background-color: white)
- Commit b0df4ce: FOUND (Task 1)
- Commit 0c96abf: FOUND (Task 2)
