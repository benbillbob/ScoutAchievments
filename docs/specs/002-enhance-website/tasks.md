# Tasks: Website Experience Upgrade

**Input**: Design documents from `/specs/002-enhance-website/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Automated tests are MANDATORY. Every acceptance scenario from the spec MUST map to explicit test tasks before implementation begins.

**Organization**: Tasks are grouped by user story so each increment can be delivered, tested, and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend the toolchain with the minimum dependencies, scripts, and directories required for the feature.

- [X] T001 Update `package.json` devDependencies to add `@playwright/test`, `@axe-core/playwright`, `lighthouse`, and related type packages so required tooling is available.
- [X] T002 Add npm scripts (`rank-highlights`, `test:e2e`, `lighthouse`) and hook `npm run convert`/`npm run refresh` to invoke `npm run rank-highlights` inside `package.json`.
- [X] T003 [P] Scaffold `playwright.config.ts` plus `tests/e2e/.gitkeep` with desktop + pdf projects referencing the local dev server.
- [X] T004 [P] Ensure `generated/metrics/.gitkeep`, `docs/perf/.gitkeep`, and `.gitignore` entries keep ranking/performance artifacts tracked while outputs stay uncommitted.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the ranking pipeline, configuration knobs, logging utilities, and automation that every user story depends on.

- [X] T005 Implement `scripts/rank-highlights.ts` to ingest `generated/logs/audit.jsonl`, compute HighlightRanking scores, and write `generated/metrics/highlight-ranking.json` with freshness metadata.
- [X] T006 Wire `scripts/rank-highlights.ts` into `src/cli/commands/convert.ts` and `src/cli/commands/refresh.ts` so catalog regeneration always refreshes ranking data.
- [X] T007 Add staff-pick overrides and scoring coefficients to `config/catalog.yml`, ensuring schema validation matches the data-model definitions.
- [X] T008 [P] Document hero/highlight fallback knobs, staff picks, and refresh workflow inside `config/README.md`.
- [X] T009 Build `src/server/utils/engagement-logger.ts` that validates `EngagementEvent` payloads and appends to `generated/logs/audit.jsonl`.
- [X] T010 [P] Create unit coverage for ranking math and stale detection in `tests/unit/rank-highlights.spec.ts`.
- [X] T011 [P] Add Playwright harness bootstrap `tests/e2e/helpers/server.ts` that starts the local Express instance for later smoke tests.
- [X] T012 [P] Provision `.github/workflows/rank-highlights.yml` (or equivalent scheduler) that runs `npm run rank-highlights`, fails when the snapshot is older than 24h, and surfaces alerts in PR status.

**Checkpoint**: Ranking data, configuration, logging utilities, and automation exist so user stories can execute in parallel.

---

## Phase 3: User Story 1 - Guided Discovery Homepage (Priority: P1) 🎯 MVP

**Goal**: Replace the plain index with a discovery-focused homepage that auto-ranks hero/highlights and delivers sub-1s filter chips.

**Independent Test**: Load `/` with seeded catalog data, interact with hero tiles and filters, and confirm visitors can deep-link to any stage within ≤3 clicks while telemetry captures hero/filter events.

### Tests for User Story 1 (MANDATORY)

- [x] T013 [P] [US1] Add contract test for `GET /api/highlights` in `tests/contract/highlights.spec.ts`, covering ranking freshness and Staff Picks fallback.
- [x] T014 [P] [US1] Add integration test `tests/integration/homepage.spec.ts` that renders hero tiles, verifies three activity families, and asserts empty-state messaging per Acceptance Scenario 1.
- [x] T015 [P] [US1] Capture HTML snapshots for hero/filter layouts in `tests/integration/__snapshots__/homepage.spec.ts` aligned to scenario `IT-homepage-filter-001`.
- [x] T016 [P] [US1] Add Playwright smoke `tests/e2e/homepage.spec.ts` validating quick filters refresh in <1s and CTA navigation reaches target stages (Acceptance Scenario 2).
- [x] T017 [P] [US1] Add integration + e2e coverage in `tests/integration/telemetry-homepage.spec.ts` and `tests/e2e/homepage-telemetry.spec.ts` to prove hero CTA/filter chip interactions emit `EngagementEvent`s (`IT-homepage-telemetry-001`).

### Implementation for User Story 1

- [x] T018 [P] [US1] Create `src/server/services/highlight-ranking.ts` to load ranking JSON, merge manual overrides, and expose freshness flags to controllers.
- [x] T019 [US1] Implement `/api/highlights` via `src/server/http/routes/highlights.ts` and register it in `src/server/http/server.ts`.
- [x] T020 [US1] Build homepage controller and view at `src/server/http/routes/homepage.ts` and `src/server/views/homepage.ts`, rendering hero, trending cards, counts, and Staff Pick fallback copy.
- [x] T021 [P] [US1] Implement filter logic in `public/assets/homepage-filters.js` (chips, counts, empty state messaging) sourced from preloaded catalog data.
- [x] T022 [US1] Extend `public/styles/main.css` with hero banner, card grid, gradient tokens, and accessible chip states per `docs/ui-style.md`.
- [x] T023 [US1] Instrument hero CTA buttons and filter chips in `src/server/views/homepage.ts` and `public/assets/homepage-filters.js` to call `engagement-logger.ts` with `hero_click` and `filter_apply` events.
- [x] T024 [US1] Document ranking freshness, Staff Picks configuration, and filter curation workflow in `docs/catalog-management.md`.
- [x] T025 [US1] Run `npm run lighthouse -- --only-categories=performance --url http://localhost:4173/` and store the report under `docs/perf/homepage.md`.

**Checkpoint**: Homepage delivers curated discovery experience, emits telemetry, and meets performance budgets—ready for MVP demo.

---

## Phase 4: User Story 2 - Immersive Stage Pages (Priority: P2)

**Goal**: Wrap generated Markdown in a rich, responsive layout featuring hero summary, readiness checklist, progress meter, and collapsible Plan/Do/Review sections.

**Independent Test**: Load any `/content/{stream}/{stage}` page and confirm the hero banner, readiness chips, accordions, and share metadata render correctly from desktop (1440px) down to mobile (375px) without horizontal scroll.

### Tests for User Story 2 (MANDATORY)

- [x] T026 [P] [US2] Add unit suite `tests/unit/stage-layout.spec.ts` covering hero theme fallbacks, readiness checklist limits, progress meter math, and `shareMeta` constraints.
- [x] T027 [P] [US2] Add integration test `tests/integration/stage-layout.spec.ts` for `/content/:slug`, verifying hero, readiness checklist, Plan/Do/Review accordions, and default palettes when hero art is missing (Acceptance Scenario 1).
- [x] T028 [P] [US2] Add Playwright responsive spec `tests/e2e/stage-layout.spec.ts` that exercises breakpoints 1440px → 375px, confirming 16px minimum body size and touch targets ≥44px (Acceptance Scenario 2).
- [x] T029 [P] [US2] Record stage layout HTML snapshots in `tests/integration/__snapshots__/stage-layout.spec.ts` to guard against template regressions.

### Implementation for User Story 2

- [x] T030 [P] [US2] Build `src/server/views/stage-layout.ts` that assembles hero summary, readiness checklist, progress meter, `shareMeta`, and stream palette fallbacks from catalog data.
- [x] T031 [US2] Update `src/server/views/render-markdown.ts` to emit structured sections with IDs, collapsed defaults, and readiness lists capped at six items.
- [x] T032 [US2] Update `src/server/http/routes/content.ts` to supply `StageLayoutModel`, readiness chips, and progress meter data to the new view.
- [x] T033 [US2] Create reusable hero/progress/accordion partials in `src/server/views/components/` and integrate them into stage templates.
- [x] T034 [US2] Extend `public/styles/main.css` with responsive typography, accordion animations, and fallback hero palettes tied to `docs/ui-style.md` tokens.
- [x] T035 [US2] Refresh `docs/ui-style.md` with layout patterns, tone guidance, and accessibility notes for the hero/readiness components.
- [x] T036 [US2] Run Lighthouse for a representative stage (e.g., `http://localhost:4173/content/alpine/cross-country-skiing-stage-5`) and document metrics in `docs/perf/stage-page.md`.

**Checkpoint**: Stage pages use the immersive layout across breakpoints and satisfy accessibility + performance expectations.

---

## Phase 5: Downloader and Template API Optimisations (Priority: P3)

**Goal**: Reduce network round-trips and simplify converter logic by leveraging newer Terrain template/OAS endpoints.

**Independent Test**: Converting the full catalog uses batched/tree endpoints where possible, produces the same `generated/` outputs, and logs fewer individual HTTP requests.

### Downloader optimisation tasks

- [x] T037 [P] Refine downloader to use the OAS tree endpoint (e.g. `https://templates.terrain.scouts.com.au/oas/alpine/tree.json`) to derive per-stream template lists instead of hard-coded or per-template discovery.
- [X] T038 [P] Update converter logic to parse and incorporate intro-scouting templates from `https://templates.terrain.scouts.com.au/intro-scouting/scout/overview/latest.json` and `https://templates.terrain.scouts.com.au/intro-scouting/scout/1.json`, ensuring they appear correctly in `generated/` and the homepage/catalog views.

**Checkpoint**: Core and intro-scouting templates are sourced from the newer Terrain endpoints with no regressions in generated content.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Consolidate validation, documentation, monitoring, and success metrics across all user stories.

- [ ] T051 [P] Run the full validation suite (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, `npm run lighthouse`) and summarize outcomes in `docs/perf/validation.md`.
- [ ] T056 [P] Document the performance rollback + alert pathway in `docs/perf/validation.md`, detailing owners, steps, and approval requirements per Constitution Principle IV.
- [ ] T057 [P] Build `scripts/engagement-metrics.ts` to aggregate SC-001–SC-004 success metrics from `generated/logs/audit.jsonl` and output summaries under `generated/metrics/engagement-report.json`.
- [ ] T058 Publish the success-metrics review process (inputs, cadence, thresholds) in `docs/catalog-management.md` or `docs/perf/success-metrics.md` so councils can validate outcomes post-launch.

## Parallel Execution Examples

- **User Story 1**: After T013 completes, tasks T018 (service), T021 (client filters), and T022 (CSS) can run in parallel, while T017 ensures telemetry tests cover both hero and filters.
- **User Story 2**: T030 (layout builder) and T034 (CSS) proceed concurrently; once both converge, T032 integrates the route change.
- **User Story 3**: T041 (PDF service) and T043 (engagement route) can advance simultaneously, followed by T044/T046 on the UI once APIs stabilize.
- **Cross-Story**: Different teams can tackle US2 and US3 in parallel after Phase 2, provided they coordinate on shared components like `stage-layout.ts`.

## Implementation Strategy

1. **MVP First (US1)**: Complete Phases 1–2, ship the discovery homepage (US1), and validate performance + telemetry to unlock demos.
2. **Incremental Enhancements**: Layer US2’s immersive layout, ensuring responsive + accessibility checks finish before merging share work.
3. **Share & Telemetry**: Deliver US3 to round out exports and logging, making sure offline fallbacks and metadata contracts are enforced.
4. **Ongoing Verification**: Use Phase 6 tasks to institutionalize monitoring, rollback, and success-metric reviews so future releases stay within constitutional guardrails.
