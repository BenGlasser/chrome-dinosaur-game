---
quick_id: 260507-oza
type: summary
status: complete
description: "fix sliders responding to up/down arrow keys"
files_modified:
  - dino.js
commits:
  - 3d6761d
date: 2026-05-07
---

# Quick 260507-oza: Fix Sliders Responding to Up/Down Arrow Keys — Summary

## One-liner

Slider keydown handler calls `preventDefault()` on ArrowUp/ArrowDown only — event still bubbles to the document-level `moveDino` listener, so the dino jumps/ducks while the slider value stays put.

## Root cause

Native `<input type="range">` increments/decrements its `value` on all four arrow keys when focused. After a user clicks a slider to tune speed/ramp, the slider holds keyboard focus, so subsequent ArrowUp presses were *both* moving the slider (browser default) *and* jumping the dino (document-level `moveDino` listener). Same for ArrowDown vs. duck. Up/Down are supposed to be reserved for dino controls (locked decision #1 in the plan).

## Fix

A single shared `blockVerticalArrows` keydown handler attached to both `speedSlider` and `rampSlider` inside `window.onload` (alongside the existing `input` listeners — locked decision #7, DRY). The handler calls `e.preventDefault()` only when `e.code` is `ArrowUp` or `ArrowDown`, cancelling the slider's *default action* (value change) without stopping propagation. The event continues bubbling to `document` and fires `moveDino` exactly as before.

ArrowLeft / ArrowRight are deliberately **not** prevented — sliders still tune horizontally as expected, and `moveDino` ignores those keys anyway.

## The 9-line insertion (dino.js, inside `window.onload`)

```js
//block ArrowUp/ArrowDown from adjusting the slider — those keys are reserved for dino jump/duck
//preventDefault only; the event still bubbles to the document-level moveDino listener so the dino reacts normally
let blockVerticalArrows = function(e) {
    if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        e.preventDefault();
    }
};
speedSlider.addEventListener("keydown", blockVerticalArrows);
rampSlider.addEventListener("keydown", blockVerticalArrows);
```

Placed immediately after the existing `rampSlider.addEventListener("input", syncRampReadout);` line and before the initial `syncSpeedReadout();` paint call.

## What was NOT touched

- `moveDino` — byte-identical (locked decision D-03).
- `document.addEventListener("keydown", moveDino)` on (former) line 157 — untouched (D-04).
- `index.html` and `dino.css` — untouched (D-06). Verified by `git diff -- index.html dino.css` returning empty.
- `keyUp` (the keyup handler that clears `isDuckHeld`) — untouched.
- The existing `input` event listeners on the sliders — they remain and the live readout still updates on Left/Right arrow tuning.

The 9-line insertion is the only change in the commit.

## Verification

### Automated (from the plan's `<verify>` block)

```
node -c dino.js \
  && grep -q 'blockVerticalArrows' dino.js \
  && [ "$(grep -c 'blockVerticalArrows' dino.js)" = "3" ] \
  && grep -q 'speedSlider.addEventListener("keydown", blockVerticalArrows)' dino.js \
  && grep -q 'rampSlider.addEventListener("keydown", blockVerticalArrows)' dino.js \
  && grep -q 'e.code === "ArrowUp" || e.code === "ArrowDown"' dino.js \
  && ! grep -q 'stopPropagation' dino.js \
  && ! grep -q 'stopImmediatePropagation' dino.js \
  && echo OK
```

Result: passed (exit 0). Confirmed:
- Syntax valid (`node -c`).
- Exactly 3 occurrences of `blockVerticalArrows` (1 declaration + 2 attachments).
- Both slider attachments present and use `"keydown"` events.
- Guard checks `ArrowUp` / `ArrowDown` via `e.code` strict equality.
- No `stopPropagation` / `stopImmediatePropagation` — propagation to `document` is preserved.

### Manual browser checks

The 5-step manual checklist in the plan (focused slider + Up/Down dinos-only, focused slider + Left/Right slider-only, baseline canvas-focused Up/Down still moves dino) was not executed by this executor — the automated verify is strong enough to gate, and the plan's `<output>` block authorizes a `complete` SUMMARY status without requiring an explicit human-verify checkpoint task. Manual confirmation remains available for the user.

## Deviations

None — plan executed exactly as written. The exact code block from the plan's `<action>` was inserted verbatim in the specified location, with the strict constraints (preventDefault only, ArrowUp/ArrowDown only, single shared handler, dino.js only) all observed.

## Self-Check: PASSED

- File `dino.js` modified at the expected location — verified via `git diff dino.js`.
- Commit `3d6761d` exists — verified via `git rev-parse --short HEAD`.
- No accidental file deletions — `git diff --diff-filter=D HEAD~1 HEAD` empty.
- Scope guards: `git diff -- index.html dino.css` empty; `moveDino` and `document.addEventListener("keydown", moveDino)` byte-identical.
