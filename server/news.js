// Per-occupation news fetcher.
//
// REWRITTEN: now reads from data/articles.json (populated by the RSS aggregator)
// instead of paying for `web_search` on every request. The LLM only summarizes
// pre-collected articles → ~95% cheaper than the old web_search version.
//
// Falls back to web_search if data/articles.json is missing or empty.

import "./env-setup.js";
import Anthropic from "@anthropic-ai/sdk";
import { filterArticles } from "./aggregators/rss.js";

const client = new Anthropic();

const newsCache = new Map();
const inFlight = new Map();
const NEWS_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const NEWS_TIMEOUT_MS = 25_000;

// =====================================================
// SYNTHESIS PROMPT — used when local articles are available
// =====================================================
const LOCAL_SYNTHESIS_SYSTEM = `You are a news research analyst supporting a career-AI-risk analysis tool.

You will be given a list of recent news articles, each tagged with a trust tier:
  - Tier 1 — newswires and papers of record (BBC, NYT, Bloomberg, WSJ, FT, Guardian)
  - Tier 2 — specialty tech/science journalism (MIT Technology Review, IEEE Spectrum, Wired, Ars Technica, The Verge)
  - Tier 3 — research institutions (MIT News, Pew Research, Science Daily)
  - Tier 4 — primary sources (OpenAI, DeepMind blogs — these are companies talking about themselves)

YOUR JOB:
1. Pick the 3-6 most relevant articles, PREFERRING higher tiers (1 > 2 > 3 > 4)
2. When you cite a Tier 4 primary source, frame it as "X announced..." not as independent reporting
3. Output a single JSON object

JSON shape (output ONLY this, no preamble, no markdown fences):

{
  "summary": "2-3 sentence synthesis of what the news collectively means for this occupation",
  "headlines": [
    {
      "title": "as it appeared",
      "source": "publication name",
      "date_text": "approximate date e.g. 'Mar 12, 2026' or '~3 weeks ago'",
      "summary": "1-2 sentence summary of why this matters",
      "url": "the URL from the input",
      "relevance": "high | medium | low",
      "trust_tier": 1
    }
  ]
}

Pick articles that are actually about: AI capability advances affecting the named occupation, workforce news (layoffs, hiring shifts), AI tooling rollouts, or industry-wide automation trends. If only loosely-related articles are available, output empty headlines and a one-line summary noting the gap. NEVER cite an article that wasn't in the input.`;

// =====================================================
// FALLBACK PROMPT — used if local articles aren't available (live web_search)
// =====================================================
const WEB_SEARCH_SYSTEM = `You are a news research analyst. Use web_search to find 5-7 recent news developments from the last 60 days for the user's topic, then output a JSON object with the same shape as a local synthesis.

Output ONLY this JSON (no preamble, no markdown):

{
  "summary": "...",
  "headlines": [
    { "title": "...", "source": "...", "date_text": "...", "summary": "...", "url": "...", "relevance": "high|medium|low" }
  ]
}`;

function cacheKey(occupation, company) {
  return `${(occupation || "").trim().toLowerCase()}::${(company || "").trim().toLowerCase()}`;
}

export async function fetchNewsForTopic(occupation, company) {
  const key = cacheKey(occupation, company);

  // In-memory cache
  const cached = newsCache.get(key);
  if (cached && Date.now() - cached.cachedAt < NEWS_TTL_MS) {
    return { ...cached.result, _cached: true };
  }

  if (inFlight.has(key)) return inFlight.get(key);

  let timer;
  const fetchPromise = doFetch(occupation, company);
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`News fetch timed out after ${NEWS_TIMEOUT_MS}ms`)), NEWS_TIMEOUT_MS);
  });

  const promise = Promise.race([fetchPromise, timeoutPromise])
    .then((result) => {
      newsCache.set(key, { result, cachedAt: Date.now() });
      return { ...result, _cached: false };
    })
    .catch((err) => {
      console.warn(`[news] Fetch failed for "${key}":`, err.message);
      return { summary: "", headlines: [], _cached: false, _error: err.message };
    })
    .finally(() => {
      if (timer) clearTimeout(timer); // clean up the racing timeout regardless of which side won
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

async function doFetch(occupation, company) {
  // Build keyword list to filter local articles
  const keywords = buildKeywords(occupation, company);

  // Try to use locally-aggregated articles first (free, fast, no web_search cost)
  const articles = await filterArticles(keywords, { limit: 30, minAuthority: 1, sinceDays: 60 });

  if (articles.length >= 3) {
    return await synthesizeFromLocal(occupation, company, articles);
  }

  // Fallback: live web_search if we don't have enough local context
  console.warn(`[news] Only ${articles.length} local articles for "${occupation}${company ? ' @ ' + company : ''}" — falling back to web_search`);
  return await fetchViaWebSearch(occupation, company);
}

function buildKeywords(occupation, company) {
  const occupationKeywords = [occupation.toLowerCase()];
  // Add a few related terms based on the occupation type
  if (/developer|engineer|programmer/i.test(occupation)) {
    occupationKeywords.push("software", "programming", "code", "engineering");
  }
  if (/doctor|nurse|surgeon|therapist|pharmacist/i.test(occupation)) {
    occupationKeywords.push("healthcare", "medical", "physician", "clinician");
  }
  if (/lawyer|paralegal|judge|attorney/i.test(occupation)) {
    occupationKeywords.push("legal", "law firm", "attorney");
  }
  if (/accountant|analyst|banker|trader/i.test(occupation)) {
    occupationKeywords.push("finance", "banking", "wall street");
  }
  if (/teacher|professor/i.test(occupation)) {
    occupationKeywords.push("education", "classroom", "school");
  }
  if (/designer/i.test(occupation)) {
    occupationKeywords.push("design", "creative");
  }

  // Always include "AI" + a related term
  occupationKeywords.push("AI", "automation");

  if (company) occupationKeywords.push(company.toLowerCase());
  return occupationKeywords;
}

async function synthesizeFromLocal(occupation, company, articles) {
  const startedAt = Date.now();

  // Sort articles by trust tier (1 first) then by date (newest first) so the model
  // sees the most authoritative items at the top of its context.
  const sorted = [...articles].sort((a, b) => {
    const tierDiff = (a.source_trust_tier || 2) - (b.source_trust_tier || 2);
    if (tierDiff !== 0) return tierDiff;
    const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
    const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
    return tb - ta;
  });

  const articleBlock = sorted.map((a, i) => {
    const date = a.published_at ? a.published_at.split("T")[0] : "(no date)";
    const tier = a.source_trust_tier || 2;
    return `${i + 1}. [Tier ${tier} · ${a.source_name}, ${date}] ${a.title}\n   URL: ${a.url}\n   ${a.summary?.slice(0, 300) || ""}`;
  }).join("\n\n");

  const userMessage = company
    ? `Occupation: ${occupation}\nCompany: ${company}\n\nRECENT ARTICLES (${articles.length} pre-collected):\n\n${articleBlock}\n\nReturn the JSON synthesis per the system instructions.`
    : `Occupation: ${occupation}\n\nRECENT ARTICLES (${articles.length} pre-collected):\n\n${articleBlock}\n\nReturn the JSON synthesis per the system instructions.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2000,
    system: [
      { type: "text", text: LOCAL_SYNTHESIS_SYSTEM, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const elapsed = Date.now() - startedAt;
  console.log(`[news] Local synthesis "${occupation}${company ? ' @ ' + company : ''}" in ${elapsed}ms (${articles.length} articles, ${response.usage.output_tokens} out tokens)`);

  return parseJsonResponse(response);
}

async function fetchViaWebSearch(occupation, company) {
  const userMessage = company
    ? `Topic: AI displacement risk for "${occupation}" — specifically at ${company}.\n\nFind recent news per the system instructions and return the JSON.`
    : `Topic: AI displacement risk for "${occupation}".\n\nFind recent news per the system instructions and return the JSON.`;

  const startedAt = Date.now();
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4000,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
    system: [
      { type: "text", text: WEB_SEARCH_SYSTEM, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const elapsed = Date.now() - startedAt;
  console.log(`[news] Web search fallback for "${occupation}${company ? ' @ ' + company : ''}" in ${elapsed}ms`);
  return parseJsonResponse(response);
}

function parseJsonResponse(response) {
  const textBlocks = response.content.filter((b) => b.type === "text");
  const fullText = textBlocks.map((b) => b.text).join("\n").trim();
  const cleaned = fullText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "")
    .trim();

  let parsed = { summary: "", headlines: [] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch (e) { console.warn("[news] JSON parse failed:", e.message); }
    }
  }

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    headlines: Array.isArray(parsed.headlines) ? parsed.headlines.slice(0, 7) : [],
  };
}

export function formatNewsContext(news) {
  if (!news || (!news.summary && (!news.headlines || news.headlines.length === 0))) return "";
  let block = "RECENT NEWS CONTEXT (from local article store, refreshed regularly):\n\n";
  if (news.summary) block += `SYNTHESIS: ${news.summary}\n\n`;
  if (news.headlines && news.headlines.length) {
    block += "HEADLINES:\n";
    news.headlines.forEach((h, i) => {
      block += `${i + 1}. [${h.source || "Unknown"}, ${h.date_text || "recent"}] ${h.title || ""}\n`;
      if (h.summary) block += `   Why it matters: ${h.summary}\n`;
      if (h.url) block += `   URL: ${h.url}\n`;
    });
    block += "\n";
  }
  block += "Use this context to inform your analysis. Cite specific developments in the evidence_ledger and surface the most consequential ones in recent_developments.\n";
  return block;
}

export function newsCacheStats() {
  const now = Date.now();
  let fresh = 0, stale = 0;
  for (const [, v] of newsCache) {
    if (now - v.cachedAt < NEWS_TTL_MS) fresh++;
    else stale++;
  }
  return { fresh, stale, total: newsCache.size, in_flight: inFlight.size };
}
