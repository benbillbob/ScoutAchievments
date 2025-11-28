# Quickstart — Website Experience Upgrade

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Generate catalog Markdown** (skip if already up-to-date)
   ```bash
   npm run convert
   ```

3. **Produce engagement ranking data**
   - Run the upcoming script (to be added in Phase 2) `npm run rank-highlights` to transform `generated/logs/audit.jsonl` into `generated/metrics/highlight-ranking.json`.
   - Until telemetry exists, create a stub file with three entries to exercise the UI.

4. **Start the local server**
   ```bash
   npm run serve -- --port 4173 --watch
   ```
   - Homepage lives at `http://localhost:4173/`.
   - Stage pages remain at `/content/{stream}/{slug}`.

5. **Run automated checks**
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   npm run test:e2e  # Playwright smoke suite (homepage filters + share flows)
   npm run lighthouse  # Added script to verify performance budgets
   ```

6. **Troubleshooting**
   - If highlights are missing, confirm `generated/metrics/highlight-ranking.json` is fresh (<24h) or fall back to Staff Picks in `config/catalog.yml`.
   - For PDF failures, rerun `npm run test:e2e -- --project=pdf` to capture trace logs.
