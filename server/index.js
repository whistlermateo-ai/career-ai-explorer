// Career AI Explorer — backend API
// Takes { occupation, company? } and returns a structured AI-displacement-risk
// analysis from Claude. Uses prompt caching on the system prompt + reference
// data block, and forces structured output via tool_use.

import "./env-setup.js"; // MUST be first — loads .env and overrides any empty pre-existing vars
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

import { fetchNewsForTopic, formatNewsContext, newsCacheStats } from "./news.js";
// (news-feed module removed — the standalone AI news briefing page was deleted)
import { loadCache, saveCache, inspectCache } from "./cache-store.js";
import { buildGroundingContext } from "./context-injector.js";
import { analyze as providerAnalyze, providerStatus } from "./providers/index.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ---- Voices: industry-keyed quote bank ----
// Loaded once at startup. Used to attach 2-3 thought-leader quotes to every
// /api/analyze response so the frontend "Voices" card always has something to
// render — including for fresh occupations not in the demo set.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let VOICES = {};
try {
  const raw = await readFile(join(__dirname, "data", "voices.json"), "utf-8");
  VOICES = JSON.parse(raw);
  const counts = Object.entries(VOICES)
    .filter(([k]) => !k.startsWith("_"))
    .map(([k, v]) => `${k}:${Array.isArray(v) ? v.length : 0}`).join(" ");
  console.log(`[voices] loaded — ${counts}`);
} catch (e) {
  console.warn("[voices] failed to load voices.json — voices will be empty:", e.message);
}

// Map an occupation string to one of the 8 industries. Simple keyword matching;
// falls back to "tech" since that's our most-likely default audience.
function industryForOccupation(occupation = "") {
  const o = occupation.toLowerCase();
  const match = (...words) => words.some(w => o.includes(w));
  if (match("nurse", "doctor", "physician", "surgeon", "therapist", "dentist",
           "pharmacist", "paramedic", "medical", "clinic", "hospital", "radiolog",
           "veterinar", "psycholog", "midwife")) return "healthcare";
  if (match("lawyer", "paralegal", "attorney", "legal", "judge", "law clerk",
           "compliance officer", "notary")) return "legal";
  if (match("accountant", "auditor", "financial analyst", "banker", "trader",
           "actuary", "underwriter", "bookkeep", "tax", "investment", "loan",
           "wealth", "broker", "insurance")) return "finance";
  if (match("electrician", "plumber", "carpenter", "welder", "weld", "mechanic",
           "construction", "hvac", "roofer", "mason", "stonemason", "truck driver",
           "driver", "machinist", "technician", "installer", "operator", "miner",
           "farmer", "blacksmith", "locksmith", "watchmaker", "cobbler", "cooper",
           "wheelwright", "wainwright", "saddler", "currier", "fletcher", "thatcher",
           "bookbinder", "hatmaker", "lithographer", "beekeeper", "falconer",
           "taxiderm", "lighthouse")) return "trades";
  if (match("teacher", "professor", "instructor", "tutor", "educator",
           "principal", "librarian", "coach", "counselor")) return "education";
  if (match("scientist", "researcher", "biolog", "chemist", "physicist",
           "geolog", "astronom", "mathemati", "statistician", "epidemiolog",
           "cartograph", "marine biolog")) return "sciences";
  if (match("designer", "artist", "writer", "journalist", "photographer",
           "illustrator", "musician", "filmmaker", "director", "editor",
           "animator", "copywriter", "creative", "architect", "calligraph",
           "perfumer", "glassblow", "sommelier", "foley", "puppeteer",
           "bagpiper", "bell ringer", "chandler", "mahout")) return "creative";
  if (match("developer", "engineer", "programmer", "data scientist",
           "software", "devops", "sysadmin", "it ", "cybersecur", "machine learning",
           "ai ", "product manager", "ux", "ui ", "qa ", "tester")) return "tech";
  return "general"; // default — broadly-applicable quotes/changes, not tech-specific
}

function voicesForOccupation(occupation) {
  const ind = industryForOccupation(occupation);
  let pool = Array.isArray(VOICES[ind]) ? VOICES[ind] : [];
  // If a bucket is empty (e.g. "general" before it's curated), fall back to a
  // safe non-tech bucket so we never return zero quotes.
  if (pool.length === 0 && Array.isArray(VOICES.general)) pool = VOICES.general;
  return { industry: ind, quotes: pool.slice(0, 3) };
}

// Curated recent AI-related developments by industry. These are evergreen
// "what's changing" cards shown in the analysis page — chosen because the
// model itself rarely returns reliable, occupation-specific news.
const CHANGES = {
  healthcare: [
    { headline: "FDA clears more AI diagnostic tools each quarter", impact: "Radiology, pathology, and dermatology are seeing AI second-readers move into routine clinical workflows.", source: "FDA", date_text: "2024", url: "https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-aiml-enabled-medical-devices", source2: "Nature Medicine", url2: "https://www.nature.com/nm/" },
    { headline: "Hospitals deploy ambient AI scribes at scale", impact: "Major US health systems report clinicians saving 1–2 hours of documentation per day.", source: "JAMA", date_text: "2024", url: "https://jamanetwork.com/journals/jama/fullarticle/2825147", source2: "NEJM Catalyst", url2: "https://catalyst.nejm.org/" },
    { headline: "Drug discovery accelerates with foundation models", impact: "AI-designed candidates are entering Phase I trials within months instead of years.", source: "Nature", date_text: "2024", url: "https://www.nature.com/articles/d41586-023-03172-6", source2: "Science", url2: "https://www.science.org/topic/artificial-intelligence" },
  ],
  legal: [
    { headline: "AI contract review reaches enterprise adoption", impact: "Top-100 law firms report cutting document review hours by 60–80% on standard agreements.", source: "Thomson Reuters", date_text: "2024", url: "https://www.thomsonreuters.com/en/artificial-intelligence/generative-ai-in-legal.html", source2: "Stanford CodeX", url2: "https://law.stanford.edu/codex-the-stanford-center-for-legal-informatics/" },
    { headline: "Courts publish guidance on AI in filings", impact: "Multiple jurisdictions now require disclosure when AI assists in drafting legal documents.", source: "ABA Journal", date_text: "2024", url: "https://www.abajournal.com/topic/artificial-intelligence", source2: "Reuters Legal", url2: "https://www.reuters.com/legal/" },
    { headline: "Paralegal job postings shift toward AI oversight", impact: "New listings emphasize prompt review, citation verification, and AI output audit skills.", source: "LinkedIn Economic Graph", date_text: "2024", url: "https://economicgraph.linkedin.com/", source2: "BLS Occupational Outlook", url2: "https://www.bls.gov/ooh/legal/paralegals-and-legal-assistants.htm" },
  ],
  finance: [
    { headline: "Banks roll out AI copilots to analysts and traders", impact: "JPMorgan, Morgan Stanley, and Goldman now offer LLM tools to thousands of frontline staff.", source: "Reuters", date_text: "2024", url: "https://www.reuters.com/technology/artificial-intelligence/", source2: "Bloomberg", url2: "https://www.bloomberg.com/technology/ai" },
    { headline: "Audit automation hits routine reconciliation work", impact: "Big-Four firms report AI handling first-pass review on a growing share of engagements.", source: "WSJ", date_text: "2024", url: "https://www.wsj.com/tech/ai", source2: "Journal of Accountancy", url2: "https://www.journalofaccountancy.com/topics/technology.html" },
    { headline: "Robo-advice AUM continues climbing", impact: "Algorithmic platforms now manage over $1 trillion globally, pressuring entry-level advisory roles.", source: "OECD", date_text: "2024", url: "https://www.oecd.org/finance/financial-markets/", source2: "SEC Investor Bulletin", url2: "https://www.sec.gov/investor/alerts/ib_robo-advisers.pdf" },
  ],
  trades: [
    { headline: "Hands-on trades remain among the least automated", impact: "Physical, in-situ work captures very little AI use today; trades have the lowest exposure of any major occupation group.", source: "Anthropic Economic Index", date_text: "2024", url: "https://www.anthropic.com/news/the-anthropic-economic-index", source2: "BLS Occupational Outlook", url2: "https://www.bls.gov/ooh/construction-and-extraction/" },
    { headline: "AI moves into estimating, scheduling, and dispatch", impact: "Back-office tasks for skilled-trades businesses are being absorbed by AI assistants, not the field work itself.", source: "McKinsey", date_text: "2024", url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights", source2: "OECD Employment Outlook", url2: "https://www.oecd.org/employment/oecd-employment-outlook-19991266.htm" },
    { headline: "AR + AI tools enter the field for diagnostics", impact: "Technicians use phone-based vision models to identify parts and walk through repairs in real time.", source: "IEEE Spectrum", date_text: "2024", url: "https://spectrum.ieee.org/artificial-intelligence", source2: "MIT Technology Review", url2: "https://www.technologyreview.com/topic/artificial-intelligence/" },
  ],
  education: [
    { headline: "Universities update curricula to assume AI in the loop", impact: "Programs add prompt-craft, verification, and AI-direction skills as core competencies.", source: "Inside Higher Ed", date_text: "2024", url: "https://www.insidehighered.com/news/tech-innovation/artificial-intelligence", source2: "Chronicle of Higher Education", url2: "https://www.chronicle.com/section/Technology/30" },
    { headline: "K-12 districts pilot AI tutors at scale", impact: "Khanmigo, MagicSchool, and others reach millions of students with personalized practice.", source: "EdSurge", date_text: "2024", url: "https://www.edsurge.com/research/special-reports/state-of-edtech-2024", source2: "Education Week", url2: "https://www.edweek.org/technology/artificial-intelligence" },
    { headline: "Teacher workload tools see fast adoption", impact: "Lesson planning, rubric drafting, and feedback writing are common AI use-cases in surveys.", source: "RAND", date_text: "2024", url: "https://www.rand.org/pubs/research_reports/RRA956-21.html", source2: "Brookings", url2: "https://www.brookings.edu/topic/artificial-intelligence/" },
  ],
  sciences: [
    { headline: "AlphaFold reshapes structural biology research", impact: "Predicted protein structures are now a default starting point for experimental design.", source: "Nature", date_text: "2024", url: "https://www.nature.com/articles/s41586-024-07487-w", source2: "Science", url2: "https://www.science.org/doi/10.1126/science.abj8754" },
    { headline: "AI accelerates materials discovery", impact: "Self-driving labs at DeepMind and academic partners produce new candidate materials at unprecedented rates.", source: "Science", date_text: "2024", url: "https://www.science.org/doi/10.1126/science.adi6993", source2: "Nature", url2: "https://www.nature.com/articles/s41586-023-06734-w" },
    { headline: "Field research adopts AI-powered sensing", impact: "Computer vision and bioacoustics tools are standard in ecology, conservation, and marine surveys.", source: "PNAS", date_text: "2024", url: "https://www.pnas.org/topic/sustainability-science", source2: "MIT Technology Review", url2: "https://www.technologyreview.com/topic/artificial-intelligence/" },
  ],
  creative: [
    { headline: "Generative tools enter mainstream creative pipelines", impact: "Studios and agencies use AI for ideation, layout, voice, and music drafts — finals still human-finished.", source: "Reuters", date_text: "2024", url: "https://www.reuters.com/technology/artificial-intelligence/", source2: "Variety", url2: "https://variety.com/v/digital/" },
    { headline: "Stock-image and stock-music markets compress", impact: "AI-generated assets are taking share from libraries that once monetized routine creative output.", source: "The Verge", date_text: "2024", url: "https://www.theverge.com/ai-artificial-intelligence", source2: "WIRED", url2: "https://www.wired.com/tag/artificial-intelligence/" },
    { headline: "Provenance standards (C2PA) gain industry backing", impact: "Major platforms and cameras commit to content credentials so human-made work can be marked as such.", source: "C2PA", date_text: "2024", url: "https://c2pa.org/", source2: "BBC News", url2: "https://www.bbc.com/news/technology" },
  ],
  tech: [
    { headline: "AI coding assistants see broad enterprise adoption", impact: "Major firms report 25–30% of new code is now AI-generated and reviewed by engineers.", source: "Reuters", date_text: "2024", url: "https://www.reuters.com/technology/artificial-intelligence/", source2: "Stack Overflow Developer Survey", url2: "https://survey.stackoverflow.co/2024/ai" },
    { headline: "Labor market data shows AI exposure rising for cognitive jobs", impact: "Goldman Sachs and OECD analyses converge on roughly two-thirds of jobs being partially exposed.", source: "Goldman Sachs Research", date_text: "2024", url: "https://www.goldmansachs.com/intelligence/pages/generative-ai-could-raise-global-gdp-by-7-percent.html", source2: "OECD Employment Outlook", url2: "https://www.oecd.org/employment/oecd-employment-outlook-19991266.htm" },
    { headline: "Education and tooling shift to assume AI is in the loop", impact: "Universities and bootcamps update curricula to emphasize judgment and AI direction over rote production.", source: "Inside Higher Ed", date_text: "2024", url: "https://www.insidehighered.com/news/tech-innovation/artificial-intelligence", source2: "Stanford HAI", url2: "https://hai.stanford.edu/research/ai-index-report" },
  ],
  general: [
    { headline: "Anthropic Economic Index maps real AI usage across the workforce", impact: "Use is concentrated in writing, coding, and analysis — physical and interpersonal work see far less AI involvement.", source: "Anthropic", date_text: "2024", url: "https://www.anthropic.com/news/the-anthropic-economic-index", source2: "MIT Technology Review", url2: "https://www.technologyreview.com/topic/artificial-intelligence/" },
    { headline: "OECD: about 60% of jobs in advanced economies are exposed to AI", impact: "Exposure does not mean replacement — most exposed roles are expected to be transformed rather than eliminated.", source: "OECD Employment Outlook", date_text: "2024", url: "https://www.oecd.org/employment/oecd-employment-outlook-19991266.htm", source2: "Goldman Sachs Research", url2: "https://www.goldmansachs.com/intelligence/pages/generative-ai-could-raise-global-gdp-by-7-percent.html" },
    { headline: "Labor market shifts toward AI-complementary skills", impact: "Postings increasingly ask for judgment, verification, and direction of AI tools — not just task execution.", source: "LinkedIn Economic Graph", date_text: "2024", url: "https://economicgraph.linkedin.com/", source2: "WEF Future of Jobs Report 2025", url2: "https://www.weforum.org/publications/the-future-of-jobs-report-2025/" },
  ],
};

function changesForOccupation(occupation) {
  const ind = industryForOccupation(occupation);
  const pool = Array.isArray(CHANGES[ind]) ? CHANGES[ind] : CHANGES.general;
  return pool.slice(0, 3);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Anthropic key is now optional — only required if anthropic provider gets used.
// If absent, demo + ollama still work; anthropic fallback will throw at request time.
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("[startup] ANTHROPIC_API_KEY not set — demo + ollama providers will still work, but anthropic fallback will fail.");
}

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

app.use(cors()); // permissive for local development; lock down for production
app.use(express.json({ limit: "1mb" }));

// In-memory cache so repeated queries during a session return instantly.
// Keyed by lowercase "occupation::company".
// Seeded from disk on startup (batch-warm.js writes there) and persisted
// after every successful fresh analysis so results survive restarts.
const resultCache = new Map();
// 24h TTL — matches the news cache TTL in news.js so cached analyses don't
// outlive the freshness of the news embedded inside them.
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

// Debounced disk save — coalesces rapid writes after multiple analyses complete
let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveCache(resultCache).catch((e) => console.warn("[cache] save failed:", e.message));
  }, 5000);
}

function cacheKey(occupation, company) {
  return `${(occupation || "").trim().toLowerCase()}::${(company || "").trim().toLowerCase()}`;
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    model: "claude-sonnet-4-6",
    cached_entries: resultCache.size,
    news_cache: newsCacheStats(),
  });
});

// (AI news digest endpoint removed — the standalone news briefing page is gone.
//  Per-occupation recent news still lives in /api/analyze via fetchNewsForTopic.)

// Transparent source list — what RSS feeds we're actually pulling from,
// with their trust tier and editorial standards note.
app.get("/api/sources", async (_req, res) => {
  try {
    const { getSourceList } = await import("./aggregators/feeds.js");
    res.json({ sources: getSourceList(), generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Track in-flight requests so duplicate concurrent calls share one upstream call
const inFlight = new Map(); // key -> Promise

function getOrFetch(cleanOcc, cleanCo) {
  const key = cacheKey(cleanOcc, cleanCo);

  // CACHE DISABLED — every analysis is freshly generated by the AI so the
  // user sees real "researching" time, not a recycled response. The user
  // explicitly asked for this: "It should be loading the latest information
  // into the evaluation, so we shouldn't have any preloaded ones. It should
  // be specifically for that time that we've made the request."
  //
  // The disk cache writes still happen (analyzeAndCache stashes the result)
  // for warm-up scripts and dev convenience — but reads are bypassed so every
  // user request triggers a fresh upstream call.

  // De-dupe concurrent identical requests (this is request coalescing, NOT
  // caching — two clicks within 200ms still share one real upstream call).
  if (inFlight.has(key)) {
    return inFlight.get(key).then((r) => ({ result: r, hit: false }));
  }

  // Cold — fetch fresh
  const promise = analyzeAndCache(cleanOcc, cleanCo).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise.then((r) => ({ result: r, hit: false }));
}

app.post("/api/analyze", async (req, res) => {
  const { occupation, company } = req.body || {};
  if (!occupation || typeof occupation !== "string" || occupation.trim().length === 0) {
    return res.status(400).json({ error: "Missing required field: occupation (string)." });
  }
  const cleanOcc = occupation.trim();
  const cleanCo = (company || "").trim();

  try {
    const { result, hit } = await getOrFetch(cleanOcc, cleanCo);
    // Always (re-)attach voices on the way out. This covers cache entries that
    // were warmed before the voices feature shipped, and is cheap (in-memory lookup).
    const voices = (result.voices && result.voices.quotes && result.voices.quotes.length)
      ? result.voices
      : voicesForOccupation(cleanOcc);
    // Recent developments: combine model-generated occupation-specific items
    // (when present and well-formed) with the curated industry-bucket fallback.
    // The model contribution adds specificity to the searched occupation; the
    // curated content adds source-credibility anchors. Cap total at 3 cards.
    const curated = changesForOccupation(cleanOcc);
    const modelGenerated = (Array.isArray(result.recent_developments) ? result.recent_developments : [])
      .filter((r) => r && typeof r === "object" && r.headline && (r.impact || r.summary));
    const recent_developments = (modelGenerated.length
      ? [...modelGenerated.slice(0, 2), ...curated.slice(0, 1)]
      : curated
    ).slice(0, 3);
    res.json({ ...result, voices, recent_developments, _cache: hit ? "hit" : "miss" });
  } catch (err) {
    console.error("Analyze error:", err);
    if (Anthropic.RateLimitError && err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "Rate limited by Anthropic. Try again in a moment." });
    if (Anthropic.AuthenticationError && err instanceof Anthropic.AuthenticationError) return res.status(401).json({ error: "Invalid ANTHROPIC_API_KEY." });
    if (Anthropic.APIError && err instanceof Anthropic.APIError) return res.status(err.status || 500).json({ error: `Anthropic API error: ${err.message}` });
    res.status(500).json({ error: `Internal error: ${err.message || String(err)}` });
  }
});

// Surfaces which provider would handle the next request, for the frontend.
app.get("/api/provider-status", async (req, res) => {
  const occ = (req.query.occupation || "").toString();
  try {
    const status = await providerStatus(occ);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Speculative prefetch — frontend fires this on hover or modal-submit, response is fire-and-forget
app.post("/api/prefetch", (req, res) => {
  const { occupation, company } = req.body || {};
  if (!occupation || typeof occupation !== "string" || occupation.trim().length === 0) {
    return res.status(400).json({ error: "Missing occupation" });
  }
  const cleanOcc = occupation.trim();
  const cleanCo = (company || "").trim();
  // Don't await — return immediately, let the request fill the cache in the background
  getOrFetch(cleanOcc, cleanCo).catch((e) => console.warn("Prefetch failed:", e.message));
  res.status(202).json({ status: "prefetching" });
});

// Cache existence check — frontend can ask "is this ready?" without triggering work
app.get("/api/cache-status", (req, res) => {
  // Always report cached=false. The cache READ is disabled in getOrFetch so
  // every analyze request triggers a fresh AI generation. Reporting cached
  // would make the frontend skip its smart-paced loader and show all step
  // checkmarks immediately — misleading the user into thinking it's done
  // when fresh generation is still running.
  res.json({ cached: false, in_flight: false });
});

// =====================================================
// STARTUP CACHE WARMING
// Pre-analyze the top occupations in the background so
// first-time visitors get instant results.
// =====================================================

// Reduced to a small set of high-traffic occupations. Warmup runs sequentially
// AND skips news fetching (news will be fetched fresh on first user query for
// any occupation, since fresh news is the value-add of that pipeline).
const WARM_OCCUPATIONS = [
  "Software Developer", "Doctor", "Lawyer", "Teacher",
  "Accountant", "Graphic Designer", "Plumber", "Nurse",
];

async function warmCache() {
  console.log(`Starting background warmup for ${WARM_OCCUPATIONS.length} occupations (no news to keep it light)...`);
  let done = 0;
  for (const occ of WARM_OCCUPATIONS) {
    const key = cacheKey(occ, "");
    if (resultCache.has(key)) { done++; continue; }
    try {
      await analyzeAndCache(occ, "", { skipNews: true });
      done++;
      if (done % 2 === 0) console.log(`  warmed ${done}/${WARM_OCCUPATIONS.length}`);
    } catch (err) {
      console.warn(`  warmup failed for "${occ}":`, err.message);
    }
  }
  console.log(`Warmup complete · ${done}/${WARM_OCCUPATIONS.length} occupations cached`);
}

// Extracted helper used by both the route and the warmer.
// Pass { skipNews: true } to skip the news fetch (warmup uses this).
async function analyzeAndCache(cleanOcc, cleanCo, opts = {}) {
  const key = cacheKey(cleanOcc, cleanCo);
  const startedAt = Date.now();

  // STEP 1: Fetch live news (skipped during warmup). News fetcher has its own
  // 25s timeout so this can't block the analysis indefinitely.
  let newsContext = "";
  let news = null;
  if (!opts.skipNews) {
    try {
      news = await fetchNewsForTopic(cleanOcc, cleanCo);
      newsContext = formatNewsContext(news);
    } catch (err) {
      console.warn("[analyze] News fetch failed, continuing without:", err.message);
    }
  }

  const newsElapsed = Date.now() - startedAt;

  // STEP 1.5: Build grounding context from local aggregators (O*NET, Wikipedia,
  // SEC EDGAR). This is free — pure local file reads. Auto-skips for occupations
  // / companies we don't have data for.
  const groundingContext = await buildGroundingContext(cleanOcc, cleanCo);

  // Route to the appropriate provider (demo / ollama / anthropic). The router
  // logs which one it picks. The base userMessage is composed inside each
  // provider so they can apply provider-specific instructions.
  const providerResult = await providerAnalyze({
    occupation: cleanOcc,
    company: cleanCo,
    groundingContext,
    newsContext,
    news,
    anthropic: client,
  });

  const totalElapsed = Date.now() - startedAt;
  // Always attach voices server-side. Provider responses (incl. demo) may already
  // carry their own voices; if so, prefer those — they're hand-curated per role.
  const voices = providerResult.voices && providerResult.voices.quotes && providerResult.voices.quotes.length
    ? providerResult.voices
    : voicesForOccupation(cleanOcc);
  const result = {
    ...providerResult,
    voices,
    _meta: {
      ...(providerResult._meta || {}),
      elapsed_ms: totalElapsed,
      news_elapsed_ms: newsElapsed,
    },
  };
  resultCache.set(key, { result, cachedAt: Date.now() });
  scheduleSave();
  return result;
}

// Save the in-memory cache cleanly on graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`[shutdown] ${signal} received — saving cache before exit...`);
  if (saveTimer) clearTimeout(saveTimer);
  try { await saveCache(resultCache); } catch (e) { console.warn("[shutdown] save failed:", e.message); }
  process.exit(0);
}
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

app.listen(PORT, async () => {
  console.log(`Career AI Explorer API listening on http://localhost:${PORT}`);
  console.log(`POST /api/analyze  →  { occupation, company? }`);
  console.log(`GET  /health`);

  // Seed in-memory cache from disk (batch-warm.js writes there overnight)
  try {
    const loaded = await loadCache(CACHE_TTL_MS);
    for (const [k, v] of loaded) resultCache.set(k, v);
    if (loaded.size > 0) console.log(`[cache] Seeded ${loaded.size} entries from disk — they'll serve instantly`);
  } catch (e) {
    console.warn("[cache] disk-load failed:", e.message);
  }

  // Only run in-process warmup if disk cache is empty (skip duplicate cost)
  if (resultCache.size === 0) {
    warmCache().catch((e) => console.error("Warmup error:", e));
  } else {
    console.log(`[warmup] Skipped — ${resultCache.size} entries already loaded from disk`);
  }
});
