# Architecture

**Analysis Date:** 2026-05-05

## Pattern

**Single-file procedural game loop.** No classes, no modules, no event bus, no state container. All state lives as module-level `let` globals at the top of `dino.js`. All behavior is plain functions reading/writing those globals. This is deliberate — it matches the YouTube tutorial style and keeps the file readable end-to-end.

There is no abstraction layer between input, physics, rendering, and state. One file, one global namespace, one render loop, one spawn timer.

## Layers

There are no formal layers, but logically the code partitions into:

| Concern | Where it lives |
|---------|----------------|
| Bootstrapping | `window.onload` handler in `dino.js:45-74` — reads canvas, loads images, starts loops, attaches keydown |
| Render + physics tick | `update()` in `dino.js:76-108` — runs per `requestAnimationFrame` |
| Input handling | `moveDino(e)` in `dino.js:110-123` — `keydown` listener |
| Entity spawning | `placeCactus()` in `dino.js:125-160` — runs per `setInterval` (1000ms) |
| Collision detection | `detectCollision(a, b)` in `dino.js:162-167` — pure AABB function |
| State | Module-level `let` globals in `dino.js:1-43` |

## Data Flow

```
keydown ──► moveDino() ──► sets velocityY (mutates global)
                                │
setInterval(1000ms) ──► placeCactus() ──► pushes onto cactusArray (mutates global)
                                                     │
                                                     ▼
requestAnimationFrame ──► update() ──► reads dino, cactusArray, velocityY, gravity
                                       writes dino.y, cactus.x (each loop iter), score
                                       calls detectCollision per cactus
                                       calls context.drawImage(...) for each entity
                                       sets gameOver = true on collision
```

All entity state lives in two places: a single `dino` object (`dino.js:15-20`) and the `cactusArray` (`dino.js:23`). Both are read every frame, both are mutated in-place.

The render loop and the spawn timer run **independently** — `update()` does not call `placeCactus()`, and `placeCactus()` does not draw. This decoupling is important: spawn rate is wall-clock (1 cactus/sec) while motion is frame-rate-bound (8 px per frame at `velocityX = -8`). At 60 fps that's 480 px/sec scroll across a 750 px canvas.

## Abstractions

There are essentially none. Notable specifics:

- **Entity shape contract:** `detectCollision(a, b)` requires both arguments expose `{x, y, width, height}`. This is the closest thing to an interface in the codebase. Both `dino` and each cactus object satisfy this shape.
- **Image loading is fire-and-forget:** Images are constructed in `window.onload`, given a `src`, and are expected to be ready by the time `update()` first uses them. This works in practice because the cactus images are in the same directory (browser parses + decodes quickly) but is technically a race — the very first `drawImage` call for an image could no-op if the image hasn't decoded. The dino's first paint guards against this with an `onload` callback (`dino.js:58-60`); the cactus images do not.
- **The "ground" constant:** `dinoY` (`dino.js:12`) serves double duty — it's the dino's initial y *and* the ground constant used by `Math.min(dino.y + velocityY, dinoY)` (`dino.js:85`) to clamp gravity. Renaming/changing one without the other would silently break jump physics.

## Entry Points

There is exactly one entry point:

- **`index.html`** — loaded by browser. Contains a `<canvas id="board">` and `<script src="dino.js">`. The script runs at parse time, but all setup is gated behind `window.onload` (`dino.js:45`), so DOM is guaranteed ready.
- **`dino.js:45` `window.onload`** — the runtime entry. Wires everything up, then yields control to:
  - The browser's `requestAnimationFrame` scheduler (calls `update()` every frame).
  - The browser's `setInterval` scheduler (calls `placeCactus()` every 1000 ms).
  - The browser's DOM event dispatcher (calls `moveDino(e)` on `keydown`).

## Notable Architectural Properties

- **`update()` re-schedules itself unconditionally.** `requestAnimationFrame(update)` is the first line of `update()` (`dino.js:77`), called *before* the `gameOver` early-return. Consequence: after game over, `update` keeps firing, just no-ops. This is benign today but matters for any restart feature (the loop is already running, you'd just need to reset state).
- **`placeCactus` *also* runs forever.** The `setInterval` is never cleared. After game over it early-returns (`dino.js:126-128`), but the timer keeps ticking.
- **Cactus pruning is by count, not by position.** `cactusArray.shift()` runs when length > 5 (`dino.js:157-159`). At the current `velocityX = -8` and 1 spawn/sec, off-screen cacti naturally exit before the array reaches 5, so this is a safety net rather than the primary cleanup. Changing scroll speed or spawn rate could turn this into a correctness bug (cacti shifted off the array while still visible).
- **`gameOver` is one-way.** Nothing in the code resets it back to `false`. Restart requires a page reload today.

---

*Architecture analysis: 2026-05-05*
*Update after structural changes*
