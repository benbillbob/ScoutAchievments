# Feature Specification: Terrain OAS JSON to Markdown Converter

**Feature Branch**: `001-oas-md-converter`  
**Created**: 2025-11-25  
**Status**: Draft  
**Input**: User description: "Implement the feature specification based on the updated constitution. I want to build a converter that pulls json files such as https://templates.terrain.scouts.com.au/oas/bushwalking/1/latest.json and formats them into markdown files to be served on a simple local webserver with an index page. The source urls should be defined in a single file and will be provided later, for now use the example above and https://templates.terrain.scouts.com.au/oas/bushwalking/2/latest.json and https://templates.terrain.scouts.com.au/oas/bushcraft/1/latest.json to gain a sense of the likely content."

## Clarifications

### Session 2025-11-25

- Q: What format should the single configuration file use for listing source templates? → A: YAML file (.yml) with ordered entries and inline comments.
- Q: How should the index page provide search/filter capability? → A: Client-side JavaScript search field with dynamic filter chips (no page reload).
- Q: Where should the converter write generated Markdown and index files? → A: Repository `generated/` directory (gitignored) shared by converter and server.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Convert configured OAS templates to Markdown (Priority: P1)

Leaders run the converter, which reads the curated list of Terrain OAS JSON endpoints, validates each payload, and produces structured Markdown files in a local content directory with consistent headings for Plan/Do/Review/Verify sections.

**Why this priority**: Without reliable Markdown output the downstream site and review workflows cannot function; this story delivers the core transformation value.

**Independent Test**: Execute the converter with a sample config containing three endpoints and confirm Markdown files are created with required sections, metadata headers, and content parity for each input JSON.

**Acceptance Scenarios**:

1. **Given** a config file listing valid OAS endpoint URLs, **When** the user runs the converter, **Then** a Markdown file is generated per endpoint with headings mirroring each `input_group` and preserving bullet structure.
2. **Given** an endpoint returns malformed JSON, **When** the converter processes the list, **Then** it skips the failing entry, records a detailed error log, and completes remaining conversions without crashing.
3. **Given** the converter ran previously, **When** it runs again with unchanged source content, **Then** it updates file timestamps only if the upstream version changed and records the revision in the generated front matter.

---

### User Story 2 - Serve Markdown content via local webserver (Priority: P2)

A leader starts the bundled local webserver which exposes an index page listing all available Markdown conversions, and clicking any entry renders the Markdown with consistent Terrain2MD styling for review sessions.

**Why this priority**: Hosting content locally enables immediate use during planning sessions without requiring manual file navigation or external infrastructure.

**Independent Test**: Launch the webserver, navigate to the index, and verify the listing matches the converted files; select a page to ensure Markdown renders with the approved typography, navigation, and accessibility behaviors.

**Acceptance Scenarios**:

1. **Given** converted Markdown files exist, **When** the server starts, **Then** the index lists each file with stage, stream, last-updated timestamp, and download link.
2. **Given** a user opens a Markdown page, **When** the Markdown contains bullet lists and emphasis, **Then** the rendered view applies consistent styling and maintains accessible heading hierarchy.
3. **Given** the server is running, **When** the content directory changes (new conversion), **Then** the index refreshes within the defined polling interval without requiring a restart.

---

### User Story 3 - Manage source catalog and refreshes (Priority: P3)

Repository maintainers update a single configuration file to add or disable OAS templates, and operators can trigger a refresh via CLI or web endpoint to rebuild Markdown and regenerate the index without manual file edits.

**Why this priority**: Centralising and automating catalog management keeps the site maintainable as Terrain templates evolve.

**Independent Test**: Modify the config to add a new entry and disable another, trigger a refresh, and verify new Markdown is generated, the disabled entry disappears from the index, and audit logs capture the change.

**Acceptance Scenarios**:

1. **Given** the config file contains enabled and disabled entries, **When** the refresh command runs, **Then** only enabled entries are fetched and all state changes are logged with timestamps.
2. **Given** a new endpoint is added to the config, **When** the converter runs, **Then** the output directory gains a Markdown file whose filename adheres to the naming convention and the index lists it alphabetically within its stream grouping.
3. **Given** the operator triggers a refresh via CLI while the server is active, **When** conversions finish, **Then** the server reflects the updated content without downtime or stale cache.

### Edge Cases

- Network timeouts or DNS failures while fetching source JSON.
- Source JSON schema changes (missing `input_groups`, renamed keys, additional stages).
- Duplicate or conflicting entries in the config (same endpoint listed twice or multiple entries producing identical filenames).
- Conversion executed without any enabled entries.
- Local filesystem permissions preventing Markdown writes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST load a single YAML (`.yml`) configuration file that defines all Terrain OAS source templates, including URL, title overrides, enable/disable flag, and optional display order.
- **FR-002**: The system MUST validate each source payload against the expected schema (template metadata, stage, stream, document array) and emit actionable errors when validation fails.
- **FR-003**: The system MUST generate Markdown files with deterministic naming (`<stream>-stage-<number>.md`) in a repository-level `generated/` directory (gitignored) including front matter capturing source URL, version, last fetched timestamp, and checksum.
- **FR-004**: The system MUST represent each `input_group` as a top-level Markdown heading with the original `title`, preserving ordered and unordered content, emphasis, and dialog text formatting.
- **FR-005**: The system MUST build an index page summarising all converted templates grouped by stream and stage, with client-side JavaScript search and dynamic filter chips for stage and activity keywords (no full page reload).
- **FR-006**: The system MUST expose a local webserver that serves the index and converted Markdown content at a configurable host/port, with graceful start/stop commands.
- **FR-007**: The system MUST support a refresh workflow (CLI command and HTTP endpoint) that re-fetches sources, regenerates Markdown, updates the index, and records an audit log entry.
- **FR-008**: The system MUST skip unchanged templates by comparing stored checksums and only rewrite Markdown when the source JSON changes.
- **FR-009**: The system MUST provide observable logs for fetch attempts, conversion outcomes, and server access, with log levels suitable for troubleshooting failures.

### Key Entities *(include if feature involves data)*

- **SourceTemplate**: Represents a Terrain OAS JSON resource; attributes include `id`, `stream`, `stage`, `version`, `url`, `enabled`, `checksum`, `lastFetchedAt`.
- **MarkdownDocument**: Output artifact containing `filePath`, `title`, `frontMatter`, `bodySections`, `lastGeneratedAt`, `sourceTemplateId`.
- **IndexEntry**: Summarised view of a MarkdownDocument for the index; includes `displayTitle`, `stream`, `stage`, `summary`, `lastUpdated`, `route`.
- **ConversionLog**: Records each fetch/conversion attempt with `timestamp`, `templateId`, `status`, `message`, `durationMs`.
- **CatalogConfig**: Parsed configuration object containing ordered list of source templates plus defaults (output directory, server port, polling interval).

### Code Quality Expectations *(mandatory)*

- Linting and static analysis MUST run for converter, server, and configuration modules, and passing results MUST be documented in the implementation plan.
- The implementation MUST remove dead code, unused sample data, and provisional stubs before merge, or document time-boxed deprecation tasks in `plan.md`.
- Architecture decisions (e.g., templating strategy, serving stack) MUST be justified in `plan.md` with links from the spec’s requirements they address.
- Documentation updates for converter usage, configuration schema, and operational runbooks MUST be completed in parallel with code changes.

### Testing Strategy *(mandatory)*

- Test suites required: unit tests for parsing/validation, integration tests for end-to-end conversion and webserver delivery, contract tests against captured Terrain OAS fixtures, and smoke tests for refresh workflows.
- Acceptance scenarios MUST map to automated tests (tagged or named accordingly) so each user story can be validated in CI.
- Regression protections MUST include fixture-based tests ensuring Markdown output remains stable for known inputs and performance tests verifying conversion timing.

### User Experience Standards *(mandatory for user-facing work)*

- Index and content pages MUST adopt Terrain2MD typography, colour tokens, and layout guidelines recorded in `docs/ui-style.md`; if gaps exist, this feature MUST extend the style guide.
- Accessibility requirements include semantic headings, keyboard navigation, proper focus management, and sufficient colour contrast for all interactive elements.
- Content tone MUST remain instructional and consistent with existing Terrain materials; no abbreviations or jargon may be introduced without glossary updates.
- Client-side search UI (input field and filter chips) MUST support keyboard operation, announce updates to assistive technologies, and visually indicate active filters.

### Performance Budgets *(mandatory for P1/P2 stories)*

- Conversion of up to 10 templates MUST complete within 5 seconds on a typical developer laptop (quad-core, 16 GB RAM) with broadband connectivity; retries for failed endpoints excluded.
- Webserver MUST respond to index requests within 200 ms at p95 under single-user load and serve Markdown pages under 300 ms at p95.
- Refresh workflow MUST avoid blocking requests for more than 1 second; during regeneration the server MUST continue serving existing content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of configured, enabled templates produce Markdown files that pass schema validation and contain all expected sections on first conversion run.
- **SC-002**: 95% of conversion runs complete within the 5-second performance budget for a catalog of 10 templates.
- **SC-003**: Usability testing with at least three leaders reports full task completion (locate and open a template, find plan/do/review information) without assistance.
- **SC-004**: Automated CI pipeline blocks merges if linting, test coverage, or performance checks for the converter/webserver fall below documented thresholds.
- **SC-005**: Audit logs retain at least 30 days of refresh history with zero missing entries during acceptance testing.

## Assumptions

- Terrain OAS endpoints remain publicly accessible over HTTPS and require no authentication.
- A baseline UI style guide (`docs/ui-style.md`) exists or will be created as part of this feature to define typography and colour tokens.
- The solution will run on developer workstations with outbound internet access and an approved scripting/runtime environment determined during planning; production deployment is out of scope.
- The source catalog configuration will be maintained as a YAML file stored in the repository and version-controlled alongside converter code.
- Generated Markdown and index outputs will live under a gitignored `generated/` directory so the converter, tests, and webserver operate on a consistent location without polluting version control.
