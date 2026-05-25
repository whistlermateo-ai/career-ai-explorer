// Wikipedia occupation enricher.
// Fetches the canonical Wikipedia summary for each occupation in our popular list.
// Uses MediaWiki's free REST API (no auth, generous rate limits).
// API docs: https://en.wikipedia.org/api/rest_v1/

import { writeJson, readJsonCached } from "../data-store.js";
import { POPULAR_OCCUPATIONS } from "../popular-occupations.js";

const WIKI_API_BASE = "https://en.wikipedia.org/api/rest_v1/page/summary";
const REQUESTS_PER_SECOND = 2; // Wikipedia rate-limits aggressive clients (we hit 429s at 5/sec)
const REQUEST_INTERVAL_MS = Math.ceil(1000 / REQUESTS_PER_SECOND);

const HEADERS = {
  "User-Agent": "CareerAIExplorer/1.0 (educational; github.com/career-ai-explorer)",
  "Accept": "application/json",
};

// Map our occupation names → Wikipedia article titles when they differ
const WIKI_TITLE_OVERRIDES = {
  "Doctor": "Physician",
  "Lawyer": "Lawyer",
  "ML Engineer": "Machine learning",
  "Data Scientist": "Data science",
  "Robotics Engineer": "Robotics", // canonical "Robotics" article (no separate "Robotics engineer" page)
  "Wealth Manager": "Wealth management",
  "Cybersecurity Analyst": "Information security analyst",
  "DevOps Engineer": "DevOps",
  "Product Manager": "Product manager",
  "UX Designer": "User experience design",
  "Game Developer": "Video game developer",
  "AI Researcher": "Artificial intelligence",
  "Athletic Coach": "Coach (sport)",
  "Special Ed Teacher": "Special education",
  "School Counselor": "School counselor",
  "Real Estate Developer": "Real estate development",
  "Insurance Underwriter": "Underwriting",
  "Patent Attorney": "Patent attorney",
  "Public Defender": "Public defender",
  "Civil Rights Attorney": "Civil rights",
  "Industrial Designer": "Industrial design",
  "Auto Body Technician": "Automobile repair shop",
  "HVAC Technician": "Heating, ventilation, and air conditioning",
  "Wildlife Biologist": "Wildlife biologist",
  "Environmental Scientist": "Environmental science",
};

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchOneOccupation(occupationName, retries = 3) {
  const wikiTitle = WIKI_TITLE_OVERRIDES[occupationName] || occupationName;
  const url = `${WIKI_API_BASE}/${encodeURIComponent(wikiTitle.replace(/ /g, "_"))}`;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.status === 429) {
        // Honor retry-after header if present, else exponential backoff
        const retryAfter = parseFloat(res.headers.get("retry-after") || "0");
        const wait = retryAfter ? retryAfter * 1000 : 2000 * Math.pow(2, attempt);
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        if (res.status === 404) return { ok: false, error: "Article not found" };
        throw new Error(`${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      return {
        ok: true,
        title: data.title || wikiTitle,
        description: data.description || "",
        extract: data.extract || "",
        page_url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle)}`,
        thumbnail: data.thumbnail?.source || null,
      };
    } catch (err) {
      if (attempt === retries - 1) return { ok: false, error: err.message };
      await sleep(1500 * Math.pow(2, attempt));
    }
  }
  return { ok: false, error: "Exhausted retries" };
}

export async function runWikipediaEnricher() {
  const startedAt = Date.now();
  console.log(`[wiki] Enriching ${POPULAR_OCCUPATIONS.length} occupations from Wikipedia...`);

  const results = {};
  let okCount = 0, failCount = 0;
  for (const occ of POPULAR_OCCUPATIONS) {
    const result = await fetchOneOccupation(occ);
    if (result.ok) {
      results[occ] = result;
      okCount++;
    } else {
      failCount++;
      console.warn(`  [wiki] failed for "${occ}": ${result.error}`);
    }
    await sleep(REQUEST_INTERVAL_MS); // courteous rate limiting
  }

  const output = {
    generated_at: new Date().toISOString(),
    elapsed_ms: Date.now() - startedAt,
    occupation_count: okCount,
    failed_count: failCount,
    occupations: results,
  };
  await writeJson("wikipedia.json", output);
  console.log(`[wiki] Done · ${okCount} succeeded, ${failCount} failed`);
  return output;
}

// Lookup helper — used by context-injector at request time.
// Cached read with mtime check.
export async function lookupWikipedia(occupationName) {
  if (!occupationName) return null;
  const data = await readJsonCached("wikipedia.json", { occupations: {} });
  return data.occupations?.[occupationName] || null;
}

// Direct invocation
import { fileURLToPath } from "url";
import path from "path";
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runWikipediaEnricher().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
