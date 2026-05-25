// Disk-persisted cache for analysis results.
// Lets results survive server restarts (and lets the overnight batch warmer
// pre-populate cache that the live server can serve from).

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "cache");
const CACHE_FILE = path.join(CACHE_DIR, "results.json");

/**
 * Load the disk cache into a Map. Skips entries past the freshness window.
 * @param {number} maxAgeMs - max age in ms (entries older than this are dropped)
 * @returns {Promise<Map>} - Map of key -> { result, cachedAt }
 */
export async function loadCache(maxAgeMs) {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    const data = JSON.parse(raw);
    const map = new Map();
    const now = Date.now();
    let loaded = 0, skipped = 0;
    for (const [key, entry] of Object.entries(data.entries || {})) {
      if (now - entry.cachedAt < maxAgeMs) {
        map.set(key, entry);
        loaded++;
      } else {
        skipped++;
      }
    }
    console.log(`[cache-store] Loaded ${loaded} fresh entries from disk (${skipped} expired)`);
    return map;
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log("[cache-store] No cache file found — starting fresh");
    } else {
      console.warn("[cache-store] Failed to load cache:", err.message);
    }
    return new Map();
  }
}

/**
 * Persist the in-memory cache to disk. Writes atomically (temp + rename) to
 * avoid corruption on crash.
 */
export async function saveCache(cacheMap) {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const data = {
      savedAt: Date.now(),
      entries: Object.fromEntries(cacheMap.entries()),
    };
    const tmp = CACHE_FILE + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tmp, CACHE_FILE);
    console.log(`[cache-store] Saved ${cacheMap.size} entries to disk`);
  } catch (err) {
    console.warn("[cache-store] Failed to save cache:", err.message);
  }
}

/**
 * Read-only inspection of disk cache without loading.
 */
export async function inspectCache() {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    const data = JSON.parse(raw);
    return {
      saved_at: data.savedAt ? new Date(data.savedAt).toISOString() : null,
      entry_count: Object.keys(data.entries || {}).length,
    };
  } catch {
    return { saved_at: null, entry_count: 0 };
  }
}
