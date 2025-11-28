# Implementation Plan: Website Experience Upgrade

**Branch**: `002-enhance-website` | **Date**: 26 Nov 2025 | **Spec**: [`spec.md`](./spec.md)
**Input**: Feature specification from `/specs/002-enhance-website/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Elevate the Terrain OAS viewer by (1) replacing the plain index with a discovery-focused homepage that auto-ranks hero/highlights using engagement signals, (2) wrapping every generated Markdown stage in an immersive, responsive layout with readiness and Plan/Do/Review affordances, and (3) giving visitors first-class share/export actions (rich links, PDF, print) without leaving the app. Implementation will extend the existing Node 20 + Express stack, reusing Markdown generation, catalog metadata, and logs to minimize build overhead while layering new presentation templates, hydration-free enhancements, and light telemetry aggregation jobs.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.4.x targeting Node 20 LTS (existing toolchain)  
**Primary Dependencies**: Express 4 (HTTP server), Markdown-it 14 (rendering), chokidar (watcher), `docs/ui-style.md` tokens, new highlight-ranking Node script plus Playwright + Lighthouse dev dependencies.  
**Storage**: File-system generated Markdown under `generated/content`, config YAML/JSON, telemetry logs in `generated/logs`, and derived ranking JSON under `generated/metrics`.  
**Testing**: Vitest (unit/integration), supertest for HTTP assertions, Playwright CLI for browser smoke & PDF export validation.  
**Target Platform**: Node/Express server served locally (developers) and container/VM deployment (assumed).  
**Project Type**: Single repo with CLI + server (`src/cli`, `src/server`, `public`).  
**Performance Goals**: Homepage TTI ≤1.5s on 3G Fast, content LCP ≤2s, PDF export ≤5s for ≤5 pages (per spec).  
**Constraints**: Must avoid heavy frontend build systems; prefer server-rendered HTML + progressive enhancement; maintain ≤100ms server render budget for hero/filter interactions with lightweight logging hooks.  
**Scale/Scope**: Catalog dozens of streams/stages (<500 pages), concurrent local users low but must scale to troops (~hundreds) when hosted.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality Discipline**: `npm run lint`, `npm run typecheck`, and doc updates will back every change; assign peer reviewer to sign off on highlight-ranking script + CSS print styles.
- **Testing Guarantees**: Acceptance scenarios will map to Vitest units (scoring, data transforms), integration (Express routes), and Playwright smoke (homepage filters, share PDF/print) with clear ownership in Phase 2.
- **User Experience Consistency**: UX tokens + accessibility rules from `docs/ui-style.md` will be codified in quickstart; responsive snapshots + keyboard-only walkthrough required before completion.
- **Performance Reliability**: Budgets verified via Lighthouse script (homepage/content) and Playwright PDF timing; hero/filter logging emitted via middleware for verification.

## Project Structure

### Documentation (this feature)

```text
specs/002-enhance-website/
├── spec.md              # Approved feature spec
├── plan.md              # This file (/speckit.plan)
├── research.md          # Phase 0 findings
├── data-model.md        # Phase 1 entity definitions
├── quickstart.md        # Developer runbook
├── contracts/
│   └── openapi.yaml     # API contracts for highlights/logging/share
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── cli/
│   ├── commands/
│   ├── runners/
│   └── watch/
├── server/
│   ├── http/
│   │   ├── routes/
│   │   └── server.ts
│   └── views/
├── converters/
├── parsers/
├── utils/
└── markdown-generator.ts

tests/
├── unit/
├── integration/
└── contract/

public/
├── index.html
├── assets/
└── styles/

resources/templates/
generated/
scripts/
```

**Structure Decision**: Single TypeScript monorepo with shared `src/` tree for CLI + Express server; tests remain in `tests/{unit,integration,contract}`. Frontend templates live under `public/` with no standalone build system, honoring the "minimal build overhead" constraint.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Phase 0 Research Summary

1. **Engagement aggregation**: nightly Node script parses `generated/logs/audit.jsonl` → writes `generated/metrics/highlight-ranking.json`. Keeps everything file-based and schedulable via npm script.
2. **Browser validation**: adopt Playwright for homepage/share smoke flows + PDF export timing; integrates cleanly with TS + Vitest.
3. **Performance verification**: run Lighthouse CLI for homepage/content budgets; reuse Playwright `page.pdf()` plus shared CSS print styles to meet the ≤5s export requirement.

## Implementation Strategy

### 1. Telemetry & Ranking Pipeline
- Create `npm run rank-highlights` (tsx script) to read JSONL logs, filter last 7 days, score events, and emit ranking JSON with freshness metadata.
- Wire CLI `refresh` path to call ranking script post-conversion so deployment always has up-to-date data.
- Provide an automated job (GitHub Actions cron or host-specific scheduler) that runs `npm run rank-highlights` every 24 hours and fails fast if `generated/metrics/highlight-ranking.json` is older than one day.
- Add Express middleware `/api/engagement` to append sanitized events; reuse existing log writer for consistency.
- Implement fallback precedence: if ranking stale/empty, read `staffPicks` config block.

### 2. Discovery Homepage
- New view under `src/server/views/homepage.ts` renders hero + cards using ranking data + manual overrides; no SPA tooling required.
- Quick filters operate entirely client-side via minimal ES module (vanilla JS) reusing existing `public/assets/search.js` patterns to avoid bundlers.
- Display filter counts and empty states using server-provided metadata; ensure <1s updates by preloading dataset in HTML and filtering in JS.
- Emit engagement events for hero CTA clicks and filter chip interactions via the shared logger so FR-006 telemetry covers homepage flows as well as share/export.

### 3. Stage Layout & Share/Export
- Extend content route to wrap Markdown output with hero banner partial, readiness checklist, collapsible sections, and share toolbar.
- Share actions call `/api/share/pdf` (Playwright-driven) or copy link metadata derived from `StageLayoutModel.shareMeta`.
- Add print stylesheet + PDF template reusing CSS variables from `docs/ui-style.md`; embed color tokens per stream.
- When hero imagery or explicit theme colors are missing, derive palette + banner art from the stream defaults defined in `docs/ui-style.md` so stage pages never render blank headers; cover this behavior in layout tests.
- Emit engagement events for share/download actions to feed future rankings.

### 4. Testing, UX, and Performance Enforcement
- **Unit**: highlight scoring math, config overrides, StageLayoutModel transformations.
- **Integration**: Express routes `/api/highlights`, `/content/:slug`, `/api/share/pdf` (mocking Playwright) via supertest.
- **Playwright smoke**: (a) homepage filter speed + hero CTA navigation, (b) share modal copy-link, (c) PDF generation duration assertion.
- **Performance**: add `npm run lighthouse` hitting homepage and sample stage with throttling; fail if budgets exceeded.
- **Accessibility**: keyboard tab order recorded in Playwright test + axe-core scan via `@axe-core/playwright` plugin.
- **Documentation**: create/refresh `config/README.md` with hero/highlight fallback instructions and extend `docs/catalog-management.md` with the required sharing section plus ranking controls so admins can self-serve updates.
- **Regression Safety**: capture HTML snapshots for homepage + representative stage layouts and enforce OG/Twitter metadata assertions in contract tests to detect template regressions early.

### 5. Performance Monitoring & Rollback Guardrails
- Configure a scheduled CI job (or cron runner) to execute `npm run lighthouse` and Playwright timing probes daily, persisting metrics for comparison against the spec budgets.
- Fail the workflow and block release trains automatically if any sampled metric regresses by >5% for three consecutive runs, per Constitution Principle IV.
- Document the rollback playbook (owners, steps, communication) so on-call engineers can revert to the previous deployment within the same day when thresholds are breached.

## Constitution Check (Post-Design)
- **Code Quality Discipline**: Plan documents lint/typecheck gates, data flow diagrams, and peer-review expectations for new scripts and templates → **PASS**.
- **Testing Guarantees**: Test coverage enumerated per scenario (unit/integration/Playwright/Lighthouse) with mappings → **PASS**.
- **User Experience Consistency**: Strategy references `docs/ui-style.md`, responsive layouts, accessibility + tone checks, and offline fallbacks → **PASS**.
- **Performance Reliability**: Budgets + verification tooling (Lighthouse + PDF timers + server logging) captured with rollback criteria → **PASS**.
