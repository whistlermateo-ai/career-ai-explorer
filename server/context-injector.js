// Builds the "GROUNDING CONTEXT" block that gets prepended to every analyze
// request. Pulls authoritative data from our local aggregators:
//   - O*NET tasks for the occupation (US Dept of Labor)
//   - Wikipedia canonical summary
//   - SEC EDGAR company facts (revenue, R&D, latest 10-K URL)
//
// Goal: replace "trust the model's training memory" with cited, current data.
// Cost: $0 — all data is local.

import { lookupOccupation } from "./aggregators/onet.js";
import { lookupWikipedia } from "./aggregators/wikipedia.js";
import { lookupCompanyFacts } from "./aggregators/sec.js";

/**
 * Returns a multi-section text block to inject into the user message before
 * the news context. Empty string if no grounding data is available.
 *
 * All lookups run in parallel and any individual failure is swallowed so the
 * analyze pipeline never crashes on missing/corrupt local data.
 */
export async function buildGroundingContext(occupation, company) {
  const [onetResult, wikiResult, secResult] = await Promise.allSettled([
    lookupOccupation(occupation),
    lookupWikipedia(occupation),
    company ? lookupCompanyFacts(company) : Promise.resolve(null),
  ]);

  const sections = [];

  if (onetResult.status === "fulfilled" && onetResult.value && onetResult.value.tasks?.length) {
    sections.push(buildOnetSection(onetResult.value));
  } else if (onetResult.status === "rejected") {
    console.warn("[grounding] O*NET lookup failed:", onetResult.reason?.message);
  }

  if (wikiResult.status === "fulfilled" && wikiResult.value?.extract) {
    sections.push(buildWikipediaSection(wikiResult.value));
  } else if (wikiResult.status === "rejected") {
    console.warn("[grounding] Wikipedia lookup failed:", wikiResult.reason?.message);
  }

  if (company && secResult.status === "fulfilled" && secResult.value) {
    sections.push(buildSecSection(company, secResult.value));
  } else if (company && secResult.status === "rejected") {
    console.warn("[grounding] SEC lookup failed:", secResult.reason?.message);
  }

  if (sections.length === 0) return "";

  return [
    "# GROUNDING CONTEXT (local cache, refreshed regularly)",
    "Use this authoritative data to inform your analysis. When citing tasks, prefer the O*NET list below over your training memory.",
    "",
    ...sections,
    "---",
    "",
  ].join("\n");
}

function buildOnetSection(onet) {
  const tasks = onet.tasks.slice(0, 12).map((t, i) => `  ${i + 1}. ${t.task}`).join("\n");
  return [
    `## O*NET task list — SOC ${onet.soc_code} (${onet.title})`,
    `Source: US Dept of Labor, O*NET 29.3.`,
    onet.description ? `Description: ${onet.description}` : "",
    "",
    "Tasks:",
    tasks,
    "",
  ].filter(Boolean).join("\n");
}

function buildWikipediaSection(wiki) {
  const extract = (wiki.extract || "").slice(0, 600);
  return [
    `## Wikipedia summary`,
    `Source: ${wiki.page_url}`,
    "",
    extract,
    "",
  ].join("\n");
}

function buildSecSection(companyName, facts) {
  const lines = [`## SEC EDGAR — ${companyName} (${facts.name})`];
  lines.push(`Source: filings at https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${facts.cik}`);
  lines.push("");

  if (facts.revenue) {
    const billions = (facts.revenue.value / 1e9).toFixed(1);
    lines.push(`- Revenue (FY${facts.revenue.fy}): $${billions}B (period ending ${facts.revenue.end})`);
  }
  if (facts.rd_expense) {
    const billions = (facts.rd_expense.value / 1e9).toFixed(1);
    lines.push(`- R&D Expense (FY${facts.rd_expense.fy}): $${billions}B`);
  }
  if (facts.net_income) {
    const billions = (facts.net_income.value / 1e9).toFixed(1);
    lines.push(`- Net Income (FY${facts.net_income.fy}): $${billions}B`);
  }
  if (facts.recent_10k_filings?.length) {
    const latest = facts.recent_10k_filings[0];
    lines.push(`- Latest 10-K filed ${latest.filed_at} (period ${latest.period_end}): ${latest.url}`);
  }
  lines.push("");
  return lines.join("\n");
}
