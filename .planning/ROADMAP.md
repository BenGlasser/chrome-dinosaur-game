# Roadmap: Chrome Dinosaur Game

## Overview

The v1.0 milestone — **sprite animations** — brings the existing static-sprite game to feature parity with the real Chrome dino game on the visual and gameplay axes that the user actually feels: a running/jumping/ducking dino, scrolling track, and flying birds that demand the duck mechanic. Three phases, ordered to deliver visible progress fast and to keep dependencies honest: **Phase 1** wires the smallest standalone polish (scrolling track, restart-on-key); **Phase 2** turns the dino into a proper state machine with animation and a hitbox that shrinks while ducking; **Phase 3** introduces birds as a new obstacle type that builds on Phase 2's duck mechanic. Each phase is independently shippable and observable in-browser without tooling.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Scrolling track & restart** — Tiled scrolling ground replaces the flat background; any-key restart after game over.
- [ ] **Phase 2: Dino animation & state machine** — Dino runs, jumps, and ducks with the right sprite for each state; ducking shrinks the hitbox.
- [ ] **Phase 3: Bird obstacles** — Birds spawn at multiple heights, flap, and end the game on collision; at least one height requires ducking.

## Phase Details

### Phase 1: Scrolling track & restart
**Goal**: Replace the flat lightgray canvas background with a tiled, scrolling `track.png`, and let the player restart with a keypress after game over (no page reload).
**Depends on**: Nothing
**Requirements**: BG-01, RESTART-01
**Success Criteria** (what must be TRUE):
  1. While the game is running, the ground visibly scrolls left as a tiled sequence of `track.png` (no gap, no jitter).
  2. After the dino dies (collision triggers game-over state), pressing any key clears the cacti, resets the score and dino state, and starts a new run without reloading the page.
  3. The game's overall feel — physics, collision, score increment — remains unchanged from before this phase.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Tiled scrolling track render
- [ ] 01-02: Game-state reset on any key after game over

### Phase 2: Dino animation & state machine
**Goal**: The dino plays the correct sprite for each gameplay state — running, jumping, ducking — and its collision hitbox tracks the visual state (smaller while ducking) so a low obstacle can be cleared by ducking.
**Depends on**: Nothing strictly. Phase 1's restart is recommended for development ergonomics (test repeated jump/duck sequences without F5) but not a build-time dependency.
**Requirements**: DINO-01, DINO-02, DINO-03, DINO-04
**Success Criteria** (what must be TRUE):
  1. While the dino is on the ground and the game is running, its sprite alternates between `dino-run1.png` and `dino-run2.png` at a consistent rate that reads as a run cycle (~10 fps).
  2. While the dino is airborne, its sprite is `dino-jump.png` (not the running cycle, not the standing frame).
  3. While ArrowDown is held and the dino is on the ground, its sprite alternates between `dino-duck1.png` and `dino-duck2.png` and the dino's bounding box is shorter and wider than the standing dino.
  4. A test obstacle drawn at "low height" (clearance designed for ducking) does not collide with the dino while it is ducking, but does collide while it is standing.
**Plans**: 3 plans

Plans:
- [ ] 02-01: Frame counter + sprite cycling helper; wire dino run cycle (DINO-01)
- [ ] 02-02: Jump state — sprite swap to `dino-jump.png` while airborne (DINO-02)
- [ ] 02-03: Duck mechanic — ArrowDown handler, duck-cycle, hitbox shrink (DINO-03, DINO-04)

### Phase 3: Bird obstacles
**Goal**: Birds spawn periodically alongside cacti at multiple heights, flap their wings via 2-frame animation, scroll left at game speed, and trigger the same game-over path as cacti on collision. At least one bird height demands the duck mechanic from Phase 2.
**Depends on**: Phase 2 (the duck mechanic and shrunk hitbox from DINO-03/DINO-04 are required for BIRD-03 to be meaningfully testable — without them, "low birds requiring duck" can't be verified)
**Requirements**: BIRD-01, BIRD-02, BIRD-03, BIRD-04
**Success Criteria** (what must be TRUE):
  1. During play, bird obstacles appear and scroll left at the same speed as cacti (mixed obstacle types coexist without visual or collision glitches).
  2. Each on-screen bird visibly flaps — its sprite alternates between `bird1.png` and `bird2.png` at a rate that reads as flapping (distinct from the dino's run/duck rate).
  3. Birds spawn at one of multiple discrete heights; at least one height clears a standing dino (jump-or-duck-required) and at least one height requires ducking specifically (cannot be cleared by jumping).
  4. Colliding with any bird ends the game in exactly the same way as colliding with a cactus (dead-dino sprite, scroll halts, score freezes, RESTART-01 still resets).
**Plans**: 2 plans

Plans:
- [ ] 03-01: Bird entity model + spawning at multiple heights + scroll integration
- [ ] 03-02: Bird sprite-cycle animation + collision wiring into existing game-over path

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scrolling track & restart | 0/2 | Not started | — |
| 2. Dino animation & state machine | 0/3 | Not started | — |
| 3. Bird obstacles | 0/2 | Not started | — |
