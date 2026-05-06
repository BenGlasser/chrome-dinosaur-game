# Phase 1: Scrolling track & restart - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 1-scrolling-track-restart
**Mode:** `--auto` (recommended defaults selected without interactive prompts)
**Areas discussed:** Track rendering, Restart behavior, Code style

---

## Track rendering

| Option | Description | Selected |
|--------|-------------|----------|
| Two-instance scrolling pattern | Two `track` objects drawn each frame; reset x to right of partner when off-screen left | ✓ (recommended) |
| `ctx.createPattern()` + translate | Canvas-idiomatic pattern fill with matrix translation | |
| Single-image with modulo math | One image drawn N times via offset math each frame | |

**[auto] Selected:** Two-instance scrolling pattern (recommended default).
**Notes:** Matches the existing tutorial-style procedural code; readable without canvas-pattern fluency.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse `velocityX` (-8) | Track scrolls at the same speed as cacti — single source of truth | ✓ (recommended) |
| Introduce `trackVelocityX` parallel | Separate constant for track speed | |

**[auto] Selected:** Reuse `velocityX`.
**Notes:** A parallel constant could drift out of sync silently; the world looks broken if track ≠ cactus speed.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom-aligned (`y = boardHeight - trackHeight`) | Track sits where the dino/cactus stand | ✓ (recommended) |
| Mid-canvas | Floating ground band | |
| Custom y offset | Tunable per design | |

**[auto] Selected:** Bottom-aligned.
**Notes:** Keeps the dino's existing ground constant (`dinoY`) untouched.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Match cactus image-loading pattern (no `onload` guard) | Fire-and-forget; image decodes by first frame in practice | ✓ (recommended) |
| Add `onload` guard for first-frame paint | Mirror the dino's initial-paint pattern | |
| Promise-based `decode()` | `await trackImg.decode()` before starting RAF | |

**[auto] Selected:** Match cactus pattern.
**Notes:** Tutorial-style consistency. If a real first-frame race surfaces, revisit.

---

## Restart behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Any key (`keydown`) | Matches RESTART-01 and original Chrome dino | ✓ (recommended) |
| Specific key (Space only) | Narrow trigger | |
| UI button (`reset.png`) | Visible click target | |

**[auto] Selected:** Any key.
**Notes:** PROJECT.md defers UI button to v2 (`GAMEOVER-UI-01`).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse `moveDino(e)` listener | Replace the gameOver early-return with a restart branch | ✓ (recommended) |
| Add a separate `keydown` listener for restart | Two listeners on `document` | |

**[auto] Selected:** Reuse the existing handler.
**Notes:** One listener, one early branch — fewer moving parts than parallel handlers.

---

| Option | Description | Selected |
|--------|-------------|----------|
| No debounce / cooldown | First key after game over restarts immediately | ✓ (recommended) |
| Short delay (e.g., 500ms grace period) | Prevents accidental restart from buffered keypress | |

**[auto] Selected:** No debounce.
**Notes:** Matches Chrome dino feel. If players complain about accidental restarts, revisit.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Don't touch RAF / setInterval; just flip `gameOver = false` and reset state | Loops already self-perpetuate and early-return on gameOver | ✓ (recommended) |
| Cancel + restart `requestAnimationFrame` | Treat restart as a fresh game session | |
| `clearInterval` + new `setInterval` for `placeCactus` | Reset spawn-cycle phase | |

**[auto] Selected:** Don't touch the loops.
**Notes:** Documented behavior of the existing architecture. Cleaner than re-arming timers. Side-effect: cactus spawn phase isn't reset (up to 1s of "dead time" possible after restart) — acceptable; flagged in CONTEXT.md deferred.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Reset {gameOver, score, cactusArray, velocityY, dino.y, dinoImg.src} | Full canonical reset | ✓ (recommended) |
| Reset gameplay state but skip `dinoImg.src` swap-back | Rely on the dead sprite resetting itself | |
| Reset everything including track positions | Defensive | |

**[auto] Selected:** The canonical reset list (D-12).
**Notes:** Track positions don't need resetting — wrap math handles them. Skipping `dinoImg.src` swap-back would leave the dead sprite onscreen.

---

## Code style

| Option | Description | Selected |
|--------|-------------|----------|
| Module-level `let` globals + plain functions (tutorial style) | Match existing code | ✓ (recommended) |
| Refactor to a small `Game` class or module | Introduce structure ahead of Phase 2's complexity | |

**[auto] Selected:** Tutorial style.
**Notes:** PROJECT.md explicitly defers structural refactors out of v1.0.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Named `resetGame()` function | One named, discoverable place for the reset list | ✓ (recommended) |
| Inline reset inside `moveDino` | Smallest diff, but harder to find | |

**[auto] Selected:** Named `resetGame()`.
**Notes:** Phase 2 may want to call the reset from another path (state-machine reset, future game-over UI button).

---

## Claude's Discretion

- Exact identifier names for new vars (`track1`/`trackA`, `trackImg`/`trackImage`).
- Whether the wrap math lives inline in `update()` or in a helper (`scrollAndWrap(track)`).
- Order of `resetGame()` relative to the other top-level functions in `dino.js`.

## Deferred Ideas

Captured in CONTEXT.md `<deferred>` for downstream visibility:

- Pre-decode track via `onload` or `decode()` if a real first-frame race surfaces.
- Game-over overlay / "Press any key" UI (v2 `GAMEOVER-UI-01`).
- Score frame-rate independence (CONCERNS.md latent bug #2).
- Cloud parallax (v2 `PARALLAX-01`).
- Cactus-array pruning correctness when scroll speed changes (CONCERNS.md latent bug #1) — only relevant for a future difficulty-scaling phase.
- Refactor of dino sprite handling into a state machine — Phase 2 owns it.
- Resetting the `placeCactus` 1 Hz interval phase on restart, if "dead time" feels bad in playtest.
