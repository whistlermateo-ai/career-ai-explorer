#!/usr/bin/env node
// build-precomputed.js — Reads server/cache/results.json directly and produces
// the demo bundle (individual JSON files + bundle.js + manifest.json). For each
// cached analysis, applies the same voices + recent_developments merge logic the
// live /api/analyze endpoint applies, so the precomputed output matches what a
// student would see in live mode.
//
// Run with:  node scripts/build-precomputed.js
//
// Completes in <1 second — no Ollama calls required, since we read the existing
// cache. To refresh the cache with fresh model output, re-run the server and
// hit each occupation through the UI or via curl.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CACHE_FILE = path.join(ROOT, "server", "cache", "results.json");
const VOICES_FILE = path.join(ROOT, "server", "data", "voices.json");
const OUT_DIR = path.join(ROOT, "dist", "precomputed");

// === Industry routing (mirrors server/index.js industryForOccupation) ===
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
  return "general";
}

// === Curated recent-changes table (mirrors server/index.js CHANGES) ===
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
  return (CHANGES[ind] || CHANGES.general).slice(0, 3);
}

function voicesForOccupation(occupation, VOICES) {
  const ind = industryForOccupation(occupation);
  let pool = Array.isArray(VOICES[ind]) ? VOICES[ind] : [];
  if (pool.length === 0 && Array.isArray(VOICES.general)) pool = VOICES.general;
  return { industry: ind, quotes: pool.slice(0, 3) };
}

function slugify(s) {
  return String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function main() {
  if (!fs.existsSync(CACHE_FILE)) {
    console.error(`Cache file not found: ${CACHE_FILE}\nRun the server first and hit some occupations to populate the cache.`);
    process.exit(1);
  }

  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  const entries = cache.entries || cache;
  const VOICES = JSON.parse(fs.readFileSync(VOICES_FILE, "utf8"));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const manifest = [];
  const bundleObj = {};

  for (const key of Object.keys(entries)) {
    const [occRaw, coRaw] = key.split("::");
    const occupation = (occRaw || "").trim();
    const company = (coRaw || "").trim();
    if (!occupation || company) continue; // skip company-specific entries (feature removed)

    const wrapped = entries[key];
    const result = wrapped && wrapped.result ? wrapped.result : wrapped;
    if (!result || typeof result !== "object" || !result.score) continue;

    // Mirror the server's response-time merge logic.
    const voices = (result.voices && result.voices.quotes && result.voices.quotes.length)
      ? result.voices
      : voicesForOccupation(occupation, VOICES);
    const curated = changesForOccupation(occupation);
    const modelGenerated = (Array.isArray(result.recent_developments) ? result.recent_developments : [])
      .filter((r) => r && typeof r === "object" && r.headline && (r.impact || r.summary));
    const recent_developments = (modelGenerated.length
      ? [...modelGenerated.slice(0, 2), ...curated.slice(0, 1)]
      : curated
    ).slice(0, 3);

    const data = { ...result, voices, recent_developments };
    delete data._cache;
    delete data._provider_cost;
    delete data._meta;

    const slug = slugify(occupation);
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.json`), JSON.stringify(data, null, 2));
    bundleObj[slug] = data;
    manifest.push({ slug, occupation, score: data.score });
  }

  manifest.sort((a, b) => a.occupation.localeCompare(b.occupation));
  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));

  const bundleJs = `// Auto-generated by scripts/build-precomputed.js — do not edit by hand.
window.PRECOMPUTED = ${JSON.stringify(bundleObj, null, 2)};
window.PRECOMPUTED_MANIFEST = ${JSON.stringify(manifest, null, 2)};`;
  fs.writeFileSync(path.join(OUT_DIR, "bundle.js"), bundleJs);

  const bundleKb = (fs.statSync(path.join(OUT_DIR, "bundle.js")).size / 1024).toFixed(0);
  console.log(`Built ${manifest.length} precomputed analyses.`);
  console.log(`  Per-file:  ${OUT_DIR}/*.json`);
  console.log(`  Manifest:  ${OUT_DIR}/manifest.json`);
  console.log(`  Bundle:    ${OUT_DIR}/bundle.js (${bundleKb} KB)`);
}

main();
