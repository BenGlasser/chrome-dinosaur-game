---
quick_id: 260507-o7u
type: summary
description: "add sliders to adjust dino speed and ramp"
status: complete  # Tasks 1-2 complete; Task 3 (human-verify) approved 2026-05-07
files_modified:
  - index.html
  - dino.css
  - dino.js
commits:
  - 767e50e  # Task 1: feat(quick-260507-o7u-01) add speed and ramp slider DOM + styling
  - 97aacbf  # Task 2: feat(quick-260507-o7u-02) wire effective velocity from sliders
---

# Quick Task 260507-o7u: Add Sliders to Adjust Dino Speed and Ramp

Two always-visible HTML range sliders (`speed` and `ramp`) sit beneath the canvas with live numeric readouts. Their values feed a single per-frame `effectiveVelocityX = -(baseSpeed + rampRate * (score / 1000))` consumed by the four world-scroll sites in `update()` (track1, track2, cactus, bird). Defaults reproduce the prior `velocityX = -4` constant exactly, so a fresh page load is feel-equivalent to the previous build.

## Status

- **Task 1 (DOM + styling):** complete, committed `767e50e`
- **Task 2 (wire effective velocity):** complete, committed `97aacbf`
- **Task 3 (human-verify checkpoint):** approved by user 2026-05-07 — all 7 browser checks passed

## Formula in Use

```js
// per-frame, computed once after the !gameStarted gate inside update():
let baseSpeed = parseFloat(speedSlider.value);
let rampRate  = parseFloat(rampSlider.value);
let effectiveVelocityX = -(baseSpeed + rampRate * (score / 1000));
```

- `baseSpeed` is the magnitude (px/frame) — the world scrolls leftward at this rate when `score = 0`.
- `rampRate` adds `rampRate` extra px/frame for every 1000 points of score. With `rampRate = 0` the world scrolls at a constant `baseSpeed`. With `rampRate = 5` and `score = 2000`, the effective rate is `4 + 5 * 2 = 14` px/frame.
- The result is negated because the world scrolls **left** while entities move right-to-left across the canvas — preserves the sign convention of the legacy `velocityX = -4`.
- Defaults `speed = 4`, `ramp = 0` evaluate to `-(4 + 0 * anything) = -4` for all scores, matching the prior build exactly.

## Files Modified

### `index.html` (Task 1)

Added a `#tuning` `<div>` directly under `<canvas id="board">`, containing two `<label>` blocks. Each label wraps an `<input type="range">` and a `<span>` readout:

| ID            | Min | Max | Step | Default |
|---------------|-----|-----|------|---------|
| `speedSlider` | 1   | 12  | 0.5  | 4       |
| `rampSlider`  | 0   | 10  | 0.1  | 0       |

Readout span IDs: `speedValue`, `rampValue`. These four IDs are the wiring contract Task 2 reads — do not rename in future work.

### `dino.css` (Task 1)

Appended a `#tuning` rule block (4 selectors total: container, label, range input, span). Existing `body` and `#board` rules untouched. Visual goal: small, inline, dim grey — visible but unobtrusive. Sliders are always shown (no toggle, no popup — locked decision #3 from the plan).

### `dino.js` (Task 2)

Three insertions, four in-place replacements, one intentional non-modification:

1. **Module-scope DOM refs** (after `let spawnSeparation = 350;`): four uninitialized `let` declarations (`speedSlider`, `rampSlider`, `speedValue`, `rampValue`). Matches the existing convention used by `board`, `context`, `track1`, `track2`.
2. **`window.onload` wiring** (just before its closing `}`): assigns the four DOM refs via `document.getElementById(...)` (no `let` — assignment to module-scope vars). Attaches `input` listeners that sync each readout's `textContent` to the slider value. Calls each sync function once for initial paint.
3. **Per-frame compute** (inside `update()`, immediately after the `!gameStarted` early-return): three lines that compute `effectiveVelocityX` from current slider state and current `score`.
4. **Four scroll-site replacements**: `track1.x`, `track2.x`, `cactus.x` (in cactus loop), `bird.x` (in bird loop) all swap `+= velocityX` for `+= effectiveVelocityX`.
5. **Legacy `let velocityX = -4;` retained** on line 64 as a documenting default — no longer read by any scroll site, but kept so the comment explaining what `-4` means stays adjacent to the value, and so the diff is minimal/reversible.
6. **`resetGame()` intentionally untouched** — slider values persist across deaths because the DOM is not reset; this is the locked "values persist" behavior from plan decision #5.

## Why It Works

- `update()` is defined at module scope and re-scheduled via `requestAnimationFrame`. By the time it first runs, `window.onload` has already assigned the four DOM refs, so the closure-style read `parseFloat(speedSlider.value)` is safe.
- The `!gameStarted` early-return runs **before** the new compute block, so the page-load idle state and the post-death idle state both read zero motion regardless of slider position. Dragging sliders before pressing Space still does nothing — the start-gate guard remains intact.
- Score-driven ramp uses **runtime** `score`, not score-at-spawn, so already-on-screen entities accelerate together with the track. This is the correct unified-world behavior — every visible thing moves at the same scroll rate every frame.
- The `input` event fires while dragging (live updates), not just on release, so the readout span tracks the thumb in real time.

## Deviations from Plan

None — Tasks 1 and 2 were executed exactly as written, using the **module-scope pattern** explicitly recommended by the plan and reinforced in the executor constraints. The legacy `velocityX` declaration stayed in place; `resetGame()` stayed unchanged.

The plan's line numbers (e.g. "line 187", "line 240") shifted slightly during editing because Task 2's Edit 1 inserted lines above them, but the executor anchored every edit on string content (the surrounding code), not on absolute line numbers, so the shifts were transparent.

## Verification Status

**Automated (passed during execution):**
- `grep -c 'effectiveVelocityX' dino.js` → 5 (1 declaration + 4 reads, as required)
- `grep -nE '\+= velocityX' dino.js` → no matches (the four scroll sites are fully migrated)
- `grep -n 'velocityX' dino.js` → 3 occurrences total: the legacy declaration on line 64 plus two new comment references explaining its retired status
- `node -c dino.js` → no syntax errors
- `git diff` confirms `resetGame()` body is byte-identical to before this task
- `index.html` contains all four required IDs (`speedSlider`, `speedValue`, `rampSlider`, `rampValue`)
- `dino.css` `#tuning` rule block present; existing `body`/`#board` rules unchanged

**Manual (pending — Task 3 checkpoint):**

The plan's 7-step browser checklist still needs to be walked by a human:
1. Defaults preserve existing feel (speed=4, ramp=0 should feel identical to pre-change)
2. Idle gate still suppresses motion before first Space press, regardless of slider position
3. Speed slider works live during play (drag 4→1 slow, 4→12 fast)
4. Ramp slider works live (set ramp=5; observe acceleration as score grows past 1000)
5. R-restart preserves slider values across the death/reset cycle
6. No console errors during normal play, drag, death, restart
7. Visual polish — sliders sit compactly, dim, no layout breakage in Chrome/Firefox

If any check fails, this summary should be updated with the failure mode and the fix commit hash before re-checkpointing.

## Open Questions for Human Verification

- Does the default feel really match the prior build? (If even slightly different, the negation/formula needs re-examination — but mathematically `-(4 + 0 * x) === -4` for all x.)
- What slider values feel right? The user previously tuned `velocityX` to `-4` because `-8` felt too fast; with the ramp now available, a base of 4 with a small ramp (e.g. 1–2) may produce a better difficulty curve than a flat 4. The user is invited to record their preferred `(speed, ramp)` pair in this section after playtesting.
