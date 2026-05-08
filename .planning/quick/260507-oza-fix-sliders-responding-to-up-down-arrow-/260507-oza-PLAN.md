---
quick_id: 260507-oza
type: execute
description: "fix sliders responding to up/down arrow keys"
files_modified:
  - dino.js
autonomous: true
---

<objective>
Stop the speed/ramp range sliders from consuming ArrowUp/ArrowDown keypresses when focused. Native `<input type="range">` increments/decrements its value on all four arrow keys; once a user clicks a slider it captures focus, and subsequent ArrowUp jumps the dino **and** moves the slider, ArrowDown ducks the dino **and** moves the slider. The fix: `preventDefault()` on ArrowUp/ArrowDown at each slider, while letting the event bubble unchanged to the existing `document` keydown listener so the dino still jumps/ducks.

Purpose: reserve Up/Down exclusively for dino jump/duck controls per locked decision #1. Left/Right keep working on the sliders (browser default), preserving keyboard slider tuning. The document-level `moveDino` handler is untouched (locked decisions #3, #4).

Output: a single shared `blockVerticalArrows` handler attached to both sliders alongside the existing `input` listeners in `window.onload`. ~5 lines of new code in `dino.js`.
</objective>

<context>
@./CLAUDE.md
@./dino.js
@./index.html
@.planning/quick/260507-o7u-add-sliders-to-adjust-dino-speed-and-ram/260507-o7u-SUMMARY.md

<interfaces>
<!-- Existing slider wiring in dino.js (window.onload, lines 160-170). New keydown listeners attach here. -->
<!-- Module-scope refs already declared on lines 78-81 — reuse them. -->

dino.js:160-170 (current slider wiring inside window.onload — Edit goes here):
```js
    //tuning sliders — values read live in update() each frame; listeners only sync the numeric readout
    speedSlider = document.getElementById("speedSlider");
    rampSlider  = document.getElementById("rampSlider");
    speedValue  = document.getElementById("speedValue");
    rampValue   = document.getElementById("rampValue");
    let syncSpeedReadout = function() { speedValue.textContent = speedSlider.value; };
    let syncRampReadout  = function() { rampValue.textContent  = rampSlider.value;  };
    speedSlider.addEventListener("input", syncSpeedReadout);
    rampSlider.addEventListener("input", syncRampReadout);
    syncSpeedReadout(); //initial paint in case browser remembered a non-default value
    syncRampReadout();
```

dino.js:157 (existing document-level keydown listener — MUST keep firing on Up/Down):
```js
    document.addEventListener("keydown", moveDino);
```

dino.js:321-348 (`moveDino` — DO NOT modify; bug is in slider focus capture, not input handling):
```js
function moveDino(e) {
    // ... handles Space / ArrowUp (jump) and ArrowDown (duck via isDuckHeld) ...
}
```

How the fix works:
- Slider's keydown handler runs first (event capture/target phase on the slider element).
- It calls `e.preventDefault()` only for `ArrowUp` / `ArrowDown` — this cancels the slider's *default action* (incrementing/decrementing its value) but leaves event propagation intact.
- Event bubbles up to `document`, fires `moveDino(e)` as normal — dino jumps or ducks.
- ArrowLeft / ArrowRight are NOT prevented, so the slider still adjusts on horizontal arrows (and `moveDino` ignores them anyway).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Block ArrowUp/ArrowDown defaults on both sliders</name>
  <files>dino.js</files>
  <action>
Add a single shared keydown handler and attach it to both sliders inside `window.onload`. Place the new code immediately after the existing `input` listener attachments and before the initial `syncSpeedReadout()` paint call (around line 168–169) — i.e. alongside the existing slider wiring per locked decision #7.

Insert these lines after `rampSlider.addEventListener("input", syncRampReadout);` and before `syncSpeedReadout();`:

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

Strict constraints (per locked decisions):
- **Only `preventDefault()`** — do NOT call `e.stopPropagation()` or `e.stopImmediatePropagation()`. The document handler must still receive the event (D-02).
- **Only `ArrowUp` / `ArrowDown`** — do NOT also block `Tab`, `Home`, `End`, `PageUp`, `PageDown`, `Space`, or any other key (D-05). Stay surgical.
- **Do NOT modify `moveDino`** (D-03).
- **Do NOT change `document.addEventListener("keydown", moveDino)`** on line 157 (D-04).
- **Do NOT touch `index.html` or `dino.css`** (D-06). dino.js only.
- **Single shared handler** — `blockVerticalArrows` is attached to both sliders for DRY (D-07).
  </action>
  <verify>
    <automated>node -c dino.js &amp;&amp; grep -q 'blockVerticalArrows' dino.js &amp;&amp; [ "$(grep -c 'blockVerticalArrows' dino.js)" = "3" ] &amp;&amp; grep -q 'speedSlider.addEventListener("keydown", blockVerticalArrows)' dino.js &amp;&amp; grep -q 'rampSlider.addEventListener("keydown", blockVerticalArrows)' dino.js &amp;&amp; grep -q 'e.code === "ArrowUp" || e.code === "ArrowDown"' dino.js &amp;&amp; ! grep -q 'stopPropagation' dino.js &amp;&amp; ! grep -q 'stopImmediatePropagation' dino.js &amp;&amp; echo OK</automated>

Manual browser checks (after automated checks pass — open `index.html` in a browser):
1. Click `speedSlider`, press ArrowLeft and ArrowRight → slider value moves left/right as expected.
2. Click `speedSlider`, press ArrowUp → dino jumps; slider value does NOT change.
3. Click `speedSlider`, press ArrowDown → dino ducks (held while pressed); slider value does NOT change.
4. Repeat steps 1–3 with `rampSlider` focused.
5. Click the canvas (or anywhere off the sliders), press ArrowUp / ArrowDown → dino still jumps / ducks normally (baseline regression check — confirms `moveDino` is untouched and the document listener still fires).
  </verify>
  <done>
- `dino.js` declares `blockVerticalArrows` once inside `window.onload` and attaches it to both `speedSlider` and `rampSlider` via `addEventListener("keydown", ...)`.
- Handler calls only `e.preventDefault()` (no `stopPropagation`); guards exclusively on `ArrowUp` / `ArrowDown`.
- `node -c dino.js` reports no syntax errors.
- `grep -c 'blockVerticalArrows' dino.js` returns 3 (1 declaration + 2 attachments).
- `moveDino`, `document.addEventListener("keydown", moveDino)`, `index.html`, and `dino.css` are byte-identical to before this task.
- Browser sanity: focused slider + Up/Down moves dino only; focused slider + Left/Right moves slider only; unfocused (canvas-clicked) Up/Down still moves dino.
  </done>
</task>

</tasks>

<verification>
- `node -c dino.js` reports no syntax errors.
- `grep -c 'blockVerticalArrows' dino.js` returns 3.
- `grep -q 'stopPropagation' dino.js` returns nothing (handler does not stop propagation).
- `git diff -- index.html dino.css` is empty (only dino.js changed).
- `git diff dino.js` shows only the ~7-line insertion described in Task 1; `moveDino` and the document keydown registration are unchanged.
- Browser: 5-step manual checklist above all pass.
</verification>

<success_criteria>
- Up/Down arrow keys no longer adjust either slider when the slider has focus.
- Up/Down arrow keys still trigger dino jump / duck regardless of which element has focus (slider, canvas, body).
- Left/Right arrow keys still adjust slider values when focused (browser default preserved).
- No regression to `moveDino`, the document-level keydown listener, the start-gate idle behavior, or the score-driven ramp formula.
</success_criteria>

<output>
After Task 1 passes its automated `<verify>` and the user has run the 5 manual browser checks, create `.planning/quick/260507-oza-fix-sliders-responding-to-up-down-arrow-/260507-oza-SUMMARY.md` summarizing the fix (root cause, the 5-line insertion, and confirmation that `moveDino` was not touched).
</output>
