# Data Model — Website Experience Upgrade

## Overview
Existing catalog YAML + generated Markdown remain the source of truth. This feature introduces three new derived models plus enriches the rendered stage view model. All data continues to live in files so contributors avoid extra infrastructure.

## Entities

### CatalogEntry (existing, referenced)
- **Fields**: `slug`, `stream`, `stage`, `title`, `summary`, `tags[]`, `difficulty`, `prerequisites[]`, `lastUpdated`
- **Relationships**: One-to-many with `StageLayoutModel` (a layout is built for each catalog entry).
- **Validations**: `slug` unique, `stage` integer 1-9, `stream` limited to known families.

### StageLayoutModel (rendering view-model)
- **Fields**:
  - `slug` *(string, required)* — matches generated Markdown filename.
  - `stream`, `stage`, `title`, `summary`
  - `heroTheme` *(enum: alpine/aquatics/...)* — maps to `docs/ui-style.md` token sets.
  - `readinessChecklist[]` *(array of bullet strings)* — extracted from prerequisites.
  - `sections[]` *(Plan, Do, Review, additional metadata)* — retains Markdown order but adds `id`, `title`, `collapsedDefault`.
  - `progressMeter` *(object: `totalRequirements`, `completedCount`, `difficultyLabel`)* — feeds UI chips.
  - `shareMeta` *(object: `ogTitle`, `ogDescription`, `heroImage` optional, `ctaUrl`)*.
- **Validations**: `sections` cannot be empty; `heroTheme` fallback to stream default; `shareMeta.ogDescription` ≤ 200 chars.
- **State**: Derived at render time; no persistence beyond request cache.

### EngagementEvent (log entry)
- **Fields**: `timestamp` (ISO string), `sessionId`, `eventType` (`hero_click`, `filter_apply`, `share_copy`, `pdf_download`), `targetSlug`, `metadata` (JSON object with event-specific extras).
- **Validations**: `timestamp` must parse; `eventType` enumerated; `targetSlug` must exist in generated catalog; `metadata` ≤1 KB to prevent log bloat.
- **State**: Append-only JSON Lines stored in `generated/logs/audit.jsonl`.

### HighlightRanking (daily aggregate)
- **Fields**:
  - `generatedAt` (ISO timestamp)
  - `entries[]` list where each entry has `slug`, `score` (float), `rank` (1..n), `trend` (`up`, `down`, `steady`), `reason` (top driver: `hero_clicks`, `filter_hits`, etc.).
- **Validations**: At most one entry per slug; `rank` corresponds to sorted order; `score` ≥0; `generatedAt` within last 24h to be considered "fresh".
- **State**: Stored at `generated/metrics/highlight-ranking.json`; if stale, server falls back to Staff Picks from config.

### ExperienceCard (homepage rendering)
- **Fields**: `slug`, `title`, `summary`, `ctaLabel`, `heroImage`, `badgeCount`, `isManualOverride` (bool), `source` (`catalog`, `staff-pick`, `ranking`).
- **Relationships**: References `HighlightRanking` entry (auto) or configuration entry (manual).
- **Validations**: If `isManualOverride=true`, `source` must be `staff-pick`; `heroImage` optional but defaults to stream background; `badgeCount` is derived stage count (int).

### ShareArtifact
- **Fields**: `slug`, `type` (`link`, `pdf`, `print`), `payload` (object: e.g., link metadata, pdf path), `generatedAt`.
- **Usage**: Not persisted; created on-demand to feed share flows and export tasks.

## Relationships Diagram (textual)
```
CatalogEntry 1---1 StageLayoutModel
CatalogEntry 1---* EngagementEvent (targetSlug)
EngagementEvent *---1 HighlightRanking (aggregate)
HighlightRanking 1---* ExperienceCard (auto entries)
ExperienceCard *---1 StageLayoutModel (via slug)
StageLayoutModel 1---* ShareArtifact (per interaction)
```

## Validation & State Transitions
1. **Logging → Ranking**: As events append to `audit.jsonl`, the nightly script loads them, validates each entry, computes scores, and overwrites `highlight-ranking.json`. If no new events, `generatedAt` stays previous day and server marks ranking as `stale`, triggering Staff Picks fallback.
2. **Ranking → Homepage**: On server start (and after each refresh), homepage loader reads ranking file. If `isManualOverride` is set for a slug, that card takes precedence above the computed rank; otherwise order is determined by `rank`.
3. **Stage Render**: When `/content/:slug` loads, `StageLayoutModel` collects base YAML + Markdown metadata, injects hero theme, readiness list, and share metadata, then passes to view template.
4. **Share Artifact**: When user invokes share/export, server instantiates `ShareArtifact`, runs Playwright (for PDF) or copies OG metadata (link), emits `EngagementEvent`, and returns result. In failures, event logs `error` flag but user sees toast.

## Derived Data Rules
- Ranking scores = `(heroClicks * 3) + (filterHits * 2) + (shareActions)`; coefficients configurable in `config/catalog.yml`.
- Experience cards default copy uses `StageLayoutModel.summary`; manual overrides can provide `summaryOverride` and `ctaLabel`.
- Readiness checklist limited to 6 bullet points; remainder moves to collapsible "More" section to maintain visual balance.
