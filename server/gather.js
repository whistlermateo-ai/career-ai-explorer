// =============================================================
// DATA AGGREGATOR RUNNER
// =============================================================
// Runs all local-data aggregators that the analysis pipeline depends on.
// Cost: $0 (no LLM calls — only public APIs / RSS / official datasets).
// Run with: npm run gather
// Schedule via cron: 0 4 * * * cd /path/to/server && /usr/local/bin/npm run gather
//
// Ordering:
//   - Fast/parallel-safe aggregators run together
//   - Slow/rate-limited aggregators run sequentially after
// =============================================================

import { runRssAggregator } from "./aggregators/rss.js";
import { runOnetImporter } from "./aggregators/onet.js";
import { runLayoffsSync } from "./aggregators/layoffs.js";
import { runHnPulse } from "./aggregators/hn.js";
import { runArxivMonitor } from "./aggregators/arxiv.js";
import { runWikipediaEnricher } from "./aggregators/wikipedia.js";
import { runSecSync } from "./aggregators/sec.js";
import { runGithubTrending } from "./aggregators/github.js";
import { statFile } from "./data-store.js";

async function runOne(name, fn) {
  const startedAt = Date.now();
  try {
    await fn();
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`[OK] ${name} done in ${elapsed}s`);
    return { name, ok: true, elapsed_s: parseFloat(elapsed) };
  } catch (err) {
    console.error(`[FAIL] ${name} failed: ${err.message}`);
    return { name, ok: false, error: err.message };
  }
}

(async () => {
  const startedAt = Date.now();
  console.log(`============================================`);
  console.log(`Career AI Explorer — Data Gather Runner`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`============================================\n`);

  // GROUP 1 — fast, parallel-safe (no rate limits)
  console.log(`[group 1] Fast parallel aggregators (RSS, HN, GitHub, ArXiv)...`);
  const group1 = await Promise.all([
    runOne("RSS", runRssAggregator),
    runOne("HN AI Pulse", runHnPulse),
    runOne("GitHub Trending", runGithubTrending),
    runOne("ArXiv Monitor", runArxivMonitor),
  ]);

  console.log(`\n[group 2] Sequential rate-limited aggregators...`);

  // GROUP 2 — sequential (rate-limited APIs)
  const group2 = [];
  group2.push(await runOne("O*NET (downloads + extracts)", runOnetImporter));
  group2.push(await runOne("SEC EDGAR (per-company)", runSecSync));
  group2.push(await runOne("Wikipedia (per-occupation, rate-limited)", runWikipediaEnricher));
  group2.push(await runOne("Layoffs (best-effort)", runLayoffsSync));

  // SUMMARY
  const all = [...group1, ...group2];
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n============================================`);
  console.log(`Done in ${elapsed}s · ${all.filter(r => r.ok).length}/${all.length} aggregators succeeded`);
  console.log(`============================================`);

  // Print disk inventory
  console.log(`\nDisk cache inventory:`);
  const files = [
    "articles.json",
    "onet/occupations.json",
    "layoffs.json",
    "hn-pulse.json",
    "arxiv.json",
    "wikipedia.json",
    "companies/sec-edgar.json",
    "github-trending.json",
  ];
  for (const f of files) {
    const s = await statFile(f);
    console.log(`  ${f.padEnd(30)} ${s.exists ? `${s.size_kb}KB · ${s.age_hours}h old` : "(missing)"}`);
  }
  console.log(``);

  process.exit(all.every(r => r.ok) ? 0 : 1);
})();
