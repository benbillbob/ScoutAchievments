# Research Log: Website Experience Upgrade

## Engagement Metric Aggregation for Homepage Ranking
- **Decision**: Build a lightweight Node script that ingests `generated/logs/audit.jsonl`, scores events per slug (hero clicks, filter hits), and writes a daily `generated/metrics/highlight-ranking.json` consumed by the server at startup.
- **Rationale**: Reuses existing logging format, avoids introducing new storage, and keeps deployment simple (cron or manual `npm run update-ranking`). Processing once per day satisfies spec requirements and minimizes runtime overhead.
- **Alternatives considered**:
  1. **Real-time database (e.g., SQLite/Redis)** – rejected because it adds operational burden and contradicts the "minimal build overhead" request.
  2. **External analytics service** – rejected due to privacy/air-gapped constraints and lack of offline support.

## Browser Smoke Testing Tooling
- **Decision**: Adopt Playwright CLI (already modern and well-supported) with a focused config that spins up the local server and runs two smoke specs (homepage filters, share modal).
- **Rationale**: Provides reliable cross-browser automation with minimal setup, integrates with existing TypeScript tooling, and can run headlessly in CI without bundlers.
- **Alternatives considered**:
  1. **Puppeteer-only scripts** – lighter API but lacks the assertion/test runner ergonomics needed for acceptance checks.
  2. **Cypress** – richer UI but imposes extra install/build overhead and doesn’t align with "minimal build" guidance.

## Performance Measurement & PDF Export Validation
- **Decision**: Use `lighthouse` via `npm` script for homepage/content budgets and leverage Playwright’s `page.pdf()` to benchmark PDF exports (<5s) while sharing CSS print styles between server rendering and export.
- **Rationale**: Lighthouse already measures TTI/LCP with throttling, while Playwright PDF generation avoids new dependencies (Puppeteer bundled). Reusing CSS ensures exports stay consistent with on-screen layout.
- **Alternatives considered**:
  1. **WebPageTest or external SaaS** – accurate but adds dependency on external services, conflicting with offline-friendly workflow.
  2. **wkhtmltopdf** – mature but heavy native binary, complicates cross-platform setups.
