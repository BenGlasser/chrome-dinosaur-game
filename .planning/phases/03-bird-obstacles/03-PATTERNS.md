# Phase 3: Bird obstacles - Pattern Map

**Mapped:** 2026-05-05
**Files analyzed:** 1 (single-file project — `dino.js` is the only source file)
**Analogs found:** 6 / 6 — every new block has an exact-match analog already in `dino.js`

## Scope

Per CONTEXT.md D-19 ("No `const`. No classes. No module split. No new files. All bird code lives in `dino.js`"), this phase modifies a single file: **`dino.js`**. There are no files to create. The pattern map below classifies each *new code block* being added to `dino.js` and pairs it with the closest existing block to copy verbatim.

The codebase has no project skills (`.claude/skills/`, `.agents/skills/` not present) and no library stack — vanilla JS / Canvas 2D. All "patterns" are intra-file analogs.

## File Classification

Single file modified — six new code blocks injected. Each block is classified individually against its closest existing in-file analog.

| New block (in `dino.js`) | Role | Data Flow | Closest in-file analog | Match Quality |
|--------------------------|------|-----------|------------------------|---------------|
| `//bird` globals block | config / state declaration | static initialization | `//cactus` globals block (`dino.js:35-48`) | exact |
| Bird sprite preloads (in `window.onload`) | bootstrap / asset load | fire-and-forget I/O | Cactus image preloads (`dino.js:91-98`) | exact |
| `setInterval(placeBird, 1500)` registration | bootstrap / timer | event-driven (1.5s tick) | `setInterval(placeCactus, 1000)` (`dino.js:107`) | exact |
| Bird update/draw/collision loop in `update()` | render + physics tick | per-frame transform + collision | Cactus loop in `update()` (`dino.js:168-179`) | exact |
| `placeBird()` function | entity spawner | event-driven, probability-band | `placeCactus()` function (`dino.js:210-245`) | exact |
| `birdArray = []` line in `resetGame()` | state reset | one-shot mutation | `cactusArray = []` line (`dino.js:250`) | exact |

**All six new blocks have exact-match analogs.** No "no analog found" entries; CONTEXT.md/RESEARCH.md correctly identified this phase as maximally derivative.

## Pattern Assignments

### Block 1: `//bird` globals block (config, static initialization)

**Analog:** `//cactus` globals block in `dino.js:35-48`

**Insert location:** After the `//cactus` block (after `dino.js:48`), before the `//physics` block (`dino.js:50`). Forms the third sibling block in the `//dino` → `//cactus` → `//bird` → `//physics` sequence.

**Pattern to mirror — section header + array + dimension lets + image lets** (`dino.js:35-48`):
```js
//cactus
let cactusArray = [];

let cactus1Width = 34;
let cactus2Width = 69;
let cactus3Width = 102;

let cactusHeight = 70;
let cactusX = 700;
let cactusY = boardHeight - cactusHeight;

let cactus1Img;
let cactus2Img;
let cactus3Img;
```

**Style notes extracted from analog:**
- Section header is a single-line `//keyword` comment at column 0 (line 35).
- Array declared first (line 36).
- Width / height / position constants next (lines 38-44), each on its own line, aligned by visual eyeballing (no formatter).
- Image variable declarations last (lines 46-48), declare-only — `let cactus1Img;` *not* `let cactus1Img = new Image();`. The Image construction lives in `window.onload` (per Pitfall 3 in RESEARCH.md).
- `let`-everywhere, no `const`, even for values never reassigned (`cactusHeight`, `cactusX`).
- Inline magic-number comments are used elsewhere in the file (e.g., `let velocityX = -8; //cactus moving left speed` at `dino.js:51`); apply same style to bird height constants.

**To produce — bird globals (per CONTEXT.md D-01, D-06, D-08, D-18):**
- `let birdArray = [];`
- `let bird1Img;` and `let bird2Img;` — declare-only, matching cactus image pattern (`dino.js:46-48`)
- `let birdWidth = 97;` — canonical hitbox width from bird1.png (CONTEXT.md D-08)
- `let birdHeight = 68;` — canonical hitbox height from bird1.png
- `let birdLowY = 110;` — must-duck height
- `let birdMidY = 156;` — must-jump height
- `let birdHighY = 50;` — don't-jump height

Inline comments per CONVENTIONS.md / Pitfall 1 in RESEARCH.md (do not quote apex y as 31; just say "must-duck" / "must-jump" / "don't-jump").

---

### Block 2: Bird sprite preloads in `window.onload` (bootstrap, fire-and-forget I/O)

**Analog:** Cactus image preloads in `dino.js:91-98`

**Insert location:** Inside `window.onload`, after the cactus preloads (after `dino.js:98`), before the track preload (`dino.js:100-101`). Or after dino-sprite preloads — either is fine; matching cactus order keeps obstacle assets clustered.

**Pattern to mirror — `new Image()` + `.src` assignment, no onload guard, blank line between sprites** (`dino.js:91-98`):
```js
    cactus1Img = new Image();
    cactus1Img.src = "./img/cactus1.png";

    cactus2Img = new Image();
    cactus2Img.src = "./img/cactus2.png";

    cactus3Img = new Image();
    cactus3Img.src = "./img/cactus3.png";
```

**Style notes:**
- Two-space indented (4-space actually — matches surrounding `window.onload` body).
- Two lines per sprite: `let`-less re-assignment (the `let` happened at module top), then `.src` on next line.
- Blank line between sprites (lines 93, 96) — visual separator, but not strictly required.
- Path style: `"./img/<name>.png"` (relative, with leading `./`), matches all other image preloads in the file (lines 79, 81, 83, 85, 87, 89, 92, 95, 98, 101).
- **No `.onload` callback** — fire-and-forget per ARCHITECTURE.md "Image loading is fire-and-forget."

**To produce:**
```js
    bird1Img = new Image();
    bird1Img.src = "./img/bird1.png";

    bird2Img = new Image();
    bird2Img.src = "./img/bird2.png";
```

---

### Block 3: `setInterval(placeBird, 1500)` registration (bootstrap, timer)

**Analog:** `setInterval(placeCactus, 1000)` at `dino.js:107`

**Insert location:** Inside `window.onload`, on the line after `setInterval(placeCactus, 1000);` (after `dino.js:107`), before the `keydown` listener (`dino.js:108`).

**Pattern to mirror — single-line setInterval with inline magic-number comment** (`dino.js:107`):
```js
    setInterval(placeCactus, 1000); //1000 milliseconds = 1 second
```

**Style notes:**
- Single statement, single line.
- Inline trailing comment explaining the magic number (matches CONVENTIONS.md "inline-comment magic numbers" pattern).
- Comment uses `//` not `/* */`.
- `setInterval` return value is discarded — no `clearInterval` ever called. Self-perpetuating per ARCHITECTURE.md "loops self-perpetuate."

**To produce (per CONTEXT.md D-02):**
```js
    setInterval(placeBird, 1500); //birds spawn every 1.5 seconds
```

---

### Block 4: Bird update/draw/collision loop in `update()` (render + physics tick, per-frame transform + collision)

**Analog:** Cactus loop in `update()` at `dino.js:168-179`

**Insert location:** Inside `update()`, AFTER the cactus loop closes (after `dino.js:179`), BEFORE the `//score` block (`dino.js:181`). Per CONTEXT.md D-14, birds paint last so they appear on top of any future visual overlap.

**Pattern to mirror — for-loop, advance x, drawImage, detectCollision, on-hit set gameOver + same-frame dead-sprite paint** (`dino.js:168-179`):
```js
    //cactus
    for (let i = 0; i < cactusArray.length; i++) {
        let cactus = cactusArray[i];
        cactus.x += velocityX;
        context.drawImage(cactus.img, cactus.x, cactus.y, cactus.width, cactus.height);

        if (detectCollision(dino, cactus)) {
            gameOver = true;
            //draw the dead sprite same-frame; subsequent frames early-return before clearRect, so this paint persists
            context.drawImage(dinoDeadImg, dino.x, dino.y, dino.width, dino.height);
        }
    }
```

**Style notes extracted from analog:**
- Section comment `//cactus` at the top of the block (line 168) — bird block uses `//bird`.
- Classic indexed for-loop (`let i = 0; i < array.length; i++`) — not `for...of`, not `forEach`. Matches tutorial style.
- `let entity = array[i];` — local alias for readability.
- `entity.x += velocityX;` — direct mutation, no temporal accumulator. Single source of scroll speed (`velocityX = -8` at `dino.js:51`).
- `context.drawImage(entity.img, entity.x, entity.y, entity.width, entity.height)` — five-argument form, reads from the entity object's `{img, x, y, width, height}` shape. **Birds replace `entity.img` with the per-frame flap-cycle picker** (CONTEXT.md D-12).
- Collision branch is inline `if (detectCollision(dino, entity)) { ... }`.
- Inside the collision branch: set `gameOver = true;` first, then draw `dinoDeadImg` same-frame. Per Pitfall 4 in RESEARCH.md, the same-frame paint is mandatory — without it, the next `update()` early-returns at the top before clearing/drawing, so the live sprite would persist.
- Inline comment on line 176 explains *why* the same-frame paint exists. Bird loop should keep the same comment (or reference it) for the next maintainer.

**Critical addition for bird loop — flap-cycle sprite picker** (per CONTEXT.md D-10/D-12):

The cactus loop uses `cactus.img` directly (line 172) because cacti don't animate. The bird loop replaces this with a per-frame picker. The closest in-file analog for the picker expression is the dino sprite picker at `dino.js:164-165`:

```js
else if (dinoState == "ducking") dinoSprite = (Math.floor(frameCount / 6) % 2 == 0) ? dinoDuck1Img : dinoDuck2Img;
else /* running */               dinoSprite = (Math.floor(frameCount / 6) % 2 == 0) ? dinoRun1Img  : dinoRun2Img;
```

**Style notes from dino picker:**
- Ternary expression: `(Math.floor(frameCount / N) % 2 == 0) ? frame1 : frame2`.
- Divisor `6` for dino ⇒ ~10 fps swap. **Birds use `12` for ~5 fps swap** (CONTEXT.md D-10). Hardcode the `12` literal — no new constant.
- `==` not `===` (matches surrounding code style at `dino.js:164-165`, `dino.js:194`, etc.).
- Result stored in a `let`-declared local for the draw call.

**To produce (CONTEXT.md D-13, D-14):**
```js
    //bird
    for (let i = 0; i < birdArray.length; i++) {
        let bird = birdArray[i];
        bird.x += velocityX;

        let birdSprite = (Math.floor(frameCount / 12) % 2 == 0) ? bird1Img : bird2Img;
        context.drawImage(birdSprite, bird.x, bird.y, bird.width, bird.height);

        if (detectCollision(dino, bird)) {
            gameOver = true;
            //draw the dead sprite same-frame; subsequent frames early-return before clearRect, so this paint persists
            context.drawImage(dinoDeadImg, dino.x, dino.y, dino.width, dino.height);
        }
    }
```

---

### Block 5: `placeBird()` function (entity spawner, probability-band random selection)

**Analog:** `placeCactus()` function at `dino.js:210-245`

**Insert location:** As a top-level function, adjacent to `placeCactus`. Either immediately before (above `dino.js:210`) or immediately after `placeCactus` (below `dino.js:245`). CONTEXT.md "Claude's Discretion" bullet 2 leaves order open. Recommend **after** `placeCactus` (mirrors top-down reading order and groups spawners together).

**Pattern to mirror — gameOver early-return, entity object literal with named-field shape, probability-band random selector with chained if/else if, length-cap shift** (`dino.js:210-245`):
```js
function placeCactus() {
    if (gameOver) {
        return;
    }

    //place cactus
    let cactus = {
        img : null,
        x : cactusX,
        y : cactusY,
        width : null,
        height: cactusHeight
    }

    let placeCactusChance = Math.random(); //0 - 0.9999...

    if (placeCactusChance > .90) { //10% you get cactus3
        cactus.img = cactus3Img;
        cactus.width = cactus3Width;
        cactusArray.push(cactus);
    }
    else if (placeCactusChance > .70) { //30% you get cactus2
        cactus.img = cactus2Img;
        cactus.width = cactus2Width;
        cactusArray.push(cactus);
    }
    else if (placeCactusChance > .50) { //50% you get cactus1
        cactus.img = cactus1Img;
        cactus.width = cactus1Width;
        cactusArray.push(cactus);
    }

    if (cactusArray.length > 5) {
        cactusArray.shift(); //remove the first element from the array so that the array doesn't constantly grow
    }
}
```

**Style notes extracted from analog:**
- Top-level `function name() { }` declaration (not `let name = function` or arrow). Matches CONVENTIONS.md.
- First statement: `if (gameOver) { return; }` — guard against spawning during game-over (lines 211-213). The `setInterval` keeps firing during game-over per ARCHITECTURE.md "Notable Architectural Properties," so this guard is mandatory.
- Object literal uses **`field : value`** spacing (space-colon-space, unusual but consistent at lines 217-221) — the cactus block aligns colons by visual eyeballing. Match this for consistency, though strict alignment is not load-bearing.
- Object literal sets `img: null` and `width: null` initially, then overwrites in the probability branches. Bird spawner can either follow the same pattern OR set `img: bird1Img` initially (per RESEARCH.md Open Question 2 — recommendation: set `bird1Img` to keep the entity shape uniform, since the draw loop overrides per-frame anyway).
- `Math.random()` call assigned to a `placeXxxChance` local with a `//0 - 0.9999...` comment (line 224).
- Probability bands as chained `if (chance > X) ... else if (chance > Y) ... else if (chance > Z) ...`. Threshold values are descending (`.90` → `.70` → `.50`) — each band's percentage is the gap between thresholds, with the implicit `else` (everything ≤ lowest threshold) being the "no spawn" band.
- **Cactus implicit "no cactus" band is below `.50` (50%)** — line 236 is the lowest condition; anything `≤ .50` falls through. **Bird spawner mirrors this with an explicit `if (placeBirdChance > .80) { return; }` guard at the top per CONTEXT.md D-03**, OR an implicit `else { /* low bird */ }` at the bottom — see CONTEXT.md D-03 for the recommended structure.
- Each branch: assign `entity.img`, assign `entity.width` (or for birds, `entity.y`), then `array.push(entity)`. Always inside the branch, never outside.
- Each branch has a trailing `// X% you get Y` comment explaining the band (lines 226, 231, 236). Bird branches use `// X% [low|mid|high]` comments.
- Final block: `if (array.length > 5) { array.shift(); }` with a comment explaining why (lines 242-244). Bird spawner uses identical guard with `birdArray`.

**To produce (per CONTEXT.md D-03, D-04, D-05, D-07, D-16):**

The bird spawner's probability bands per CONTEXT.md D-03 use `.80 / .55 / .30` thresholds (20% no bird / 25% high / 25% mid / 30% low). Picks `bird.y` per band rather than picking a sprite (the sprite is per-frame in the draw loop). Spawn x reuses `cactusX = 700` (D-04). Length-cap at 5 mirrors cactus exactly (D-16).

See RESEARCH.md "Code Examples → `placeBird()` function" for the complete reference body.

---

### Block 6: `birdArray = []` reset line in `resetGame()` (state reset)

**Analog:** `cactusArray = []` line at `dino.js:250`

**Insert location:** Inside `resetGame()`, immediately after the `cactusArray = [];` line (after `dino.js:250`), before the `velocityY = 0;` line (`dino.js:251`). Keeping array resets adjacent helps a future maintainer extend the list (e.g., for a Phase 4 powerup).

**Pattern to mirror — reset list, one assignment per line, no comments** (`dino.js:247-258`):
```js
function resetGame() {
    gameOver = false;
    score = 0;
    cactusArray = [];
    velocityY = 0;
    dino.y = dinoY;
    dinoState = "running";
    isDuckHeld = false;
    frameCount = 0;
    dino.width = dinoWidth;   //restore standing hitbox in case the player died while ducking
    dino.height = dinoHeight;
}
```

**Style notes:**
- Reset list is flat — no helper, no loop, no `Object.assign`.
- Each line is a single assignment.
- Trailing inline comment only when the rationale is non-obvious (lines 256). For `birdArray = [];` the rationale (clear birds on restart) is obvious; no comment needed, matching `cactusArray = []` (line 250).

**To produce (per CONTEXT.md D-17):**
```js
    birdArray = [];
```

(Single line, inserted after line 250.)

## Shared Patterns

### Entity-shape contract `{img, x, y, width, height}`

**Source:** Codebase-wide convention; enforced by `detectCollision(a, b)` at `dino.js:260-265` and the five-argument `context.drawImage` calls.

**Apply to:** The new bird object literal in `placeBird` (Block 5) and every call site reading from a bird (Block 4 draw + collide loop). Birds satisfy the contract via `{img: bird1Img, x: cactusX, y: <one of birdLowY|birdMidY|birdHighY>, width: birdWidth, height: birdHeight}`.

**Concrete reference — `detectCollision`:**
```js
function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}
```
(`dino.js:260-265`)

The bird hitbox (97×68) is fixed across both flap frames per CONTEXT.md D-08 — do not parametrize on `bird.img`. Read the hitbox from the entity's `width`/`height` fields, set once at spawn time.

### `setInterval` spawner with `gameOver` early-return (self-perpetuating timer)

**Source:** `placeCactus` at `dino.js:210-213` plus `setInterval(placeCactus, 1000)` registration at `dino.js:107`.

**Apply to:** New `placeBird` function (Block 5) and new `setInterval(placeBird, 1500)` (Block 3).

**Concrete reference — early-return guard** (`dino.js:211-213`):
```js
    if (gameOver) {
        return;
    }
```

The `setInterval` is registered once at startup and never cleared. When `resetGame()` flips `gameOver = false`, the spawner resumes automatically on the next tick. Birds inherit this exact pattern — no `clearInterval`, no rescheduling logic.

### Per-frame sprite cycling via `frameCount`

**Source:** Phase 2 dino sprite picker at `dino.js:161-165` plus `frameCount++` at `dino.js:113`.

**Apply to:** Bird draw inside the new bird loop (Block 4). Reuses the existing `frameCount` global — no new counter.

**Concrete reference — picker expression pattern** (`dino.js:164`):
```js
else if (dinoState == "ducking") dinoSprite = (Math.floor(frameCount / 6) % 2 == 0) ? dinoDuck1Img : dinoDuck2Img;
```

Bird picker uses divisor `12` (half the dino's rate, half flap fps — ~5 fps frame swap, ~2.5 fps full flap cycle) per CONTEXT.md D-10. All on-screen birds flap in lockstep (D-11) — no per-bird offset. `Math.floor(frameCount / 12) % 2` is the entire animation state for the bird system.

### Same-frame dead-sprite paint on collision

**Source:** Cactus collision branch at `dino.js:174-178`.

**Apply to:** Bird collision branch in the new bird loop (Block 4).

**Concrete reference** (`dino.js:174-178`):
```js
        if (detectCollision(dino, cactus)) {
            gameOver = true;
            //draw the dead sprite same-frame; subsequent frames early-return before clearRect, so this paint persists
            context.drawImage(dinoDeadImg, dino.x, dino.y, dino.width, dino.height);
        }
```

Bird branch is identical except the entity name. Pitfall 4 in RESEARCH.md emphasizes this is mandatory — the next-frame state derivation in `update()` won't run because the early-return at `dino.js:115-117` fires first. Without the same-frame paint, the live dino sprite would persist visually until restart.

### Inline magic-number comments (style)

**Source:** CONVENTIONS.md "Patterns"; in-file examples include `dino.js:51` (`let velocityX = -8; //cactus moving left speed`), `dino.js:107` (`setInterval(placeCactus, 1000); //1000 milliseconds = 1 second`), `dino.js:226` (`if (placeCactusChance > .90) { //10% you get cactus3`).

**Apply to:** All new bird globals (Block 1) and probability bands in `placeBird` (Block 5).

Recommended comments per RESEARCH.md "Code Examples → Bird globals block":
- `let birdWidth = 97; //match bird1.png width — canonical hitbox even when bird2 (93×62) is rendered`
- `let birdHeight = 68; //match bird1.png height`
- `let birdLowY = 110; //must-duck height — bird occupies y∈[110,178]; misses ducking dino at [190,250]`
- `let birdMidY = 156; //must-jump height — bird occupies y∈[156,224]; aligned with standing dino top`
- `let birdHighY = 50; //don't-jump height — bird occupies y∈[50,118]; punishes reflexive jumping`

Per RESEARCH.md Pitfall 1, **do not quote `dino.y = 31` as the apex** anywhere in comments — the actual integration apex is 36. The verdicts hold; the math anchor in CONTEXT.md D-06 is slightly off by ~5 px.

### `let`-everywhere style (no `const`)

**Source:** CONVENTIONS.md "Code Style"; reaffirmed by CONTEXT.md D-19 and Phase 1 D-16/D-18, Phase 2 D-23/D-24.

**Apply to:** All new variable declarations in Phase 3 (Block 1 globals, Block 5 locals, Block 4 picker local, Block 6 reset). Use `let` unconditionally — even for values never reassigned (e.g., `birdWidth`, `birdLowY`, the `birdSprite` picker local, the loop index). Introducing `const` would be a stylistic break per the locked decisions.

## No Analog Found

None. Every new code block in Phase 3 has an exact-match analog already present in `dino.js`. This is unusually clean coverage and confirms the CONTEXT.md / RESEARCH.md framing of Phase 3 as "maximally derivative" — the planner does not need to invent any new abstraction.

## Metadata

**Analog search scope:** `dino.js` (single source file; project has no other code files per PROJECT.md "Constraints — Single-file game logic").
**Files scanned:** 1 (`dino.js`, 265 lines).
**Reference inputs:**
- `.planning/phases/03-bird-obstacles/03-CONTEXT.md` (decisions D-01..D-20)
- `.planning/phases/03-bird-obstacles/03-RESEARCH.md` (verified math, pitfalls, code examples)
- `dino.js` (Phase 2 state, 265 lines — current main branch)
**Pattern extraction date:** 2026-05-05
