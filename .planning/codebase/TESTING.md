# Testing

**Analysis Date:** 2026-05-05

## Status

**No automated tests exist.** No `*.test.js`, no `*.spec.js`, no `__tests__/`, no `tests/`, no test runner configured, no CI workflow. The validation loop today is entirely manual: open `index.html` in a browser and play the game.

## Framework

None.

## Structure

Not applicable.

## Mocking

Not applicable.

## Coverage

Not measured.

## How Behavior Is Currently Verified

Manual play-testing is the only feedback loop. A change is "tested" when:

1. The browser is reloaded.
2. The dino jumps on Space / ArrowUp.
3. Cacti scroll left at the expected speed.
4. The dino visually swaps to `dino-dead.png` on collision.
5. The score counter increments.

There is no record of which scenarios have been validated. Regression catches require remembering to test all of the above each time.

## What Would Be Testable Today

The pure functions in `dino.js` are easy candidates for unit tests if a runner were introduced:

- `detectCollision(a, b)` (`dino.js:162-167`) — pure AABB function, four boolean clauses, can be exhaustively tested with rectangle fixtures.
- The probability-bands logic in `placeCactus()` (`dino.js:139-155`) — would need `Math.random` stubbed, but otherwise pure.

The render/physics loop is harder to test without a canvas mock or headless browser (jsdom doesn't implement Canvas 2D).

## What Would Need a Real Browser or Headless Browser

- Canvas pixel output (visual regression).
- Keyboard input → physics behavior end-to-end.
- Frame-rate-sensitive bugs (e.g., behavior at 30 fps vs 144 fps).

Tools to consider if testing becomes a phase: Playwright or Puppeteer for end-to-end; Vitest or Jest with a Canvas mock for unit tests on pure functions.

## CI

None. There are no `.github/workflows/`, no `.circleci/`, no `Jenkinsfile`, no `.gitlab-ci.yml`.

---

*Testing analysis: 2026-05-05*
*Update when tests are introduced or strategy changes*
