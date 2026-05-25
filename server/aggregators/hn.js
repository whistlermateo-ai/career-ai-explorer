// Hacker News AI Pulse via Algolia public API.
// Pulls top recent AI-themed stories with comment counts and points.
// Free, unlimited, no auth required.
// API docs: https://hn.algolia.com/api

import { writeJson } from "../data-store.js";

const ALGOLIA_BASE = "https://hn.algolia.com/api/v1";
const QUERIES = [
  "artificial intelligence",
  "machine learning",
  "GPT",
  "Claude",
  "AI safety",
  "AI regulation",
  "AI layoffs",
  "AI replace",
];
const PER_QUERY_LIMIT = 15;
const SINCE_HOURS = 168; // 7 days

async function fetchOneQuery(query) {
  const since = Math.floor((Date.now() - SINCE_HOURS * 3600 * 1000) / 1000);
  const url = `${ALGOLIA_BASE}/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=${PER_QUERY_LIMIT}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();
  return (data.hits || []).map((h) => ({
    title: h.title || "",
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    hn_url: `https://news.ycombinator.com/item?id=${h.objectID}`,
    points: h.points || 0,
    comments: h.num_comments || 0,
    author: h.author || "",
    created_at: h.created_at || null,
    matched_query: query,
  }));
}

export async function runHnPulse() {
  const startedAt = Date.now();
  console.log(`[hn] Pulling AI-tagged top stories from HN Algolia (${QUERIES.length} queries, ${SINCE_HOURS}h window)...`);

  const allHits = [];
  let okCount = 0, failCount = 0;
  for (const query of QUERIES) {
    try {
      const hits = await fetchOneQuery(query);
      allHits.push(...hits);
      okCount++;
    } catch (err) {
      console.warn(`  [hn] query "${query}" failed: ${err.message}`);
      failCount++;
    }
  }

  // Dedupe by URL — a single story might match multiple queries
  const seen = new Map(); // url -> story
  for (const h of allHits) {
    const key = h.url;
    if (!seen.has(key)) {
      seen.set(key, h);
    } else {
      // Merge — track all queries that matched
      const existing = seen.get(key);
      const matched = new Set([existing.matched_query, h.matched_query].flat().filter(Boolean));
      existing.matched_query = [...matched];
    }
  }

  // Sort by points (proxy for community attention)
  const stories = [...seen.values()].sort((a, b) => b.points - a.points);

  const output = {
    generated_at: new Date().toISOString(),
    elapsed_ms: Date.now() - startedAt,
    queries_succeeded: okCount,
    queries_failed: failCount,
    window_hours: SINCE_HOURS,
    story_count: stories.length,
    stories,
  };
  await writeJson("hn-pulse.json", output);
  console.log(`[hn] Done · ${stories.length} unique stories · ${okCount}/${QUERIES.length} queries succeeded`);
  return output;
}

// Direct invocation
import { fileURLToPath } from "url";
import path from "path";
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runHnPulse().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
