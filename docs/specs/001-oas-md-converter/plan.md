# Implementation Plan: Terrain OAS JSON to Markdown Converter

**Branch**: `001-oas-md-converter` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-oas-md-converter/spec.md`

**Note**: This plan references supporting artifacts generated during the `/speckit.plan` workflow (see [research.md](./research.md), [data-model.md](./data-model.md), and contracts).

## Summary

Build a TypeScript-based toolchain (see research decision log) that reads a YAML catalog of Terrain OAS template URLs, validates each payload, and converts the content into structured Markdown files stored under a gitignored `generated/` directory. Companion metadata (index JSON) will power a lightweight Express webserver that serves an index page with client-side filtering and renders Markdown content using shared style tokens. Automated tests will validate conversion accuracy, schema compliance, and webserver behavior while performance checks confirm conversion and serving budgets.

## Technical Context

**Language/Version**: TypeScript 5.x targeting Node.js 20 LTS  
**Primary Dependencies**: Express 4, js-yaml, Zod, markdown-it, chokidar (for refresh watcher), dotenv (minimal runtime configuration)  
**Storage**: Local filesystem under `generated/` (gitignored)  
**Testing**: Vitest 1.x with Supertest for HTTP, tsx for test runtime, ESLint + Prettier for static analysis/formatting  
**Target Platform**: Developer workstations (Windows/macOS/Linux) running Node.js 20  
**Project Type**: Single project (converter + webserver within shared `src/`)  
**Performance Goals**: Conversion of ≤10 templates in ≤5s, index response ≤200ms p95, content response ≤300ms p95, refresh downtime ≤1s  
**Constraints**: Minimal third-party dependencies, offline-ready once Markdown generated, no external databases, reproducible output for same upstream version  
**Scale/Scope**: Initial catalog ≤25 templates (extensible); single-node local runtime only

## Constitution Check

- **Code Quality Discipline**: Document linting (ESLint) and formatting (Prettier) enforcement in CI, capture peer-review checklist updates, and record architecture decisions for converter pipeline and server templating in `plan.md` and `docs/`.
- **Testing Guarantees**: Map each acceptance scenario to Vitest suites (conversion, error handling, server rendering). Contract tests will validate sample Terrain responses; integration tests will exercise CLI to server pipeline. Plan details per-story coverage and regression fixtures.
- **User Experience Consistency**: Reference `docs/ui-style.md` for typography/color tokens. Plan includes tasks for UX review, accessibility audits (semantic headings, focus management), and localization check for UI text.
- **Performance Reliability**: Define measurement scripts for conversion timing and HTTP p95 latency using Vitest benchmarks or dedicated scripts; include mitigation tasks (profiling, chunked fetch) if budgets risk being exceeded.

## Project Structure

### Documentation (this feature)

```text
specs/001-oas-md-converter/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── cli/
│   ├── commands/
│   └── runners/
├── server/
│   ├── http/
│   ├── middleware/
│   └── views/
├── converters/
├── parsers/
└── utils/

tests/
├── unit/
├── integration/
└── contract/

config/
├── catalog.yml (sample)
└── env.example

public/
├── assets/
└── styles/

generated/ (gitignored)
└── content/
```

**Structure Decision**: Maintain a single TypeScript project with distinct feature directories (`cli`, `server`, `converters`) to share domain models and utilities while keeping converter and server concerns separated. Tests mirror runtime layout for traceability. `generated/` remains outside version control per spec.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(None)* | | |
