# Phase 3: Bird obstacles - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-06
**Phase:** 3-bird-obstacles
**Mode:** `--auto` (no interactive prompts; recommended defaults selected)
**Areas discussed:** Entity model & array, Spawn mechanism & cadence, Discrete heights, Hitbox & sprite size, Animation flap rate, Collision integration, Pruning, Reset behavior

---

## Entity model & array structure

| Option | Description | Selected |
|--------|-------------|----------|
| Separate `birdArray` parallel to `cactusArray` | Each entity type in its own array; mirrors existing tutorial-flat structure (Phase 2 D-23 locks "no architectural restructuring") | ✓ |
| Unified `obstacleArray` with `type` field | Single array; one collision loop with type-aware drawing | |
| Class hierarchy with shared base | Object-oriented approach with `Bird extends Obstacle` | |

**Selected:** Separate `birdArray` (recommended default)
**Notes:** Unifying would be a refactor masquerading as a feature. Two near-identical loops in flat tutorial style is the established Phase 1/2 pattern (track-loop, cactus-loop) — the bird loop is the third sibling.

---

## Spawn mechanism & cadence

| Option | Description | Selected |
|--------|-------------|----------|
| Separate `setInterval(placeBird, 1500)` | New parallel timer; slower than cactus 1Hz to avoid double-spawn density | ✓ |
| Extend `placeCactus` with bird probability | One timer rolls for cacti OR birds | |
| Unified `placeObstacle` timer | Single function picks any obstacle type | |

**Selected:** Separate timer at 1500ms (recommended default)
**Notes:** Spawn-rate decoupling means bird/cactus tuning is independent. Mirrors the existing pattern where `requestAnimationFrame(update)` and `setInterval(placeCactus, 1000)` run independently.

---

## Discrete heights (BIRD-03)

| Option | Description | Selected |
|--------|-------------|----------|
| 2 heights (low must-duck + high stand-or-jump) | Minimum BIRD-03 spec; simplest learning curve | |
| 3 heights (low must-duck + mid must-jump + high stand) | Richer Chrome-dino-like variety; demands all three states (duck/jump/stand) | ✓ |
| 4+ heights (continuous range) | Hardest to make readable; varying difficulty with no clear discrete steps | |

**Selected:** 3 heights with concrete y-values: `birdLowY = 110`, `birdMidY = 156`, `birdHighY = 50`
**Notes:** Mid height (y=156) creates a "must jump" obstacle — ducking still hits because bird body extends to y=224, overlapping ducking dino at 190-224. Math grounded in Phase 2 D-14 duck dims and CONCERNS.md jump apex y≈31.

---

## Hitbox & sprite size

| Option | Description | Selected |
|--------|-------------|----------|
| Canonical 97×68 hitbox (bird1 dims) for both render and collision | Eliminates per-frame collision-edge jitter; matches Phase 2 D-14 duck pattern | ✓ |
| Per-frame native dims (97×68 for bird1, 93×62 for bird2) | Visually accurate but introduces flap-rate hitbox jitter | |
| Tighter pixel-accurate hitbox | Trim transparent pixels for "fairer" collisions | |

**Selected:** Canonical 97×68 (recommended default)
**Notes:** 4×6 px variation across the flap cycle is below perception. Same call as Phase 2 D-14 (duck1=118 vs duck2=116, used 118 canonically).

---

## Animation flap rate (BIRD-02)

| Option | Description | Selected |
|--------|-------------|----------|
| 6-frame swap (~10 fps, same as dino) | Matches dino exactly; FAILS BIRD-02 "distinct rate" | |
| 12-frame swap (~5 fps) | Half dino rate; reads as slow heavy wing flap | ✓ |
| 4-frame swap (~15 fps) | Faster than dino; reads as nervous small-bird flutter | |
| 24-frame swap (~2.5 fps) | Very slow; could read as gliding | |

**Selected:** 12-frame swap (recommended default)
**Notes:** REQUIREMENTS.md BIRD-02 demands "distinct" rate; halving the dino's 6-frame interval gives unmistakable distinction while reading as natural slow wing flapping for a big-winged sprite.

---

## Collision integration (BIRD-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Separate bird loop after cactus loop in `update()` | Mirror cactus loop verbatim; shared `gameOver = true` + same-frame dead paint | ✓ |
| Refactor cactus loop to be obstacle-agnostic | Extract a `processObstacle()` helper used by both | |
| Combine cacti and birds into one loop | Iterate a unified array | |

**Selected:** Separate bird loop after cactus loop (recommended default)
**Notes:** Bird loop runs AFTER cactus loop so birds paint on top in any visual overlap (defensive — they don't currently overlap given y-range separation). Same-frame dead-paint pattern matches `dino.js:174-178`.

---

## Pruning

| Option | Description | Selected |
|--------|-------------|----------|
| `birdArray.shift()` when length > 5 | Mirrors cactus precedent; simple | ✓ |
| Position-based pruning (`bird.x + bird.width < 0`) | Correct under any scroll speed; more code | |
| No pruning (let array grow) | Cleanest code; potential memory creep over very long sessions | |

**Selected:** Length-cap pruning (recommended default)
**Notes:** Inherits CONCERNS.md Latent Bug #1 (correctness if scroll speed changes). At current speed and cadence, array reaches length 1-2 in practice. Flagged for future difficulty-scaling phase.

---

## Reset behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Add `birdArray = []` to `resetGame()` | One-line extension of Phase 1's reset list | ✓ |
| Reset bird-related state (no other state exists) | Same as above; no other globals need reset | |
| Cancel and re-create the spawn timer | Force-resync spawn cadence on restart | |

**Selected:** One-line extension (recommended default)
**Notes:** No bird-related globals beyond `birdArray` need reset. The spawn timer self-perpetuates and resumes on `gameOver = false` (same pattern Phase 1 D-13 documented for `placeCactus`).

---

## Claude's Discretion

- Exact identifier casing for new sprite globals (`bird1Img` precedent from `cactus1Img`).
- Order of `placeBird()` declaration (above or below `placeCactus()`).
- Whether to inline the same-frame dead-sprite paint or factor into a tiny helper.
- Exact band split in `placeBird`'s probability roll (recommended starting point: 30% low, 25% mid, 25% high, 20% empty — planner can refine during play-testing).
- Whether to add a `//bird` section header in globals immediately after `//cactus` or after `//track`.
- Order of bird sprite preloads in `window.onload`.

## Deferred Ideas

- Score-gated bird appearance (BIRD-LATE-01, v2)
- Per-bird animation phase offsets (lockstep flap is fine for v1.0)
- Vertical bobbing per bird (constant y per spawn)
- Sprite-frame-perfect hitbox (97×68 canonical chosen; matches Phase 2 D-14)
- `birdArray.shift()` correctness if scroll speed changes (DIFFICULTY-01, v2)
- Unifying cacti and birds into one obstacle array/loop (next major refactor)
- Dynamic bird spawn cadence based on score (bundled with DIFFICULTY-01)
- Sound effects on flap / bird collision (AUDIO-01, v2)
