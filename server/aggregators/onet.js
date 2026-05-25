// O*NET database importer.
// Downloads the official O*NET database (free, US Dept of Labor) and extracts
// the canonical task list for our popular occupations.
//
// Strategy: try to download individual text files from onetcenter.org's text
// dictionary. If that fails, fall back to whatever data is already on disk.
//
// O*NET versions are released yearly (29.3 = late 2025). Update DB_VERSION
// when a new release lands.

import { writeJson, readJson, readJsonCached, DATA_DIR } from "../data-store.js";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const DB_VERSION = "29_3"; // O*NET 29.3 (Q4 2025 release)
const ZIP_URL = `https://www.onetcenter.org/dl_files/database/db_${DB_VERSION}_text.zip`;

// Map our popular-occupations names → O*NET SOC codes (canonical mapping)
// SOC codes from https://www.bls.gov/soc/2018/major_groups.htm
const NAME_TO_SOC = {
  // Tech
  "Software Developer":        "15-1252.00",
  "ML Engineer":               "15-2051.00", // Data Scientists (closest match)
  "Data Scientist":            "15-2051.00",
  "Cybersecurity Analyst":     "15-1212.00",
  "DevOps Engineer":           "15-1244.00", // Network and Computer Systems Administrators
  "Product Manager":           "11-2021.00", // Marketing Managers (closest)
  "UX Designer":               "27-1024.00", // Graphic Designers (closest)
  "Game Developer":            "15-1255.00", // Web and Digital Interface Designers
  "Robotics Engineer":         "17-2199.10",
  "AI Researcher":             "19-1029.00", // Biological Scientists, All Other (closest research)
  // Healthcare
  "Doctor":                    "29-1228.00", // Physicians, All Other
  "Nurse":                     "29-1141.00", // Registered Nurses
  "Surgeon":                   "29-1248.00",
  "Therapist":                 "19-3033.00", // Clinical and Counseling Psychologists
  "Pharmacist":                "29-1051.00",
  "Radiologist":               "29-1224.00",
  "Dentist":                   "29-1021.00",
  "Paramedic":                 "29-2042.00",
  "Veterinarian":              "29-1131.00",
  "Nutritionist":              "29-1031.00",
  // Finance
  "Investment Banker":         "13-2051.00", // Financial and Investment Analysts
  "Accountant":                "13-2011.00",
  "Financial Analyst":         "13-2051.00",
  "Actuary":                   "15-2011.00",
  "Auditor":                   "13-2011.01",
  "Trader":                    "41-3031.00",
  "Wealth Manager":            "13-2052.00", // Personal Financial Advisors
  "Real Estate Developer":     "11-9141.00",
  "Insurance Underwriter":     "13-2053.00",
  // Legal
  "Lawyer":                    "23-1011.00",
  "Paralegal":                 "23-2011.00",
  "Judge":                     "23-1023.00",
  "Patent Attorney":           "23-1011.00",
  "Legal Clerk":               "23-2011.00",
  "Mediator":                  "23-1022.00",
  "Public Defender":           "23-1011.00",
  "Civil Rights Attorney":     "23-1011.00",
  // Creative
  "Graphic Designer":          "27-1024.00",
  "Writer":                    "27-3043.00",
  "Photographer":              "27-4021.00",
  "Filmmaker":                 "27-2012.02", // Directors—Stage, Motion Pictures, Television, and Radio
  "Musician":                  "27-2042.00",
  "Animator":                  "27-1014.00",
  "Architect":                 "17-1011.00",
  "Fashion Designer":          "27-1022.00",
  "Industrial Designer":       "27-1021.00",
  "Chef":                      "35-1011.00",
  // Trades
  "Plumber":                   "47-2152.00",
  "Electrician":               "47-2111.00",
  "Carpenter":                 "47-2031.00",
  "Welder":                    "51-4121.00",
  "HVAC Technician":           "49-9021.00",
  "Mechanic":                  "49-3023.00",
  "Mason":                     "47-2021.00",
  "Auto Body Technician":      "49-3021.00",
  "Pilot":                     "53-2011.00",
  "Landscaper":                "37-3011.00",
  // Education
  "Teacher":                   "25-2021.00", // Elementary School Teachers
  "Professor":                 "25-1099.00",
  "Tutor":                     "25-3041.00",
  "School Counselor":          "21-1012.00",
  "Principal":                 "11-9032.00",
  "Athletic Coach":            "27-2022.00",
  "Special Ed Teacher":        "25-2059.00",
  // Sciences
  "Biologist":                 "19-1029.00",
  "Chemist":                   "19-2031.00",
  "Physicist":                 "19-2012.00",
  "Astronomer":                "19-2011.00",
  "Geologist":                 "19-2042.00",
  "Researcher":                "19-1029.00",
  "Marine Biologist":          "19-1023.00",
  "Astrophysicist":            "19-2012.00",
  "Wildlife Biologist":        "19-1023.00",
  "Environmental Scientist":   "19-2041.00",
};

// User-Agent that respects O*NET's request to identify yourself
const HEADERS = {
  "User-Agent": "CareerAIExplorer/1.0 (educational tool for high school students; contact: github.com/career-ai-explorer)",
  "Accept": "application/zip, */*",
};

// Parse a TSV string. Returns array of objects keyed by header.
function parseTSV(tsv) {
  const lines = tsv.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split("\t");
  return lines.slice(1).map((line) => {
    const cells = line.split("\t");
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i] || ""; });
    return obj;
  });
}

/**
 * Try to fetch O*NET data. Returns {ok: bool, data?, error?}.
 * Downloads the official zipped text DB, extracts via system `unzip`, parses
 * the two TSV files we need (Occupation Data + Task Statements).
 */
async function tryFetchOnet() {
  const zipPath = path.join(DATA_DIR, "onet", `db_${DB_VERSION}.zip`);
  const extractDir = path.join(DATA_DIR, "onet", "raw");

  try {
    console.log(`[onet] Downloading ${ZIP_URL} (~13MB)...`);
    const res = await fetch(ZIP_URL, { headers: HEADERS });
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(path.dirname(zipPath), { recursive: true });
    await fs.writeFile(zipPath, buf);
    console.log(`[onet] Downloaded ${(buf.length / 1024 / 1024).toFixed(1)}MB`);

    // Clean and extract
    await fs.rm(extractDir, { recursive: true, force: true });
    await fs.mkdir(extractDir, { recursive: true });
    await execAsync(`unzip -o -q "${zipPath}" -d "${extractDir}"`, { maxBuffer: 50 * 1024 * 1024 });
    console.log(`[onet] Extracted to ${extractDir}`);

    // O*NET ZIP contains a top-level folder like "db_29_3_text/"
    const dirs = await fs.readdir(extractDir);
    const innerDir = dirs.find((d) => d.startsWith("db_"));
    if (!innerDir) throw new Error(`Unexpected ZIP structure: ${dirs.join(", ")}`);
    const dataDir = path.join(extractDir, innerDir);

    const occText = await fs.readFile(path.join(dataDir, "Occupation Data.txt"), "utf-8");
    const tasksText = await fs.readFile(path.join(dataDir, "Task Statements.txt"), "utf-8");

    // Cleanup the bulky raw extraction (keep the ZIP for re-extract if needed)
    await fs.rm(extractDir, { recursive: true, force: true });

    return {
      ok: true,
      occupations: parseTSV(occText),
      tasks: parseTSV(tasksText),
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Build a lookup keyed by SOC code with name, description, and tasks.
 * Filtered to only the occupations in NAME_TO_SOC (our popular list).
 */
function buildLookup(occupations, tasks) {
  // Index tasks by SOC code
  const tasksBySoc = new Map();
  for (const t of tasks) {
    const code = t["O*NET-SOC Code"] || t["SOC Code"];
    if (!code) continue;
    if (!tasksBySoc.has(code)) tasksBySoc.set(code, []);
    tasksBySoc.get(code).push({
      task: t["Task"] || "",
      type: t["Task Type"] || "Core",
      relevance: parseFloat(t["Importance"] || t["Relevance"] || "0") || null,
    });
  }

  // Build occupation lookup, filtered to our wanted SOC codes
  const wantedSocs = new Set(Object.values(NAME_TO_SOC));
  const lookup = {};
  for (const occ of occupations) {
    const code = occ["O*NET-SOC Code"] || occ["SOC Code"];
    if (!wantedSocs.has(code)) continue;
    lookup[code] = {
      soc_code: code,
      title:       occ["Title"] || "",
      description: occ["Description"] || "",
      tasks: (tasksBySoc.get(code) || []).slice(0, 20), // Top 20 tasks per occupation
    };
  }
  return lookup;
}

/**
 * Main entry. Tries to fetch fresh data; falls back to existing disk data
 * (or a tiny stub) if fetch fails.
 */
export async function runOnetImporter() {
  const result = await tryFetchOnet();
  let occupationLookup;
  let mode;

  if (result.ok) {
    occupationLookup = buildLookup(result.occupations, result.tasks);
    mode = "fresh";
    console.log(`[onet] Built lookup for ${Object.keys(occupationLookup).length} occupations from live O*NET data`);
  } else {
    console.warn(`[onet] Live fetch failed: ${result.error}`);
    const existing = await readJson("onet/occupations.json", null);
    if (existing && existing.occupations) {
      console.log(`[onet] Keeping existing on-disk data (${Object.keys(existing.occupations).length} occupations)`);
      return existing;
    }
    console.log(`[onet] No existing data — writing empty stub`);
    occupationLookup = {};
    mode = "stub";
  }

  const output = {
    generated_at: new Date().toISOString(),
    db_version: DB_VERSION.replace("_", "."),
    mode,
    name_to_soc: NAME_TO_SOC,
    occupations: occupationLookup,
  };
  await writeJson("onet/occupations.json", output);
  console.log(`[onet] Done · saved data/onet/occupations.json (mode: ${mode})`);
  return output;
}

/**
 * Public lookup helper — used by context-injector at request time.
 * Cached read with mtime check (the file is ~227KB).
 */
export async function lookupOccupation(name) {
  if (!name) return null;
  const data = await readJsonCached("onet/occupations.json", { name_to_soc: {}, occupations: {} });
  const soc = data.name_to_soc?.[name];
  if (!soc) return null;
  return data.occupations?.[soc] || null;
}

// Direct invocation
import { fileURLToPath } from "url";
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runOnetImporter().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
