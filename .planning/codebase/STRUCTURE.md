# Directory Structure

**Analysis Date:** 2026-05-05

## Layout

```
chrome-dinosaur-game/
├── index.html        # Entry point. Canvas element + script tag.
├── dino.js           # All game logic (167 lines). Globals + 4 functions.
├── dino.css          # 9 lines: body font/centering and canvas background.
├── README.md         # Tutorial link, demo link, screenshot.
├── CLAUDE.md         # Project instructions for Claude Code (added during init).
├── img/              # Sprite assets (PNG). 19 files.
│   ├── dino.png, dino-dead.png
│   ├── dino-jump.png, dino-duck1.png, dino-duck2.png    (unused)
│   ├── dino-run1.png, dino-run2.png                     (unused)
│   ├── cactus1.png, cactus2.png, cactus3.png
│   ├── big-cactus1.png, big-cactus2.png, big-cactus3.png (unused)
│   ├── bird1.png, bird2.png                              (unused)
│   ├── cloud.png, track.png                              (unused)
│   ├── game-over.png, reset.png                          (unused)
└── .planning/        # GSD planning artifacts (this directory).
    └── codebase/     # This map.
```

## Key Locations

| What | Where |
|------|-------|
| All game state (dino position, cactusArray, score, gameOver, physics constants) | `dino.js:1-43` (top of file) |
| Bootstrap (canvas init, image loading, loop start, keydown attach) | `dino.js:45-74` (`window.onload`) |
| Per-frame update (gravity, scroll, draw, collision, score) | `dino.js:76-108` (`update`) |
| Input handler | `dino.js:110-123` (`moveDino`) |
| Cactus spawner | `dino.js:125-160` (`placeCactus`) |
| AABB collision | `dino.js:162-167` (`detectCollision`) |
| Sprite assets | `img/*.png` |
| Canvas styling | `dino.css` |

## Naming Conventions

**Files:**
- All lowercase, hyphenated where needed (`dino-dead.png`, `big-cactus1.png`).
- Source files share the project's central name: `dino.js`, `dino.css` (not `index.js` / `style.css`).

**Variables in `dino.js`:**
- `lowerCamelCase` for everything: `dinoWidth`, `cactusArray`, `velocityX`, `placeCactusChance`.
- Image variables consistently end in `Img`: `dinoImg`, `cactus1Img`, `cactus2Img`, `cactus3Img`.
- Width/height constants are `<entity><Dim>` pairs: `dinoWidth`/`dinoHeight`, `cactus1Width`, `cactusHeight`.
- The numeric suffix on `cactus1`/`cactus2`/`cactus3` corresponds 1:1 to image filenames.
- `boardWidth`/`boardHeight` are constants; `board.width`/`board.height` (no underscore) are the canvas DOM properties — easy to confuse, watch for this when editing.

**Functions:**
- Verb-first lowerCamelCase: `update`, `moveDino`, `placeCactus`, `detectCollision`.

## Things That Are Not Where You Might Expect

- **There is no `assets/`, `src/`, `lib/`, `dist/`, or `public/` directory.** Everything is at the repo root except sprites in `img/`.
- **No HTML for game-over, score history, or restart UI.** Game-over rendering is implicit (the dead-dino sprite swap in `dino.js:96-99`). The `game-over.png` and `reset.png` sprites exist in `img/` but are never loaded by current code.
- **The `ArrowDown`/duck branch is empty** (`dino.js:119-121`). It's a stub for a feature that the assets (`dino-duck1.png`, `dino-duck2.png`) are already prepared for.

---

*Structure analysis: 2026-05-05*
*Update when adding/removing major directories*
