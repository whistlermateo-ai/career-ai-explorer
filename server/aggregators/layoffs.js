// Layoffs aggregator. Best-effort: tries to pull a structured layoffs feed
// from public sources. Falls back to "no data" — in which case the RSS
// aggregator's news still surfaces layoff coverage from Bloomberg/Reuters/etc.
//
// To plug in a paid or proprietary layoffs API later, replace the body of
// fetchLayoffs() — the rest of the pipeline is shape-stable.

import { writeJson, readJson } from "../data-store.js";

const FETCH_TIMEOUT_MS = 15_000;

const HEADERS = {
  "User-Agent": "CareerAIExplorer/1.0 (educational tool; github.com/career-ai-explorer)",
  "Accept": "application/json, text/csv, */*",
};

async function fetchWithTimeout(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Try a list of known layoff data sources in priority order.
 * Each source returns either { events: [...] } or null on failure.
 */
async function fetchLayoffs() {
  // Source 1: layoffs.dev (community API mirror, sometimes available)
  try {
    const res = await fetchWithTimeout("https://layoffs.dev/api/all");
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        console.log(`[layoffs] Got ${data.length} events from layoffs.dev`);
        return { source: "layoffs.dev", events: normalizeEvents(data) };
      }
    }
  } catch (err) {
    console.warn(`[layoffs] layoffs.dev failed: ${err.message}`);
  }

  // Source 2: trueup.io API (community tracker, no auth)
  try {
    const res = await fetchWithTimeout("https://trueup.io/api/v1/layoffs?limit=200");
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json")) {
      const data = await res.json();
      const events = data.layoffs || data.data || data;
      if (Array.isArray(events) && events.length) {
        console.log(`[layoffs] Got ${events.length} events from trueup.io`);
        return { source: "trueup.io", events: normalizeEvents(events) };
      }
    }
  } catch (err) {
    console.warn(`[layoffs] trueup.io failed: ${err.message}`);
  }

  return null;
}

/**
 * Normalize layoff event records from various sources into a consistent shape:
 * { company, count, date, industry?, source_url? }
 */
function normalizeEvents(rawEvents) {
  return rawEvents.map((e) => ({
    company: e.company || e.name || e.companyName || "",
    count: parseInt(e.layoffs || e.count || e.employees_affected || e.headcount || "0", 10) || null,
    date: e.date || e.layoff_date || e.announced_at || null,
    industry: e.industry || e.sector || null,
    location: e.location || e.headquarters || null,
    source_url: e.source_url || e.source || null,
  })).filter((e) => e.company);
}

/**
 * Group events by company for fast lookup.
 */
function groupByCompany(events) {
  const byCompany = {};
  for (const e of events) {
    const key = e.company.toLowerCase().trim();
    if (!byCompany[key]) byCompany[key] = { company: e.company, total_layoffs: 0, events: [] };
    byCompany[key].events.push(e);
    if (e.count) byCompany[key].total_layoffs += e.count;
  }
  return byCompany;
}

export async function runLayoffsSync() {
  const startedAt = Date.now();
  console.log(`[layoffs] Trying public layoffs data sources...`);

  const result = await fetchLayoffs();

  if (!result) {
    console.warn(`[layoffs] No source returned data. Writing empty stub — RSS feeds will still surface layoff news.`);
    const existing = await readJson("layoffs.json", null);
    if (existing && existing.events?.length) {
      console.log(`[layoffs] Keeping existing on-disk data (${existing.events.length} events)`);
      return existing;
    }
    const stub = { generated_at: new Date().toISOString(), source: "none", events: [], by_company: {}, _note: "No public layoff API was accessible. RSS news aggregator will still catch layoff stories." };
    await writeJson("layoffs.json", stub);
    return stub;
  }

  const byCompany = groupByCompany(result.events);
  const output = {
    generated_at: new Date().toISOString(),
    source: result.source,
    elapsed_ms: Date.now() - startedAt,
    event_count: result.events.length,
    company_count: Object.keys(byCompany).length,
    events: result.events,
    by_company: byCompany,
  };
  await writeJson("layoffs.json", output);
  console.log(`[layoffs] Done · ${result.events.length} events across ${Object.keys(byCompany).length} companies`);
  return output;
}

/**
 * Public lookup helper — used by prompt.js to inject layoff history.
 */
export async function lookupCompanyLayoffs(companyName) {
  if (!companyName) return null;
  const data = await readJson("layoffs.json", { by_company: {} });
  return data.by_company?.[companyName.toLowerCase().trim()] || null;
}

// Direct invocation
import { fileURLToPath } from "url";
import path from "path";
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runLayoffsSync().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
