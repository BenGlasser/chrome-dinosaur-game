---
status: partial
phase: 01-scrolling-track-restart
source: [01-VERIFICATION.md]
started: 2026-05-05
updated: 2026-05-05
---

## Current Test

[awaiting human testing]

## Tests

### 1. Track tiles smoothly with no gap or jitter at the wrap seam
expected: Continuous, seamless left-scroll of the track strip at velocityX=-8. Upper canvas area (sky) is white. After 5+ seconds of play (when track1 wraps behind track2), no 1-pixel gap or flicker appears at the seam.
result: [pending]

### 2. Any-key restart works cleanly across multiple cycles
expected: After dino-vs-cactus collision sets game over, pressing any key (Space, ArrowUp, letter, etc.) restarts the run with no page reload. Dino sprite swaps from `dino-dead.png` back to `dino.png`, score resets to 0, all cacti clear, dino is back on the ground. No console errors. New cacti spawn within 0–1000 ms. Repeat the die-and-restart loop for at least 3 cycles without degradation.
result: [pending]

### 3. Game feel is unchanged from pre-phase build
expected: Jump height, airtime, gravity, cactus collision trigger, and score increment rate match the pre-phase build. Physics constants (velocityX=-8, gravity=0.4, jump velocityY=-10) produce identical feel. Collision still triggers dead-sprite swap and scroll halt.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

(none yet — items above are manual play-test confirmations, not implementation gaps)
