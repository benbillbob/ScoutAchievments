# Research Notes: Terrain OAS JSON to Markdown Converter

## Runtime & Language
- Decision: Use Node.js 20 LTS with TypeScript 5.x for both the converter CLI and the local webserver.
- Rationale: Node 20 ships native `fetch`, stable ES module support, and broad ecosystem tooling; TypeScript provides type safety across shared domain models while staying within a single toolchain.
- Alternatives considered: Python 3.12 (excellent JSON/YAML tooling but would require separate runtime for webserver), Deno 1.39 (built-in TypeScript but smaller ecosystem and fewer battle-tested libraries for markdown + testing).

## Webserver Framework
- Decision: Adopt Express 4.x with ESM support for serving the index, Markdown content, and refresh endpoint.
- Rationale: Express has long-term support, abundant documentation, and minimal boilerplate; its middleware ecosystem covers logging, compression, and static file serving without heavyweight scaffolding.
- Alternatives considered: Fastify 4.x (higher performance but additional learning curve, plugin ecosystem less familiar to team), Koa 2 (lighter core but requires manual middleware orchestration for common tasks).

## Configuration Management
- Decision: Store source catalog entries in a YAML file parsed with `js-yaml`, supported by Zod schema validation and checksum tracking.
- Rationale: YAML’s readability allows maintainers to annotate entries, group streams, and toggle flags; Zod keeps validation in TypeScript with helpful error messages.
- Alternatives considered: JSON (no inline comments, harder for maintainers), TOML (clean syntax but less familiar to team), SQLite (overkill for static dataset and adds runtime dependency).

## Conversion & Markdown Pipeline
- Decision: Build conversion logic with pure TypeScript utilities and use `markdown-it` for HTML rendering when serving content.
- Rationale: Generating Markdown through string builders keeps output deterministic; `markdown-it` is actively maintained, supports plugins for accessibility, and integrates cleanly with Express for server-side rendering.
- Alternatives considered: Unified/remark (powerful AST transforms but larger dependency graph), showdown (smaller but less active), custom renderer (higher maintenance cost, risk of inconsistency).

## Refresh & File Watching Strategy
- Decision: Use `chokidar` to monitor the YAML catalog and generated directory, with manual CLI commands to trigger full refreshes and HTTP endpoint for on-demand rebuilds.
- Rationale: `chokidar` offers cross-platform file watching and debouncing; pairing it with explicit refresh APIs keeps runtime predictable.
- Alternatives considered: Native `fs.watch` (inconsistent across platforms), cron-based polling (adds latency, runs when idle), bundling with nodemon (focuses on dev reload rather than production refresh flow).

## Testing & Quality Tooling
- Decision: Standardize on Vitest for unit/integration testing, Supertest for HTTP assertions, ESLint + Prettier for lint/format, and `ts-node`/`tsx` for developer ergonomics.
- Rationale: Vitest is fast, TypeScript-aware, and integrates with Vite snapshot tooling if needed; Supertest works seamlessly with Express; ESLint/Prettier satisfy code quality mandates.
- Alternatives considered: Jest (mature but heavier dependency footprint), Mocha + Chai (more configuration overhead), Playwright (powerful but unnecessary for local server scope).

## Performance Monitoring
- Decision: Capture conversion duration and HTTP latency via lightweight benchmark scripts (Node timers + Vitest benchmarks) and expose metrics through structured logs.
- Rationale: Direct measurement scripts avoid adding external observability stacks while meeting performance reliability budgets.
- Alternatives considered: Autocannon for HTTP load testing (useful but heavier to automate), Artillery (adds config complexity), no monitoring (violates constitution performance requirements).
