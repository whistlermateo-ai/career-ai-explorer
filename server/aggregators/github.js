// GitHub trending AI repos.
// Uses GitHub's free Search API (no auth required for low-volume use).
// Pulls AI/ML-related repos that gained the most stars in the last 30 days.
// Indicator of where developer attention is going right now.
//
// Without auth: 60 req/hour. With token: 5000 req/hour. We do 6 requests total.

import { writeJson } from "../data-store.js";

const API_BASE = "https://api.github.com/search/repositories";
const HEADERS = {
  "User-Agent": "CareerAIExplorer/1.0 (educational; github.com/career-ai-explorer)",
  "Accept": "application/vnd.github.v3+json",
};

// AI-flavored topics to query separately so we get diverse results
const TOPICS = [
  "artificial-intelligence",
  "machine-learning",
  "llm",
  "ai-agent",
  "deep-learning",
  "computer-vision",
];
const PER_TOPIC = 10;

async function fetchOneTopic(topic) {
  // Date 30 days ago
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const q = `topic:${topic} pushed:>${cutoff}`;
  const url = `${API_BASE}?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${PER_TOPIC}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();
  return (data.items || []).map((r) => ({
    name: r.full_name,
    url: r.html_url,
    description: r.description || "",
    stars: r.stargazers_count,
    forks: r.forks_count,
    open_issues: r.open_issues_count,
    language: r.language || "",
    last_pushed: r.pushed_at,
    topics: r.topics || [],
    matched_topic: topic,
  }));
}

export async function runGithubTrending() {
  const startedAt = Date.now();
  console.log(`[github] Pulling trending repos for ${TOPICS.length} AI topics...`);

  const allRepos = [];
  let okCount = 0, failCount = 0;
  for (const topic of TOPICS) {
    try {
      const repos = await fetchOneTopic(topic);
      allRepos.push(...repos);
      okCount++;
    } catch (err) {
      console.warn(`  [github] ${topic} failed: ${err.message}`);
      failCount++;
    }
  }

  // Dedupe by full_name (a repo can match multiple topics)
  const seen = new Map();
  for (const r of allRepos) {
    if (!seen.has(r.name)) seen.set(r.name, r);
  }

  // Sort by stars
  const repos = [...seen.values()].sort((a, b) => b.stars - a.stars);

  const output = {
    generated_at: new Date().toISOString(),
    elapsed_ms: Date.now() - startedAt,
    topic_count: TOPICS.length,
    topics_succeeded: okCount,
    repo_count: repos.length,
    repos,
  };
  await writeJson("github-trending.json", output);
  console.log(`[github] Done · ${repos.length} unique repos · ${okCount}/${TOPICS.length} topics`);
  return output;
}

// Direct invocation
import { fileURLToPath } from "url";
import path from "path";
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runGithubTrending().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
