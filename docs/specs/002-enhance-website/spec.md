# Feature Specification: Website Experience Upgrade

**Feature Branch**: `002-enhance-website`  
**Created**: 26 Nov 2025  
**Status**: Draft  
**Input**: User description: "make the website more awesome"

## Clarifications

### Session 2025-11-26

- Q: How should the homepage hero/highlights be sourced? → A: Option B – rank automatically using engagement metrics captured from recent user interactions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guided Discovery Homepage (Priority: P1)

Unit leaders landing on the site are greeted with a visually rich hero, curated highlights, and quick filters that take them directly to relevant Outdoor Adventure Skills stages without scrolling through the raw index.

**Why this priority**: Homepage impressions drive the majority of drop-offs today; improving the first interaction delivers the broadest impact and can ship independently.

**Independent Test**: Can be fully validated by loading the homepage with a seeded catalog, interacting with the featured tiles/filters, and confirming the user reaches the intended content in ≤3 clicks.

**Acceptance Scenarios**:

1. **Given** a first-time visitor opens the homepage, **When** the curated hero and trending tiles render, **Then** at least three activity families are highlighted with descriptive copy and CTA buttons that deep-link to current stages.
2. **Given** a user selects a quick filter chip (e.g., "Stage 5+"), **When** the page updates, **Then** the featured list refreshes within 1 second to show only matching activities and surfaces the count of filtered results.

---

### User Story 2 - Immersive Stage Pages (Priority: P2)

Scouts and mentors opening any `/content/{stream}/{stage}` page see an upgraded layout: a summary hero, progress meter, collapsible prerequisites, and contextual callouts that explain why the requirements matter.

**Why this priority**: Content pages are the core of the experience; richer presentation keeps readers engaged and reduces misinterpretation, but depends on the discovery work in Story 1 to feed them.

**Independent Test**: Load any generated Markdown file through the server, confirm the new template renders with hero summary, progress chips, prerequisites accordion, and responsive typography on desktop/tablet/mobile breakpoints.

**Acceptance Scenarios**:

1. **Given** a visitor opens `.../alpine/cross-country-skiing-stage-5`, **When** the markdown is rendered, **Then** the page shows a themed banner, stage overview, quick "Readiness" checklist, and collapsible sections for Plan/Do/Review.
2. **Given** a user resizes the browser between 375px and 1440px widths, **When** the layout reflows, **Then** text remains readable (16px minimum body size) and interactive controls remain reachable without horizontal scrolling.

---

### User Story 3 - Share & Save Moments (Priority: P3)

Visitors can capture and distribute content by copying a rich preview link, downloading a styled PDF, or printing a simplified layout without developer help.

**Why this priority**: Sharing is an aspirational enhancement—valuable for councils preparing programs—but not a blocker for browsing.

**Independent Test**: Select "Share" on any stage, verify link preview data (title/summary/thumbnail) is generated, and confirm PDF/print renders match accessibility and branding rules.

**Acceptance Scenarios**:

1. **Given** a user activates the "Copy link" control, **When** the action completes, **Then** the clipboard receives a URL with Open Graph metadata so that pasting into chat renders a preview card.
2. **Given** a user selects "Download PDF", **When** the export finishes, **Then** the file contains the same content hierarchy with Scout branding, prints on A4 without clipping, and omits navigation chrome.

---

### Edge Cases

- No activities qualify for "Trending" due to missing metrics → show "Staff Picks" fallback curated manually in config.
- Content lacks a hero image or theme color → default to stream-specific palette defined in `docs/ui-style.md` to avoid blank/black screens.
- User attempts to load share/export features while offline → surface a non-blocking toast explaining the action requires connectivity and keep page usable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Homepage MUST present a hero banner plus three highlights that are automatically ranked each day using the latest engagement metrics (click-through and filter usage) stored in the logs pipeline, while still allowing CMS copy tweaks without code changes.
- **FR-002**: Homepage filters MUST update featured lists within 1 second using already-downloaded catalog data and show an empty-state card when no results match.
- **FR-003**: Content pages MUST wrap generated Markdown in a new layout that includes hero summary, readiness checklist, collapsible Plan/Do/Review blocks, and prominent "Start now" CTA linking back to catalog search.
- **FR-004**: Layout MUST remain fully responsive (desktop ≥1200px, tablet 768–1023px, mobile 360–767px) with readable typography and touch targets ≥44px.
- **FR-005**: Share action MUST provide copy-link, share sheet (where supported), and PDF/print export options that reuse the rendered content so requirements stay in sync.
- **FR-006**: System MUST capture anonymous interaction events (hero clicks, filter usage, share/export actions) and write them to the existing logs pipeline for later analysis.
- **FR-007**: Configuration MUST allow site admins to set fallback content for hero, highlights, and empty states via `config/catalog.yml` or companion JSON so non-developers can refresh messaging.

### Key Entities *(include if feature involves data)*

- **ExperienceCard**: Represents each homepage highlight with fields `title`, `summary`, `ctaLabel`, `targetSlug`, `theme`, `badgeCount`. Cards map to catalog items or manual promotions.
- **StageLayoutModel**: Aggregates generated Markdown metadata (stream, stage, prerequisites, difficulty) plus derived display properties (hero color, readiness checklist, progress meter values).
- **EngagementEvent**: Lightweight record persisted to logs containing `timestamp`, `sessionId`, `eventType`, `targetSlug`, and optional `metadata` (e.g., filter applied).
- **HighlightRanking**: Aggregated daily snapshot derived from EngagementEvent data containing `slug`, `score`, `lastUpdated`, and `reason`, used to populate homepage hero/highlights with automated ordering.

### Code Quality Expectations *(mandatory)*

- Linting/static analysis coverage: continue running `npm run lint`, `npm run typecheck`, and `npm run test` on touched `src/server`, `src/converters`, and `public` assets.
- Required refactors or debt removal: extract shared layout components for hero/accordion into reusable utilities to avoid duplicating markup inside Express views.
- Documentation updates: refresh `docs/ui-style.md`, add a "Sharing" section to `docs/catalog-management.md`, and document configuration knobs in `config/README` (create if absent).

### Testing Strategy *(mandatory)*

- Test suites required: unit tests for new layout helpers, integration tests covering `/content/:slug` rendering with sample Markdown, and end-to-end smoke covering homepage filters + share workflows.
- Acceptance scenarios mapped to tests: map P1 scenarios to integration/e2e IDs (e.g., `IT-homepage-filter-001`, `E2E-share-link-001`).
- Regression protections: snapshot rendered HTML for representative stages to detect accidental template regressions; add contract test ensuring share metadata remains populated.

### User Experience Standards *(mandatory for user-facing work)*

- Design tokens/components: apply color, typography, and spacing rules from `docs/ui-style.md`; reuse existing Scout gradients for hero banners.
- Accessibility requirements: comply with WCAG 2.1 AA (contrast ≥4.5:1, keyboard-focusable controls, skip-link, descriptive alt text on hero art).
- Content tone & terminology: follow "encouraging, action-oriented" voice outlined in `docs/ui-style.md`; use verbs such as "Plan", "Go", "Review" consistently.

### Performance Budgets *(mandatory for P1/P2 stories)*

- Target metrics: homepage interactive in ≤1.5s on a 3G Fast profile; content page largest element paints within 2s; PDF export completes in ≤5s for ≤5-page documents.
- Measurement approach: use existing Lighthouse script (if unavailable, add npm script) plus manual throttling via Chrome DevTools; log server-side render duration per request.
- Degradation thresholds & rollback: alert/rollback if homepage median load exceeds 2s for 3 consecutive deploys or if error rate for share/export >2%.

## Assumptions

- Existing catalog metadata contains enough tags (stream, stage, difficulty) to drive filters without schema changes.
- No authenticated user model is required; "awesome" improvements focus on presentation and lightweight telemetry only.
- PDF generation can reuse current Markdown-to-HTML pipeline with print styles rather than introducing third-party services.
- EngagementEvent data can be aggregated at least once daily (batch or streaming) so HighlightRanking always has fresh scores; when events are missing, system reverts to Staff Picks fallback defined in config.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 70% of homepage visits result in a click on a featured tile or filter within 30 days of launch (tracked via engagement events).
- **SC-002**: Median time-to-content (landing on any stage after entering the site) drops from the current baseline to ≤3 clicks/5 seconds for monitored sessions.
- **SC-003**: 90% of surveyed users rate the new content layout as "clear" or "very clear" in post-launch pulse checks during the first review cycle.
- **SC-004**: At least 200 share/print actions are successfully completed per month without exceeding the 2% error threshold, indicating adoption of export features.
