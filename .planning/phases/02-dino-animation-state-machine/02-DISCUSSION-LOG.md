# Phase 2: Dino animation & state machine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-06
**Phase:** 2-dino-animation-state-machine
**Mode:** `--auto` (recommended defaults selected without interactive prompts)
**Areas discussed:** Sprite handling, State machine, Animation timing, Hitbox change, Input handling, resetGame integration

---

## Sprite handling refactor

| Option | Description | Selected |
|--------|-------------|----------|
| One `Image` object per sprite, pre-loaded | Six globals: `dinoRun1Img`..`dinoDeadImg`; pick one per state per frame | ✓ (recommended) |
| Single `Image` with `.src` swap | Continue today's pattern; swap `.src` on state change | |
| Single sprite atlas + offset blits | One PNG, draw sub-rects via `drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)` | |

**[auto] Selected:** Per-sprite `Image` objects.
**Notes:** Eliminates the documented `dinoImg.src` swap race (CONCERNS.md §3). Atlas-based is overkill at six small sprites with no reuse pressure.

---

## State machine representation

| Option | Description | Selected |
|--------|-------------|----------|
| String variable: `dinoState = "running" \| "jumping" \| "ducking" \| "dead"` | One module-level `let`; assigned by per-frame derivation | ✓ (recommended) |
| Multiple booleans: `isJumping`, `isDucking`, `isDead` | Several flags; harder to keep mutually exclusive | |
| Formal state-machine object with transition table | Class or object literal with explicit transitions | |

**[auto] Selected:** String variable.
**Notes:** Tutorial-style readability. State derivation is recomputed every frame (D-06) — no transition events.

---

## Animation timing

| Option | Description | Selected |
|--------|-------------|----------|
| Module-level frame counter incremented in `update()`; sprite = `(floor(count/6) % 2 == 0) ? a : b` | Frame-rate-coupled animation; simplest | ✓ (recommended) |
| `Date.now()` modulo timing | Wall-clock-coupled animation | |
| `setInterval` for sprite swaps | Separate timer for animation cycle | |

**[auto] Selected:** Frame counter.
**Notes:** Couples animation tempo to gameplay tempo (correct on backgrounded tabs). 6 frames ≈ 10 fps at 60 Hz, matching DINO-01 ("~10 fps").

---

| Option | Description | Selected |
|--------|-------------|----------|
| Same interval (6 frames) for run AND duck | DINO-03 says "at the same rate as the run cycle" | ✓ (recommended) |
| Separate constants for run vs duck rate | Tunable independently | |

**[auto] Selected:** Shared interval.
**Notes:** DINO-03 explicitly couples the two rates.

---

## Hitbox change while ducking (DINO-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Mutate `dino.width`, `dino.height`, `dino.y` on duck enter/exit | Preserves entity-shape contract; `detectCollision` unchanged | ✓ (recommended) |
| Maintain two hitbox objects, pick in `detectCollision` | Adds branching to collision; more code paths | |
| Per-frame width swap matching duck1=118 / duck2=116 | Exact sprite alignment but introduces 2px collision-edge jitter | |

**[auto] Selected:** Mutate `dino` entity dims.
**Notes:** `duckWidth = 118`, `duckHeight = 60`, `duckY = boardHeight - duckHeight`. The 2px duck1/duck2 sprite-width difference is frozen at 118 to avoid jitter.

---

## Input handling

| Option | Description | Selected |
|--------|-------------|----------|
| Add `keyup` listener with new `keyUp(e)` handler; track `isDuckHeld` | Phase 1 D-10 forbade parallel `keydown`; `keyup` is a different event and is fine | ✓ (recommended) |
| Use `event.repeat` heuristic on existing `keydown` | Browser-variable; fragile | |
| Tap-to-duck with timeout | Bad feel; doesn't match Chrome dino | |

**[auto] Selected:** `keyup` listener with `isDuckHeld` flag.
**Notes:** Symmetric with `keydown`; explicit; portable.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Drop the `dino.y == dinoY` ground gate from the ArrowDown branch in `moveDino()` | Set `isDuckHeld` eagerly; state-derivation gates "actually ducking" on ground | ✓ (recommended) |
| Keep the ground gate; only set `isDuckHeld` when on ground | Strict but means landing-mid-press feels unresponsive | |

**[auto] Selected:** Drop the gate.
**Notes:** Lets the player pre-commit to ducking before landing. State-derivation in `update()` gates the actual transition.

---

## Death-state handling

| Option | Description | Selected |
|--------|-------------|----------|
| State machine derives "dead" from `gameOver`; sprite picker picks `dinoDeadImg` | One uniform pattern; eliminates `dinoImg.src` swap entirely | ✓ (recommended) |
| Keep `dinoImg.src = "./img/dino-dead.png"` swap on collision | Preserves existing behavior; doesn't fix the documented race | |

**[auto] Selected:** State-machine death.
**Notes:** Removes the only remaining `.src`-swap site, fully retiring the pattern flagged in CONCERNS.md §3.

---

## `resetGame()` evolution

| Option | Description | Selected |
|--------|-------------|----------|
| Extend Phase 1's `resetGame()`: add `dinoState`, `isDuckHeld`, `frameCount`, restore standing hitbox; remove `dinoImg.src` line | Builds on Phase 1 D-12; no `resetGame()` rewrite | ✓ (recommended) |
| Replace the function entirely with a state-machine reset method | Bigger surface change; not warranted | |

**[auto] Selected:** Extend.
**Notes:** Phase 1 D-19 is the canonical reset list; Phase 2 grows it with state-machine fields.

---

## Code style

| Option | Description | Selected |
|--------|-------------|----------|
| Tutorial-style `let` globals; flat functions; single file | Match existing convention | ✓ (recommended) |
| Refactor dino into a class | Premature; PROJECT.md and Phase 1 both lock against this | |

**[auto] Selected:** Tutorial style.

---

## Claude's Discretion

- Identifier casing (`dinoRun1Img` vs `runImg1`).
- Sprite-picker as inline if/else chain or tiny helper function.
- Gravity-skip-while-ducking pattern (`if (state != "ducking") {...}` vs always-run-but-skip-y-assign).
- Whether `keyUp` is a named function or inline arrow.
- Order of sprite preloads in `window.onload`.

## Deferred Ideas

Captured in CONTEXT.md `<deferred>` for downstream visibility:

- Fast-fall while airborne+ArrowDown.
- Animated dead-sprite cycle.
- Per-frame-accurate hitbox tracking duck1=118 vs duck2=116.
- Refactoring `update()` into per-entity update/draw passes.
- Sprite atlas / spritesheet.
- Pre-decoded sprite loading via `Image.decode()` Promises.
- Formal state-machine class with transitions.
- Configurable animation rate constant.
