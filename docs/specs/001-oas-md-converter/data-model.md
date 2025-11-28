# Data Model: Terrain OAS JSON to Markdown Converter

## Entity Overview

### SourceTemplate
- **Identity**: `id` (string; composite of stream + stage + version)
- **Attributes**:
  - `stream` (enum: e.g., `bushwalking`, `bushcraft`)
  - `stage` (integer; 1..5)
  - `title` (string; may override upstream title)
  - `url` (string; HTTPS endpoint)
  - `enabled` (boolean; defaults to true)
  - `displayOrder` (integer; optional manual ordering)
  - `checksum` (string; SHA-256 of last fetched payload)
  - `version` (integer; from upstream `version` field)
  - `lastFetchedAt` (ISO datetime; nullable until first run)
- **Relationships**:
  - 1 → N `MarkdownDocument` (one source generates one document, but historical revisions kept in audit trail if implemented later)
  - 1 → N `ConversionLog` entries
- **Validation Rules**:
  - `url` MUST be HTTPS and point to `templates.terrain.scouts.com.au`
  - `stage` MUST match `meta.stage`
  - `checksum` recalculated after successful fetch and compared to previous value
  - Disabled templates (`enabled=false`) are skipped during conversion
- **State Transitions**:
  - `pending` → `fetched` → `converted`
  - `converted` → `stale` when upstream checksum differs

### MarkdownDocument
- **Identity**: `slug` (string; `<stream>-stage-<stage>`)
- **Attributes**:
  - `title` (string; e.g., `Stage 1 - Bushwalking`)
  - `frontMatter` (object; includes `sourceUrl`, `stream`, `stage`, `version`, `lastFetchedAt`, `checksum`)
  - `bodySections` (array of Section objects with `title`, `contentMarkdown`)
  - `outputPath` (string; relative path under `generated/content/`)
  - `lastGeneratedAt` (ISO datetime)
- **Relationships**:
  - Belongs to one `SourceTemplate`
  - Listed in `IndexEntry`
- **Validation Rules**:
  - File path uniqueness enforced per slug
  - Body sections MUST preserve original order (`Plan>`, `Do>`, `Review>`, `Verify`)
  - Markdown MUST include accessible heading hierarchy (H1 for title, H2 for sections)

### IndexEntry
- **Identity**: `slug`
- **Attributes**:
  - `displayTitle` (string)
  - `stream` (string)
  - `stage` (integer)
  - `summary` (string; derived from first lines of Plan section)
  - `tags` (array; stage keywords + activity names)
  - `lastUpdated` (ISO datetime)
  - `route` (string; `/content/<slug>`)
- **Relationships**:
  - References one `MarkdownDocument`
- **Validation Rules**:
  - `route` MUST align with server routing table
  - `tags` MUST include at least the stream and stage keywords for filtering

### ConversionLog
- **Identity**: auto-generated UUID per attempt
- **Attributes**:
  - `timestamp` (ISO datetime)
  - `templateId` (string)
  - `status` (enum: success, skipped, failed)
  - `durationMs` (integer)
  - `message` (string; error or summary)
- **Relationships**:
  - References one `SourceTemplate`
- **Validation Rules**:
  - All entries persisted to structured log file (`generated/logs/conversion.jsonl`)
  - Failed entries MUST include stack/error context

### CatalogConfig
- **Identity**: single configuration document (YAML)
- **Attributes**:
  - `templates` (array of `SourceTemplate` definitions sans runtime fields)
  - `outputDir` (string; defaults to `generated`)
  - `server` (object; `port`, `host`, `refreshIntervalSeconds`)
  - `logging` (object; `level`, `destination`)
- **Relationships**:
  - Drives creation of `SourceTemplate` instances
- **Validation Rules**:
  - Schema enforced via Zod; unknown keys rejected
  - `templates` array MUST contain unique `(stream, stage)` pairs

## Derived Structures

### Section (used within MarkdownDocument)
- `title` (string; e.g., `Plan>`)
- `items` (array of `Input` objects preserving original order)

### Input
- `id` (string; upstream `id`)
- `label` (string)
- `type` (enum; e.g., `verifiable_checkbox`, `file_uploader`)
- `dialogText` (string; optional explanatory text)
- `checklist` (array of bullet strings parsed from dialog text, optional)

## Relationships Diagram (Logical)

```
CatalogConfig --creates--> SourceTemplate --generates--> MarkdownDocument --listed-as--> IndexEntry
            \                                      \                       
             \                                      +--> ConversionLog      \--> served-by --> Server routes
```

## Notes
- Persistent storage is limited to filesystem artifacts; no relational database is introduced.
- Future enhancements (e.g., historical versions) can extend `MarkdownDocument` to keep revision history without altering existing contracts.
- Schema definitions will be mirrored in TypeScript types to ensure runtime validation matches compile-time expectations.
