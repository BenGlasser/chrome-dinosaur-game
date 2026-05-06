# Requirements: Chrome Dinosaur Game

**Defined:** 2026-05-05
**Core Value:** The game must feel like the real Chrome dino game when you play it.

## v1 Requirements

Requirements for the **v1.0 milestone — sprite animations**. Each maps to a roadmap phase.

### Dino Animation

- [x] **DINO-01**: While the dino is on the ground and the game is running, the player sees a 2-frame running animation cycling between `dino-run1.png` and `dino-run2.png` at a consistent rate (~10 fps so the run reads as a run, not a strobe or a slideshow).
- [x] **DINO-02**: While the dino is airborne (mid-jump), the player sees the `dino-jump.png` sprite instead of the running animation.
- [x] **DINO-03**: While the player holds ArrowDown and the dino is on the ground, the player sees a 2-frame ducking animation cycling between `dino-duck1.png` and `dino-duck2.png` at the same rate as the run cycle.
- [x] **DINO-04**: While ducking, the dino occupies a shorter, wider hitbox so a low-flying bird passes overhead without collision but a ground cactus still collides.

### Bird Obstacles

- [ ] **BIRD-01**: Birds spawn periodically alongside cacti and scroll left at game speed.
- [ ] **BIRD-02**: Each spawned bird animates with alternating `bird1.png`/`bird2.png` frames at a flap rate distinct enough to read as flapping.
- [ ] **BIRD-03**: Birds spawn at one of multiple discrete heights (at minimum: a "low" height that requires the player to duck, and a "high" height that requires the player to jump or to stand).
- [ ] **BIRD-04**: A bird-vs-dino collision triggers the same game-over path as a cactus collision (dead-dino sprite, scroll halts, score freezes).

### Scrolling Background

- [x] **BG-01**: The ground is rendered as a tiled `track.png` that scrolls left at the same speed as cacti and birds (replacing today's flat `lightgray` canvas + 1px border).

### Restart

- [x] **RESTART-01**: After the game-over state, pressing any key resets the game state (dino back to running, obstacles cleared, score zeroed) and starts a new run without a page reload.

## v2 Requirements

Deferred to a future milestone. Tracked but not in current roadmap.

### Polish

- **PARALLAX-01**: Drifting `cloud.png` sprite for parallax depth above the track.
- **DIFFICULTY-01**: Game speed (`velocityX`) ramps up over time.
- **BIRD-LATE-01**: Birds gated by score threshold (original behavior: appear after score 450).
- **HISCORE-01**: High score persists across sessions via `localStorage` and is rendered alongside the live score.
- **GAMEOVER-UI-01**: Render `game-over.png` and `reset.png` overlays at game-over instead of relying on the dead-dino sprite swap alone.
- **AUDIO-01**: Sound effects on jump, point milestone (every 100), and game over.

## Out of Scope

Explicitly excluded for v1.0. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| High-score persistence (`localStorage`) | Animation milestone — storage adds an axis of complexity that doesn't serve the goal. Captured as v2 (HISCORE-01). |
| Difficulty / speed scaling | Animations are independent of speed scaling; bundling adds tuning risk without milestone gain. Captured as v2 (DIFFICULTY-01). |
| Score-gated bird appearance | Chose to surface birds from the start in v1.0 for simpler tuning. Captured as v2 (BIRD-LATE-01). |
| Sound effects | Asset selection + load handling is its own work. Captured as v2 (AUDIO-01). |
| Cloud / parallax background | User explicitly chose track-only for v1.0. Captured as v2 (PARALLAX-01). |
| Mobile / touch controls | Not requested; keyboard-only matches the original Chrome game. |
| Big-cactus variants (`big-cactus*.png`) | Sprites exist but unused; no requirement surfaced. |
| Game-over UI sprites (`game-over.png`, `reset.png`) | Restart is key-driven for v1.0; UI sprites would compete with the simpler keypress flow. Captured as v2 (GAMEOVER-UI-01). |
| Tests / CI | Manual play-testing remains the verification loop for v1.0. |
| Build pipeline / bundler | Vanilla-JS-zero-deps is a deliberate constraint. |
| Class/module refactor of `dino.js` | Tutorial-style globals are a constraint per PROJECT.md. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BG-01       | Phase 1 — Scrolling track & restart | Complete |
| RESTART-01  | Phase 1 — Scrolling track & restart | Complete |
| DINO-01     | Phase 2 — Dino animation & state machine | Complete |
| DINO-02     | Phase 2 — Dino animation & state machine | Complete |
| DINO-03     | Phase 2 — Dino animation & state machine | Complete |
| DINO-04     | Phase 2 — Dino animation & state machine | Complete |
| BIRD-01     | Phase 3 — Bird obstacles | Pending |
| BIRD-02     | Phase 3 — Bird obstacles | Pending |
| BIRD-03     | Phase 3 — Bird obstacles | Pending |
| BIRD-04     | Phase 3 — Bird obstacles | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-05*
*Last updated: 2026-05-05 after initialization*
