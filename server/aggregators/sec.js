// SEC EDGAR sync — pulls company facts and recent filings for major companies.
// Free, official, no auth. https://www.sec.gov/edgar/sec-api-documentation
//
// We pull:
//   1. Company facts: employee counts, revenue, R&D spend
//   2. Recent filings list (10-K, 10-Q): URLs to most recent annual/quarterly reports
//
// We do NOT download the full 10-K text — that's too much data and the LLM can
// follow the URL when it needs deep context. We just surface the latest filing
// dates and key metrics.

import { writeJson, readJsonCached } from "../data-store.js";

// SEC requires a User-Agent that identifies who you are
const HEADERS = {
  "User-Agent": "CareerAIExplorer educational tool admin@example.com",
  "Accept": "application/json",
};

const REQUEST_INTERVAL_MS = 110; // SEC asks: max 10 requests per second

// Companies students search for, mapped to their SEC CIK numbers
// (from https://www.sec.gov/cgi-bin/browse-edgar)
const COMPANY_CIKS = {
  "Apple":           "0000320193",
  "Microsoft":       "0000789019",
  "Google":          "0001652044", // Alphabet
  "Meta":            "0001326801",
  "Amazon":          "0001018724",
  "Nvidia":          "0001045810",
  "Tesla":           "0001318605",
  "Netflix":         "0001065280",
  "Salesforce":      "0001108524",
  "Oracle":          "0001341439",
  "IBM":             "0000051143",
  "Intel":           "0000050863",
  "Goldman Sachs":   "0000886982",
  "JPMorgan":        "0000019617",
  "Morgan Stanley":  "0000895421",
  "BlackRock":       "0001364742",
  "Disney":          "0001744489",
  "Walmart":         "0000104169",
};

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return await res.json();
}

/**
 * Pull company facts (employees, R&D, revenue) from SEC EDGAR.
 */
async function fetchCompanyFacts(cik) {
  const padded = cik.padStart(10, "0");
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`;
  const data = await fetchJson(url);

  // Extract latest values for the metrics we care about.
  // SEC stores facts as { units: { USD: [{val, end, fy, fp, form, ...}], ... } }
  const facts = data.facts?.["us-gaap"] || {};

  const getLatest = (factName, unit = "USD") => {
    const fact = facts[factName];
    if (!fact || !fact.units?.[unit]) return null;
    const entries = fact.units[unit].filter((e) => e.form === "10-K");
    if (!entries.length) return null;
    // Sort by end date descending
    entries.sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());
    return { value: entries[0].val, end: entries[0].end, fy: entries[0].fy };
  };

  // Note: EntityNumberOfEmployees is rarely XBRL-tagged. We rely on the 10-K
  // text URL for that — the LLM can pull it on demand.
  return {
    name: data.entityName || "",
    cik: padded,
    revenue: getLatest("Revenues") || getLatest("RevenueFromContractWithCustomerExcludingAssessedTax"),
    rd_expense: getLatest("ResearchAndDevelopmentExpense"),
    net_income: getLatest("NetIncomeLoss"),
  };
}

/**
 * Pull recent 10-K filing metadata (link to most recent annual report).
 */
async function fetchRecentFilings(cik) {
  const padded = cik.padStart(10, "0");
  const url = `https://data.sec.gov/submissions/CIK${padded}.json`;
  const data = await fetchJson(url);

  const recent = data.filings?.recent;
  if (!recent) return [];

  const filings = [];
  const total = recent.form?.length || 0;
  // 10-Ks are interspersed with hundreds of 4/144/8-K filings — scan the whole list
  for (let i = 0; i < total; i++) {
    if (recent.form[i] === "10-K") {
      filings.push({
        form: recent.form[i],
        filed_at: recent.filingDate[i],
        period_end: recent.reportDate[i],
        accession: recent.accessionNumber[i],
        primary_doc: recent.primaryDocument[i],
        url: `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${recent.accessionNumber[i].replace(/-/g, "")}/${recent.primaryDocument[i]}`,
      });
      if (filings.length >= 3) break; // last 3 annual reports is plenty
    }
  }
  return filings;
}

export async function runSecSync() {
  const startedAt = Date.now();
  const companies = Object.entries(COMPANY_CIKS);
  console.log(`[sec] Pulling EDGAR data for ${companies.length} companies...`);

  const results = {};
  let okCount = 0, failCount = 0;
  for (const [name, cik] of companies) {
    try {
      const [facts, filings] = await Promise.all([
        fetchCompanyFacts(cik),
        fetchRecentFilings(cik),
      ]);
      results[name] = { ...facts, recent_10k_filings: filings };
      okCount++;
      const rev = facts.revenue?.value;
      const revStr = rev ? `$${(rev / 1e9).toFixed(1)}B` : "?";
      console.log(`  ${name}: revenue=${revStr}, last 10-K ${filings[0]?.filed_at || "?"}`);
    } catch (err) {
      console.warn(`  [sec] ${name} failed: ${err.message}`);
      failCount++;
    }
    await sleep(REQUEST_INTERVAL_MS);
  }

  const output = {
    generated_at: new Date().toISOString(),
    elapsed_ms: Date.now() - startedAt,
    companies: results,
    company_count: okCount,
    failed_count: failCount,
  };
  await writeJson("companies/sec-edgar.json", output);
  console.log(`[sec] Done · ${okCount}/${companies.length} companies pulled`);
  return output;
}

// Lookup helper — used by context-injector at request time.
// Cached read with mtime check, so repeated calls don't re-parse the JSON file.
export async function lookupCompanyFacts(companyName) {
  if (!companyName) return null;
  const data = await readJsonCached("companies/sec-edgar.json", { companies: {} });
  const target = companyName.toLowerCase().trim();
  for (const [name, facts] of Object.entries(data.companies || {})) {
    if (name.toLowerCase() === target) return facts;
  }
  return null;
}

// Direct invocation
import { fileURLToPath } from "url";
import path from "path";
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runSecSync().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
