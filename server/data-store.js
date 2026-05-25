// Read/write helpers for the data/ directory used by all aggregators.
// Atomic writes (temp + rename) and graceful failure on missing files.

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.resolve(__dirname, "..", "data");

/**
 * Read a JSON file from data/. Returns the fallback value if missing or unparseable.
 * @param {string} relativePath - path relative to data/, e.g. "articles.json" or "onet/tasks.json"
 * @param {*} fallback - returned when the file doesn't exist or is invalid
 */
export async function readJson(relativePath, fallback = null) {
  try {
    const fullPath = path.join(DATA_DIR, relativePath);
    const raw = await fs.readFile(fullPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`[data-store] Failed to read ${relativePath}:`, err.message);
    }
    return fallback;
  }
}

/**
 * Atomic write: writes to a temp file then renames so partial writes never
 * corrupt the cache. Creates parent directories as needed.
 */
export async function writeJson(relativePath, data) {
  const fullPath = path.join(DATA_DIR, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  const tmp = fullPath + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, fullPath);
}

/**
 * Returns metadata about a data file: existence, size in KB, age in hours.
 * Used by gather.js for status reporting.
 */
export async function statFile(relativePath) {
  try {
    const fullPath = path.join(DATA_DIR, relativePath);
    const s = await fs.stat(fullPath);
    return {
      exists: true,
      size_kb: Math.round(s.size / 1024),
      modified_at: s.mtime.toISOString(),
      age_hours: Math.round((Date.now() - s.mtimeMs) / 3600000 * 10) / 10,
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Convenience for "is this data fresh enough?" checks.
 */
export async function isFresh(relativePath, maxAgeHours) {
  const s = await statFile(relativePath);
  if (!s.exists) return false;
  return s.age_hours < maxAgeHours;
}

/**
 * Lists all files in a data/ subdirectory.
 */
export async function listDir(relativePath) {
  try {
    const fullPath = path.join(DATA_DIR, relativePath);
    return await fs.readdir(fullPath);
  } catch {
    return [];
  }
}

/**
 * In-memory cache for JSON files keyed by mtime. Avoids re-parsing the same
 * 200KB+ file on every analyze call. Invalidates automatically when the file
 * is rewritten by an aggregator (mtime changes).
 */
const _cachedReads = new Map(); // relativePath -> { mtimeMs, data }

export async function readJsonCached(relativePath, fallback = null) {
  try {
    const fullPath = path.join(DATA_DIR, relativePath);
    const stat = await fs.stat(fullPath);
    const cached = _cachedReads.get(relativePath);
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      return cached.data;
    }
    const raw = await fs.readFile(fullPath, "utf-8");
    const data = JSON.parse(raw);
    _cachedReads.set(relativePath, { mtimeMs: stat.mtimeMs, data });
    return data;
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`[data-store] readJsonCached failed for ${relativePath}:`, err.message);
    }
    return fallback;
  }
}
