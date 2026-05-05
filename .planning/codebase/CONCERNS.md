# Concerns

**Analysis Date:** 2026-05-05

This is a tutorial-stage codebase. Most "concerns" below are intentional simplifications, not bugs — but they are real constraints any future phase should plan around.

## Functional Gaps (vs. real Chrome dino game)

| Gap | Where | Impact |
|-----|-------|--------|
| No restart after game over | `gameOver` is set in `dino.js:94-100` and never reset; pressing keys is ignored (`dino.js:111-113`). | Player must reload the page to play again. The `reset.png` asset exists in `img/` but isn't wired up. |
| No duck mechanic | `ArrowDown` branch in `moveDino` is empty (`dino.js:119-121`). | The `dino-duck1.png` / `dino-duck2.png` sprites exist but go unused. No flying obstacle exists to require ducking. |
| No bird (flying) obstacles | Not implemented. | `bird1.png`/`bird2.png` exist in `img/` but no spawn logic. |
| No running animation | `dino.png` is a static frame. | `dino-run1.png`/`dino-run2.png` exist; would need a frame counter to alternate. |
| No jump sprite | Same `dino.png` is drawn whether grounded or airborne. | `dino-jump.png` exists in `img/` but is never loaded. |
| No clouds / track / parallax background | `cloud.png`/`track.png` exist but unused. | Canvas background is a flat `lightgray` from CSS (`dino.css:7`). |
| No high-score persistence | `score` is a module-level `let`, reset on reload. | No `localStorage` use. Each session starts at 0. |
| No difficulty scaling | `velocityX = -8` is constant; spawn interval is fixed at 1000 ms. | Game is the same difficulty at score 100 vs score 10000. The original Chrome game speeds up over time. |

## Latent Bugs

1. **`cactusArray.shift()` can drop on-screen cacti if difficulty changes.** `dino.js:157-159` prunes by count (>5), not by position. Today, with `velocityX = -8` and 1 spawn/sec, cacti exit screen before the array reaches 5. If you reduce spawn interval or increase scroll speed, you can hit a state where a still-visible cactus is shifted off, causing the dino to walk through it (no collision check) and a visible cactus to "teleport away."

2. **Score is rendered every frame, not every second.** `score++` runs once per `update()` call (`dino.js:106`), so on a 60 fps display the player gets 60 score points/sec, but on a 144 fps display they get 144/sec. The score is frame-rate-dependent. Fix would be either tying score to elapsed wall-clock time or to cacti dodged.

3. **Cactus image race window.** `cactus1Img`/`cactus2Img`/`cactus3Img` are constructed and assigned `src` in `window.onload` (`dino.js:62-69`), but no `onload` callback gates first use. The first cactus that spawns at t=1s is overwhelmingly likely to have decoded by then on a local file load — but on a slow connection or large image, the first `drawImage` could no-op silently. Low risk in practice, but real.

4. **Game loop runs forever, even after game over.** `requestAnimationFrame(update)` is called *before* the `gameOver` early-return in `update()` (`dino.js:77-80`), so frames keep being scheduled. Same for `setInterval(placeCactus, 1000)` — never cleared. Currently harmless (early-returns in both), but a leak any time the player tabs away after dying. A restart feature should reset state, not start a second loop.

5. **`dinoY` is overloaded.** It's both the initial dino y *and* the ground-clamp constant in `Math.min(dino.y + velocityY, dinoY)` (`dino.js:85`). Renaming the constant or shifting the ground without updating both call sites silently breaks gravity.

## Performance

The game is not performance-bound. Canvas size is 750×250, ~5 entities max, no shader work, no offscreen canvases needed. `cactusArray` length cap at 5 prevents runaway growth. No concerns at current scale.

If birds + animation frames + parallax background are added: still trivial. The simplest naïve implementation will be far below 16ms/frame budget.

## Security

**Surface is essentially zero.** No network calls, no user input besides keyboard, no `eval`, no `innerHTML`, no DOM injection paths, no third-party scripts, no cookies, no storage. Nothing to attack.

If a future phase adds: a leaderboard backend (input validation, auth), `localStorage` (XSS impact if scores are rendered as HTML), or hot-loaded user content (sanitization) — those are net-new attack surfaces to plan for.

## Fragile Areas

1. **Magic-number coupling between physics constants.** `gravity = 0.4`, `velocityY = -10` for jump, and `dinoY` (ground) together determine apex height and airtime. If the cactus gets taller than the dino's apex jump, the game becomes unwinnable. Today: dino jumps to roughly `(-10)² / (2*0.4) = 125` px above ground; tallest cactus is `cactusHeight = 70`. Comfortable margin, but any physics change should be re-validated.

2. **Spawn-rate vs. scroll-speed coupling.** `velocityX = -8` and `setInterval(placeCactus, 1000)` together mean ~480 px gap between spawn opportunities. If the spacing dropped below the player's reaction time + jump airtime, the game would become impossible. There's no enforced minimum gap between consecutive cacti.

3. **Image swapping via `dinoImg.src`.** Death animation swaps the source on the existing `dinoImg` (`dino.js:96`). If a restart feature is added, you'd need to swap `src` *back* to `dino.png` — easy to forget since `dinoImg` is shared global state, not "current sprite for current animation state."

## Code Quality

- 167 lines in one file is fine for current scope. If birds, animation, and restart are added, the file will start to want internal structure (e.g., separate update/draw passes per entity type, an entity list rather than typed globals).
- Unused image imports aren't loaded yet, so no perf cost — but they will be once tied to features. Bundle size is irrelevant on `file://`, but matters on a hosted demo.
- No documentation beyond the README's link to the YouTube tutorial. Code comments explain magic numbers but not architecture.

---

*Concerns analysis: 2026-05-05*
*Update when concerns are resolved or new ones surface*
