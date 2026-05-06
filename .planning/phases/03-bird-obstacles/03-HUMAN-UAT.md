---
status: partial
phase: 03-bird-obstacles
source: [03-VERIFICATION.md]
started: 2026-05-06T04:28:26Z
updated: 2026-05-06T04:28:26Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Birds scroll at cactus speed
expected: When birds and cacti are simultaneously on-screen, they advance left at visually identical speed (both use `velocityX = -8`). No bird drifts ahead of or lags behind cacti.
result: [pending]

### 2. Flap rate reads as flapping
expected: Each on-screen bird visibly alternates between `bird1.png` and `bird2.png` at a rate that reads as wing-flapping. The rate is noticeably slower than the dino's run cycle (divisor 12 vs 6 — half-rate, ~5 fps swap vs ~10 fps).
result: [pending]

### 3. Low bird (y=110) — must duck
expected: A low bird at y=110 collides with a standing dino (game over) but a ducking dino passes underneath without collision. The 12px clearance between the bird's bottom edge (178) and the ducking dino's top edge (190) is the empirical confirmation Phase 2 deferred from DINO-04.
result: [pending]

### 4. Mid bird (y=156) — must jump
expected: A mid bird at y=156 collides with a standing dino AND a ducking dino. Only being airborne (jumping) clears it. Confirms the mid bird is a "must jump" obstacle (ducking is not enough).
result: [pending]

### 5. High bird (y=50) — punishes reflexive jumping
expected: A high bird at y=50 passes harmlessly over a standing or ducking dino (no collision). However, a poorly-timed jump that brings the dino into the bird's y-range (60-118 covers the apex zone 31-125) ends the game. Confirms the "don't jump" feedback for high birds.
result: [pending]

### 6. Bird collision indistinguishable from cactus collision
expected: When the dino collides with a bird, the same dead-sprite swap, scroll halt, and score freeze occur as with a cactus collision. No one-frame "live dino on collision" flash (the same-frame dead-sprite paint pattern from RESEARCH.md Pitfall 4 is in place).
result: [pending]

### 7. Restart after bird death clears birdArray
expected: After dying to a bird, pressing any key resets the game (RESTART-01 still works). All on-screen birds are cleared (`birdArray = []` in `resetGame`). New birds spawn fresh from the right edge as the new run begins. No "ghost" birds carry over from the previous run.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
