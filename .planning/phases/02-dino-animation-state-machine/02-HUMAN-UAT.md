---
status: partial
phase: 02-dino-animation-state-machine
source: [02-VERIFICATION.md]
started: 2026-05-06
updated: 2026-05-06
---

## Current Test

[awaiting human testing]

## Tests

### 1. Run cycle reads as ~10 fps while on ground
expected: While the dino is on the ground and running (not jumping, not ducking), the sprite visibly alternates between `dino-run1.png` and `dino-run2.png` at a rate that reads as a run cycle (not a strobe, not a slideshow). At 60 fps render rate, the swap should occur every ~6 frames (~10 swaps per second).
result: [pending]

### 2. Jump sprite transition is clean
expected: Pressing Space or ArrowUp from the ground triggers a jump. While airborne, the sprite is `dino-jump.png` — NOT the run cycle, NOT the standing frame. On landing, the sprite immediately resumes the run cycle. No run-frame flicker during the jump arc.
result: [pending]

### 3. Duck cycle + no stuck-duck on rapid key cycling
expected: Holding ArrowDown while on the ground triggers the duck animation: dino is visibly shorter and wider; sprite alternates between `dino-duck1.png` and `dino-duck2.png` at the same rate as the run cycle. Releasing ArrowDown returns the dino to running with the standing hitbox restored. Rapidly mashing ArrowDown does not get the dino stuck in a half-duck or wrong-hitbox state.
result: [pending]

### 4. Dead-dino sprite appears same-frame at collision
expected: When the dino collides with a cactus, the dead-dino sprite (`dino-dead.png`) appears on the SAME frame as the collision — no blank-frame flash, no one-frame visual gap, no leftover run/jump sprite. Pressing any key after death restarts the run with the run-cycle visible immediately (per Phase 1 RESTART-01 behavior, still working).
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

(none — items above are manual play-test confirmations, not implementation gaps)

DINO-04 empirical low-obstacle clearance is deferred to Phase 3 (BIRD-03) per RESEARCH.md Q1 resolution. Calculation-based verification confirms the hitbox geometry in 02-VERIFICATION.md.
