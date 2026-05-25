// Demo provider: serves pre-built JSON analyses for popular occupations.
// Zero compute, zero API cost. Falls through (returns null) if no entry exists.

import { readFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEMO_DIR = join(__dirname, "demo-data");

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Build slug index once at module load — cheap sync read of ~10 filenames.
const DEMO_SLUGS = (() => {
  const out = new Map(); // slug -> absolute path
  if (!existsSync(DEMO_DIR)) return out;
  for (const f of readdirSync(DEMO_DIR)) {
    if (f.endsWith(".json")) {
      out.set(f.replace(/\.json$/, "").toLowerCase(), join(DEMO_DIR, f));
    }
  }
  return out;
})();

export function hasDemoFor(occupation) {
  return DEMO_SLUGS.has(slugify(occupation));
}

export async function analyze({ occupation, company }) {
  // Demo mode is industry-baseline only (no live company signals).
  if (company && company.trim()) return null;
  const slug = slugify(occupation);
  const path = DEMO_SLUGS.get(slug);
  if (!path) return null;
  const raw = await readFile(path, "utf8");
  const obj = JSON.parse(raw);
  return {
    ...obj,
    _provider: "demo",
    _provider_cost: 0,
    _meta: {
      ...(obj._meta || {}),
      elapsed_ms: 0,
      model: "demo (pre-built)",
      news_cached: false,
      news_headlines_count: 0,
    },
  };
}
