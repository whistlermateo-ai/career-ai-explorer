// RSS news aggregator. Polls all feeds in feeds.js in parallel, normalizes the
// articles into a single shape, deduplicates by URL, and writes data/articles.json.
//
// Replaces the need for live web_search calls during news synthesis.
// Cost: $0. Runs in seconds.

import Parser from "rss-parser";
import { writeJson, readJsonCached } from "../data-store.js";
import { RSS_FEEDS } from "./feeds.js";

const PER_FEED_TIMEOUT_MS = 12_000; // bail on any single feed after 12s
const KEEP_PER_FEED = 30;            // most recent N articles per feed (keeps file size sane)
const MAX_AGE_DAYS = 30;             // drop articles older than 30 days

const parser = new Parser({
  timeout: PER_FEED_TIMEOUT_MS,
  headers: {
    "User-Agent": "CareerAIExplorer/1.0 (+https://github.com/career-ai-explorer; news aggregator for student career analysis tool)",
  },
});

function normalizeArticle(item, feed) {
  const dateText = item.isoDate || item.pubDate || item.date || null;
  let publishedAt = null;
  if (dateText) {
    const parsed = new Date(dateText);
    if (!isNaN(parsed.getTime())) publishedAt = parsed.toISOString();
  }

  return {
    title: (item.title || "").trim(),
    url: item.link || item.guid || "",
    summary: stripHtml(item.contentSnippet || item.content || item.summary || "").slice(0, 800),
    published_at: publishedAt,
    source_name: feed.name,
    source_category: feed.category,
    source_authority: feed.authority,
    source_trust_tier: feed.trust_tier || 2,  // 1=newswire, 2=specialty, 3=research, 4=primary
  };
}

function stripHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchOneFeed(feed) {
  try {
    const result = await parser.parseURL(feed.url);
    const items = (result.items || [])
      .slice(0, KEEP_PER_FEED)
      .map((item) => normalizeArticle(item, feed))
      .filter((a) => a.title && a.url);
    return { feed, items, ok: true };
  } catch (err) {
    return { feed, items: [], ok: false, error: err.message };
  }
}

/**
 * Run the aggregator. Polls all feeds in parallel, deduplicates by URL across
 * sources, drops anything older than MAX_AGE_DAYS, sorts newest-first, writes
 * data/articles.json.
 */
export async function runRssAggregator() {
  const startedAt = Date.now();
  console.log(`[rss] Polling ${RSS_FEEDS.length} feeds in parallel...`);

  const results = await Promise.all(RSS_FEEDS.map(fetchOneFeed));

  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const seen = new Set();
  const articles = [];
  let okCount = 0, failCount = 0, droppedOld = 0, droppedDup = 0;

  for (const r of results) {
    if (r.ok) okCount++;
    else { failCount++; console.warn(`  [fail] ${r.feed.name}: ${r.error}`); continue; }

    for (const a of r.items) {
      // De-dupe by URL
      if (seen.has(a.url)) { droppedDup++; continue; }
      // Drop too-old (some feeds publish ancient articles)
      if (a.published_at && new Date(a.published_at).getTime() < cutoff) { droppedOld++; continue; }
      seen.add(a.url);
      articles.push(a);
    }
  }

  // Sort newest first (articles without dates go to the end)
  articles.sort((a, b) => {
    const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
    const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
    return tb - ta;
  });

  const elapsed = Date.now() - startedAt;
  const output = {
    generated_at: new Date().toISOString(),
    elapsed_ms: elapsed,
    feeds_polled: RSS_FEEDS.length,
    feeds_succeeded: okCount,
    feeds_failed: failCount,
    article_count: articles.length,
    dropped_duplicate: droppedDup,
    dropped_too_old: droppedOld,
    articles,
  };

  await writeJson("articles.json", output);
  console.log(`[rss] Done · ${articles.length} articles · ${okCount}/${RSS_FEEDS.length} feeds · ${elapsed}ms`);
  return output;
}

/**
 * Filter loaded articles by topic — used by news.js / news-feed.js at request time.
 * @param {string[]} keywords - lowercase keywords; an article matches if any keyword appears in title or summary
 * @param {object} opts - { limit, minAuthority, sinceDays, requireAll }
 */
export async function filterArticles(keywords, opts = {}) {
  const { limit = 30, minAuthority = 1, sinceDays = 30, requireAll = false } = opts;
  // Cached read — the 176KB articles file isn't re-parsed on every analyze.
  const data = await readJsonCached("articles.json", { articles: [] });
  if (!data.articles || !data.articles.length) return [];

  const lcKeywords = keywords.map((k) => k.toLowerCase()).filter(Boolean);
  const cutoff = Date.now() - sinceDays * 24 * 60 * 60 * 1000;

  const matches = data.articles.filter((a) => {
    if ((a.source_authority || 1) < minAuthority) return false;
    if (a.published_at && new Date(a.published_at).getTime() < cutoff) return false;

    const haystack = `${a.title} ${a.summary}`.toLowerCase();
    if (lcKeywords.length === 0) return true;
    if (requireAll) return lcKeywords.every((k) => haystack.includes(k));
    return lcKeywords.some((k) => haystack.includes(k));
  });

  return matches.slice(0, limit);
}

// Allow direct invocation: `node server/aggregators/rss.js`
import { fileURLToPath } from "url";
import path from "path";
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  runRssAggregator()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}
