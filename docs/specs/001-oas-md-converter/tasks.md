---

description: "Execution tasks for Terrain OAS JSON to Markdown Converter"
---

# Tasks: Terrain OAS JSON to Markdown Converter

**Input**: Design documents from `/specs/001-oas-md-converter/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Automated tests are MANDATORY. Every acceptance scenario from the spec MUST map to tasks that create, update, and run tests before implementation is complete.

**Organization**: Tasks are grouped by user story to enable independent implementation, testing, UX validation, and performance verification for each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline workspace structure

- [x] T001 Initialize Node.js + TypeScript project scaffold in `package.json`
- [x] T002 [P] Add TypeScript compiler configuration and base directories in `tsconfig.json`
- [x] T003 [P] Extend repository `.gitignore` to exclude `generated/` artifacts
- [x] T004 Create seed catalog with sample Terrain templates in `config/catalog.yml`
- [x] T005 [P] Provide environment example with server defaults in `config/env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core tooling, validation, and utilities required before any user story work can begin

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Configure ESLint for TypeScript project-wide rules in `eslint.config.mjs`
- [x] T007 [P] Configure Prettier formatting baseline in `prettier.config.cjs`
- [x] T008 [P] Wire Vitest + Supertest runner with coverage thresholds in `vitest.config.ts`
- [x] T009 [P] Define shared domain types for templates and documents in `src/parsers/types.ts`
- [x] T010 [P] Implement Zod schemas for catalog validation in `src/parsers/catalog-schema.ts`
- [x] T011 [P] Implement YAML catalog loader with schema validation in `src/parsers/catalog-loader.ts`
- [x] T012 [P] Create filesystem + checksum helpers supporting deterministic output in `src/utils/fs.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — Convert configured OAS templates to Markdown (Priority: P1) 🎯 MVP

**Goal**: Converter reads YAML catalog, validates payloads, and outputs structured Markdown with metadata for each Terrain template.

**Independent Test**: Run CLI against catalog containing three endpoints and verify Markdown files, metadata, and logging artifacts match acceptance scenarios.

### Tests for User Story 1 (MANDATORY) ⚠️

- [x] T013 [P] [US1] Add contract test validating fixture conversion output in `tests/contract/conversion.spec.ts`
- [x] T014 [P] [US1] Add integration test covering CLI convert success + skip logic in `tests/integration/convert-cli.spec.ts`
- [x] T015 [P] [US1] Add unit tests for malformed payload validation errors in `tests/unit/catalog-validation.spec.ts`

### Implementation for User Story 1

- [x] T016 [P] [US1] Implement section renderer preserving grouping order in `src/converters/section-renderer.ts`
- [x] T017 [P] [US1] Implement front matter builder with checksum + timestamps in `src/converters/frontmatter.ts`
- [x] T018 [P] [US1] Implement Markdown generator orchestrating inputs and sections in `src/converters/markdown-generator.ts`
- [x] T019 [US1] Implement checksum persistence and change detection in `src/converters/checksum-store.ts`
- [x] T020 [US1] Implement CLI convert command pipeline in `src/cli/commands/convert.ts`
- [x] T021 [US1] Implement CLI runner that writes Markdown + index artifacts in `src/cli/runners/convert-runner.ts`
- [x] T022 [US1] Implement index metadata writer producing catalog JSON in `src/converters/index-writer.ts`
- [X] T023 [US1] Implement structured logging + summary reporter for conversions in `src/cli/reporters/convert-reporter.ts`

**Checkpoint**: User Story 1 delivers deterministic Markdown and index artifacts for configured templates

---

## Phase 4: User Story 2 — Serve Markdown content via local webserver (Priority: P2)

**Goal**: Local Express server exposes catalog and content endpoints, renders Markdown with shared styling, and delivers client-side filtering UX.

**Independent Test**: Start server, verify index lists all converted templates with search + filter, and render Markdown pages with accessible structure.

### Tests for User Story 2 (MANDATORY) ⚠️

- [X] T024 [P] [US2] Add integration test for `/api/catalog` response shape in `tests/integration/server-catalog.spec.ts`
- [X] T025 [P] [US2] Add integration test for `/api/content/:slug` rendering flow in `tests/integration/server-content.spec.ts`
- [X] T026 [P] [US2] Add unit tests for search/filter utilities in `tests/unit/search-filter.spec.ts`

### Implementation for User Story 2

- [x] T027 [P] [US2] Implement Express server entry + middleware stack in `src/server/http/server.ts`
- [x] T028 [P] [US2] Implement `/api/catalog` route sourcing generated metadata in `src/server/http/routes/catalog.ts`
- [x] T029 [P] [US2] Implement `/api/content/:slug` route rendering Markdown in `src/server/http/routes/content.ts`
- [x] T030 [US2] Implement `/api/refresh` endpoint wiring to refresh service in `src/server/http/routes/refresh.ts`
- [x] T031 [US2] Implement `/health` endpoint exposing readiness data in `src/server/http/routes/health.ts`
- [x] T032 [US2] Implement server-side Markdown rendering helpers in `src/server/views/render-markdown.ts`
- [x] T033 [US2] Build static index template with layout + tokens in `public/index.html`
- [x] T034 [US2] Build client-side search + filter script in `public/assets/search.js`
- [x] T035 [US2] Build accessible styles + tokens for web UI in `public/styles/main.css`
- [x] T036 [US2] Implement CLI serve command with watch support in `src/cli/commands/serve.ts`

**Checkpoint**: User Story 2 delivers searchable local site serving converted Markdown

---

## Phase 5: User Story 3 — Manage source catalog and refreshes (Priority: P3)

**Goal**: Maintainers manage templates via YAML catalog, trigger refreshes via CLI/API, and capture audit logs without manual file edits.

**Independent Test**: Update catalog to add/disable entries, invoke refresh, and confirm generated content + index update alongside audit logs without downtime.

### Tests for User Story 3 (MANDATORY) ⚠️

- [x] T037 [P] [US3] Add unit tests for catalog enable/disable + ordering rules in `tests/unit/catalog-filter.spec.ts`
- [x] T038 [P] [US3] Add integration test covering CLI refresh to server workflow in `tests/integration/refresh.spec.ts`

### Implementation for User Story 3

- [X] T039 [P] [US3] Implement chokidar-based catalog watcher in `src/cli/watch/catalog-watcher.ts`
- [x] T040 [US3] Implement refresh job service coordinating conversions in `src/server/services/refresh-service.ts`
- [x] T041 [US3] Implement CLI refresh command invoking server API in `src/cli/commands/refresh.ts`
- [x] T042 [US3] Implement reusable server API client utility in `src/cli/utils/server-client.ts`
- [x] T043 [US3] Implement audit log writer for refresh outcomes in `src/utils/audit-log.ts`
- [x] T044 [US3] Extend catalog loader to respect enabled flags + display order in `src/parsers/catalog-loader.ts`
- [x] T045 [US3] Document catalog maintenance + refresh workflow in `docs/catalog-management.md`

**Checkpoint**: User Story 3 enables controlled refresh pipeline and catalog governance

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cross-feature validation, tooling hardening, and documentation updates

- [X] T046 [P] Update `docs/ui-style.md` with search UI tokens and accessibility notes
- [X] T047 [P] Implement performance benchmark script measuring conversion + HTTP latency in `scripts/benchmark.ts`
- [X] T048 [P] Add CI workflow running lint, tests, and benchmarks in `.github/workflows/ci.yml`
- [x] T049 Validate quickstart instructions and refine steps in `specs/001-oas-md-converter/quickstart.md`
- [X] T050 Publish release summary for feature launch in `docs/release-notes/001-oas-md-converter.md`

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → User Stories → Phase 6**: Each phase depends on prior phase completion. User stories may proceed in parallel once foundational tooling is ready, respecting story priority (US1 → US2 → US3) for MVP delivery.
- **User Story Dependencies**:
  - **US1**: Independent after foundational tasks; completes MVP.
  - **US2**: Depends on US1 outputs (Markdown + index artifacts) for server rendering.
  - **US3**: Depends on US1 conversion pipeline and US2 server endpoints to manage refresh flows.
- **Within Stories**:
  - Tests must be authored and failing before implementation tasks begin.
  - `catalog-loader.ts` extension (T044) depends on foundational loader implementation (T011).
  - `refresh-service.ts` (T040) depends on server routes and CLI utilities from US2/US3 tasks.

## Parallel Execution Examples

- **US1**: T013, T014, and T015 can run concurrently; T016, T017, and T018 may proceed in parallel once schemas exist.
- **US2**: T024 and T025 can execute concurrently; T027–T029 can run in parallel given shared interfaces; T034 and T035 can proceed together after index template stub exists.
- **US3**: T039 and T043 can run in parallel, while T040 waits for T039 + T044 completion.

## Implementation Strategy

- **MVP First**: Complete Setup, Foundational, and User Story 1 to deliver offline Markdown generation MVP fulfilling core value.
- **Incremental Delivery**: Deploy User Story 2 to provide local web access, then User Story 3 for catalog governance and refresh automation.
- **Continuous Quality**: Enforce lint/tests/benchmarks via CI before moving to next phase; maintain documentation alongside code to satisfy constitution requirements.
