# Code Conventions

**Analysis Date:** 2026-05-05

## Code Style

**Indentation:** 4-space indents in `dino.js`. CSS uses 4-space indents too.

**Semicolons:** Yes, consistently — every statement and most assignments inside object literals end with semicolons (some object literal properties end with `,` per JS syntax).

**Quotes:** Double-quoted strings throughout (`"Space"`, `"./img/dino.png"`). No mixing.

**Variable declarations:**
- `let` for everything, including values that are never reassigned (`let boardWidth = 750`). The codebase predates or simply doesn't follow the modern `const`-by-default convention. Be aware: introducing `const` in a refactor is a stylistic break that should be done deliberately, not piecemeal.
- No `var`.

**Function definitions:** All top-level functions use `function name() {}` declarations. No arrow functions are used for top-level definitions. The `dinoImg.onload = function() { ... }` callback (`dino.js:58`, `dino.js:97`) uses an anonymous function expression.

**Object literal formatting:** Spaced colons (`x : dinoX`) — see `dino.js:15-20`. This is unusual (modern style is `x: dinoX`). Match the existing style if editing those object literals; reformatting them across the file would create churn.

## Naming

See `STRUCTURE.md` for naming patterns. Summary: `lowerCamelCase` everywhere, image variables end in `Img`, dimension constants are `<entity><Dim>`.

## Patterns

**Mutation over immutability.** Every loop in `update()` mutates entities in place (`cactus.x += velocityX`, `dino.y = ...`, `score++`). There is no functional/immutable style anywhere.

**Probability bands for random selection.** `placeCactus()` (`dino.js:139-155`) uses a single `Math.random()` and chained `if/else if` thresholds (>.90, >.70, >.50) to pick between cactus variants and "no cactus." This is the established pattern; if adding bird obstacles, follow the same shape.

**Inline comments explaining numeric magic.** The codebase comments numbers and probabilities, not architecture. Examples:
- `let velocityX = -8; //cactus moving left speed`
- `setInterval(placeCactus, 1000); //1000 milliseconds = 1 second`
- `if (placeCactusChance > .90) { //10% you get cactus3`

When changing a magic number, update the trailing comment if it asserts a specific meaning.

**Section headers as comments.** Top of `dino.js` uses `//board`, `//dino`, `//cactus`, `//physics` as bare-prefix section markers. Keep this organization if adding new entity blocks.

**Coordinate convention.** All sizes in pixels. Origin is canvas top-left. Ground is `boardHeight - height` for each entity. The `cactusY` is computed once at module load (`dino.js:31`); cactus heights are uniform (`cactusHeight = 70`). The dino has its own ground constant (`dinoY` at `dino.js:12`), which is also the variable used to clamp gravity (see ARCHITECTURE.md note about `dinoY` doing double duty).

## Error Handling

**There is none.** No `try`/`catch`, no `if (!image)` guards, no fallback rendering, no logging on failure. Image load errors would silently leave entities invisible. This is consistent with the tutorial scope; if production-hardening is in scope, it's a deliberate gap.

## Async / Concurrency

**Two timers run concurrently:**
- `requestAnimationFrame(update)` — render/physics, ~60 fps.
- `setInterval(placeCactus, 1000)` — spawn, 1 Hz.

These do not coordinate via locks (none needed in single-threaded JS) but they do mutate shared state (`cactusArray`). Because both run on the same event-loop turn boundary, no race exists today. Anything you add that mutates `cactusArray` should follow the same rule: only inside `update()` or `placeCactus()`, never in input handlers (`moveDino` only touches `velocityY`).

## What's Not in This Codebase

- No type system (JS, no JSDoc types, no TS).
- No linting config (no `.eslintrc`, no `.prettierrc`, no `.editorconfig`).
- No formatting enforcement.
- No git hooks.

If a future phase adds linting/formatting, expect to mass-rewrite the existing object-literal-with-spaced-colons style.

---

*Conventions analysis: 2026-05-05*
*Update when style changes meaningfully*
