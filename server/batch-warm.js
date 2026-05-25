// =============================================================
// CACHE WARMER (provider-agnostic)
// =============================================================
// Iterates POPULAR_OCCUPATIONS and pings the running server's /api/analyze
// endpoint for each (no company specified, so the demo provider can serve
// them when ANALYZE_PROVIDER=auto or =demo). The server's existing data-store
// caches each result to disk → subsequent requests are zero-cost forever.
//
// Run with: npm run warm:popular
//
// Env:
//   API_URL   override server base URL (default http://localhost:3001)
//   WARM_DELAY_MS  ms to wait between requests (default 250)
// =============================================================

import "./env-setup.js";
import { POPULAR_OCCUPATIONS } from "./popular-occupations.js";

const API_URL = process.env.API_URL || "http://localhost:3001";
const DELAY_MS = Number(process.env.WARM_DELAY_MS || 250);

async function warmOne(occupation) {
  const t = Date.now();
  const r = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ occupation }),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status}: ${text.slice(0, 200)}`);
  }
  const json = await r.json();
  return {
    elapsed_ms: Date.now() - t,
    provider: json._provider || "unknown",
    cache: json._cache || "miss",
    score: json.score,
  };
}

(async () => {
  console.log(`============================================`);
  console.log(`Career AI Explorer — Cache Warmer`);
  console.log(`============================================`);
  console.log(`Target: ${API_URL}`);
  console.log(`Jobs:   ${POPULAR_OCCUPATIONS.length} occupations`);
  console.log(`Delay:  ${DELAY_MS}ms between requests\n`);

  // Verify the server is up
  try {
    const h = await fetch(`${API_URL}/health`);
    if (!h.ok) throw new Error(`health returned ${h.status}`);
  } catch (err) {
    console.error(`[FATAL] Server not reachable at ${API_URL}: ${err.message}`);
    console.error(`Start it first with: npm start`);
    process.exit(1);
  }

  let ok = 0, failed = 0;
  const startedAt = Date.now();
  const counts = { demo: 0, ollama: 0, anthropic: 0, unknown: 0 };

  for (let i = 0; i < POPULAR_OCCUPATIONS.length; i++) {
    const occ = POPULAR_OCCUPATIONS[i];
    const tag = `[${i + 1}/${POPULAR_OCCUPATIONS.length}]`;
    try {
      const r = await warmOne(occ);
      counts[r.provider] = (counts[r.provider] || 0) + 1;
      ok++;
      console.log(`${tag} ${occ.padEnd(28)} → score=${String(r.score).padStart(2)}  via=${r.provider.padEnd(10)} cache=${r.cache.padEnd(4)} ${r.elapsed_ms}ms`);
    } catch (err) {
      failed++;
      console.warn(`${tag} ${occ.padEnd(28)} FAILED: ${err.message}`);
    }
    if (DELAY_MS > 0 && i < POPULAR_OCCUPATIONS.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n============================================`);
  console.log(`Warmed ${ok}/${POPULAR_OCCUPATIONS.length} (${failed} failed) in ${elapsed}s`);
  console.log(`Provider breakdown: demo=${counts.demo} ollama=${counts.ollama} anthropic=${counts.anthropic}`);
  console.log(`============================================`);
  process.exit(failed > 0 ? 1 : 0);
})();
