# Quickstart: Terrain OAS JSON to Markdown Converter

## Prerequisites
- Node.js 20 LTS + npm/pnpm (team standard to be confirmed in workspace tooling)
- Internet access for initial conversion (Terrain endpoints)
- `config/catalog.yml` populated with at least one enabled template

## Install & Setup
1. Install dependencies: `npm install` (or `pnpm install` once tooling decision is finalised).
2. Copy `config/env.example` to `.env` if environment overrides are required (e.g., custom port).
3. Review `config/catalog.yml` and ensure `enabled` templates correspond to available Terrain streams.

## Run Conversion
```bash
npm run convert          # invokes terrain-oas convert --config config/catalog.yml
```
- Outputs Markdown to `generated/content/`
- Writes catalog metadata to `generated/index.json`
- Logs stored in `generated/logs/conversion.jsonl`

## Start Local Server
```bash
npm run serve            # invokes terrain-oas serve --watch
```
- Serves index at `http://localhost:4173`
- Live reloads index when conversion completes (watch mode)
- `/api/refresh` endpoint available for manual refresh triggers

## Trigger Refresh (optional)
```bash
npm run refresh          # invokes terrain-oas refresh
```
- Calls `/api/refresh` on running server
- Exit with non-zero code if server unreachable or refresh rejected

## Testing & Quality Gates
- Unit tests: `npm run test`
- Integration tests (conversion + server): `npm run test:e2e`
- Linting & formatting: `npm run lint`, `npm run format`
- Performance check script: `npm run benchmark`

## Cleanup
- Remove generated artifacts with `npm run clean` (deletes `generated/`)
- Stop server with `CTRL+C` or `npm run stop` (if implemented)

## Troubleshooting
- Missing Markdown? Ensure catalog entries are `enabled: true` and Terrain endpoints reachable.
- Stale content? Run `npm run convert -- --force` to bypass checksum.
- Port conflicts? Override via `.env` or CLI flag `--port` when running `serve` command.
