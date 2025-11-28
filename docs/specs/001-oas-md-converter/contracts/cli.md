# CLI Contract: `terrain-oas`

## Commands

### `terrain-oas convert`
- **Description**: Fetch all enabled templates from the YAML catalog and regenerate Markdown, index, and logs.
- **Arguments**:
  - `--config <path>` (optional; defaults to `config/catalog.yml`)
  - `--force` (optional; ignore checksum short-circuiting and rewrite all outputs)
  - `--templates <slug,slug>` (optional; comma-separated list to limit conversions)
- **Flags**:
  - `--dry-run` (show actions without writing files)
  - `--verbose` (increase logging detail)
- **Stdout**: Progress updates and summary table (converted/skipped/failed counts).
- **Stderr**: Validation errors, network failures, unexpected exceptions.
- **Exit Codes**:
  - `0` success (all templates converted or skipped)
  - `1` configuration error (invalid YAML, schema mismatch)
  - `2` network or fetch errors (some templates failed)
  - `3` unexpected runtime error (stack trace logged)

### `terrain-oas serve`
- **Description**: Start the local Express webserver serving the generated content and API endpoints.
- **Arguments**:
  - `--config <path>` (optional; defaults to `config/catalog.yml`)
- **Flags**:
  - `--open` (auto-open index page in default browser)
  - `--watch` (watch catalog file and trigger auto-refresh)
- **Behavior**:
  - Reads catalog for server settings (port, host, polling interval).
  - Uses shared logger and health endpoint as defined in `web-server.openapi.yaml`.
  - Initiates conversion if generated directory is empty before serving requests.
- **Exit Codes**:
  - `0` graceful shutdown
  - `4` port binding failure
  - `5` missing generated content and conversion failed

### `terrain-oas refresh`
- **Description**: Trigger an immediate refresh in a running server instance via the `/api/refresh` endpoint.
- **Arguments**:
  - `--config <path>` (optional; provide server host/port overrides)
- **Exit Codes**:
  - `0` refresh job accepted
  - `6` server unavailable or returned error

## Logging Contract
- Logs emitted as JSON lines to `generated/logs/conversion.jsonl` with fields: `timestamp`, `level`, `templateId`, `event`, `durationMs`, `message`.
- Human-readable summary also written to stdout using pino-pretty style when `--verbose` flag is set.
