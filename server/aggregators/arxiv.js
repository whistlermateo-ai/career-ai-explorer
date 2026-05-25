// ArXiv paper monitor.
// Pulls latest papers in cs.AI, cs.LG, cs.CL via the official ArXiv API.
// Free, public, no auth. https://info.arxiv.org/help/api/user-manual.html
// Rate-limited but very generous (3s between requests recommended).

import { writeJson } from "../data-store.js";

const ARXIV_BASE = "https://export.arxiv.org/api/query";
const CATEGORIES = [
  { id: "cs.AI", name: "Artificial Intelligence" },
  { id: "cs.LG", name: "Machine Learning" },
  { id: "cs.CL", name: "Computation and Language (NLP)" },
  { id: "cs.CV", name: "Computer Vision" },
  { id: "cs.RO", name: "Robotics" },
];
const PER_CATEGORY_LIMIT = 12;
const RATE_LIMIT_MS = 3000;

const HEADERS = {
  "User-Agent": "CareerAIExplorer/1.0 (educational; github.com/career-ai-explorer)",
};

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Minimal Atom parser using regex — ArXiv returns Atom XML
function parseArxivAtom(xml) {
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag) => {
      const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block);
      return m ? m[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "";
    };
    const id = get("id");
    const title = get("title");
    const summary = get("summary");
    const published = get("published");
    const updated = get("updated");
    // Authors
    const authors = [];
    const authorRegex = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g;
    let am;
    while ((am = authorRegex.exec(block)) !== null) {
      authors.push(am[1].trim());
    }
    // PDF link
    const pdfMatch = /<link[^>]*title="pdf"[^>]*href="([^"]+)"/.exec(block);
    const pdfUrl = pdfMatch ? pdfMatch[1] : null;
    entries.push({
      arxiv_id: id.split("/").pop(),
      title,
      summary: summary.slice(0, 800),
      authors,
      published_at: published,
      updated_at: updated,
      pdf_url: pdfUrl,
      arxiv_url: id,
    });
  }
  return entries;
}

async function fetchOneCategory(category) {
  const url = `${ARXIV_BASE}?search_query=cat:${category.id}&sortBy=submittedDate&sortOrder=descending&max_results=${PER_CATEGORY_LIMIT}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const xml = await res.text();
  return parseArxivAtom(xml).map((p) => ({ ...p, category: category.id, category_name: category.name }));
}

export async function runArxivMonitor() {
  const startedAt = Date.now();
  console.log(`[arxiv] Pulling latest papers from ${CATEGORIES.length} categories...`);

  const allPapers = [];
  let okCount = 0;
  for (const cat of CATEGORIES) {
    try {
      const papers = await fetchOneCategory(cat);
      allPapers.push(...papers);
      okCount++;
      console.log(`  ${cat.id}: ${papers.length} papers`);
    } catch (err) {
      console.warn(`  [arxiv] ${cat.id} failed: ${err.message}`);
    }
    // ArXiv rate limit (3s between requests)
    await sleep(RATE_LIMIT_MS);
  }

  // Dedupe by arxiv_id (papers can be cross-listed in multiple categories)
  const seen = new Map();
  for (const p of allPapers) {
    if (!seen.has(p.arxiv_id)) seen.set(p.arxiv_id, p);
  }
  const papers = [...seen.values()].sort((a, b) =>
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  const output = {
    generated_at: new Date().toISOString(),
    elapsed_ms: Date.now() - startedAt,
    categories_succeeded: okCount,
    categories_total: CATEGORIES.length,
    paper_count: papers.length,
    papers,
  };
  await writeJson("arxiv.json", output);
  console.log(`[arxiv] Done · ${papers.length} unique papers · ${okCount}/${CATEGORIES.length} categories`);
  return output;
}

// Direct invocation
import { fileURLToPath } from "url";
import path from "path";
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runArxivMonitor().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
