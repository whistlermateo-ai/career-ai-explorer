// Curated RSS feed list — TRUSTED SOURCES ONLY.
//
// =====================================================
// EDITORIAL POLICY
// =====================================================
// Each source must meet at least one of:
//   1. Established journalism with published fact-checking standards
//      (BBC, NYT, WSJ, Bloomberg, FT, Guardian, Reuters, AP)
//   2. Peer-reviewed or academic-affiliated tech publication
//      (MIT Technology Review, IEEE Spectrum, Nature)
//   3. Recognized research institution
//      (MIT News, Pew Research, Stanford HAI)
//   4. Primary source (we treat these as official statements, NOT journalism —
//      labeled as "primary_source" so the model knows to attribute carefully)
//      (OpenAI, DeepMind, Anthropic blogs)
//
// EXCLUDED on purpose:
//   - Opinion blogs / Substack (Stratechery, Platformer, Marginal Revolution)
//   - Community-curated feeds (Hacker News front page) — used separately
//   - Tech blogs with pay-to-play history (TechCrunch, VentureBeat)
//   - Advocacy organizations (AlgorithmWatch, Grist) — fine for context but
//     not appropriate when we tell students "here's the news"
//
// trust_tier: 1 = newswire-grade, 2 = specialty journalism, 3 = research institution,
//             4 = primary source (label as the org's own statement)
// authority:  numeric weight 1-3 for the analyzer (higher = more credible signal)
// =====================================================

export const RSS_FEEDS = [
  // ===== TIER 1 — Newswires and papers of record =====
  { name: "BBC Technology",         url: "https://feeds.bbci.co.uk/news/technology/rss.xml",                category: "general_journalism",  trust_tier: 1, authority: 3,
    note: "BBC follows a strict editorial policy with multiple-source verification" },

  { name: "NYT Technology",         url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",     category: "general_journalism",  trust_tier: 1, authority: 3,
    note: "New York Times — standards desk, separate corrections policy" },

  { name: "The Guardian Technology", url: "https://www.theguardian.com/technology/rss",                     category: "general_journalism",  trust_tier: 1, authority: 3,
    note: "Editor's Code of Practice; transparent corrections" },

  { name: "Bloomberg Tech",         url: "https://feeds.bloomberg.com/technology/news.rss",                 category: "business_journalism", trust_tier: 1, authority: 3,
    note: "Strong corporate/financial reporting standards" },

  { name: "WSJ Tech",               url: "https://feeds.a.dj.com/rss/RSSWSJD.xml",                          category: "business_journalism", trust_tier: 1, authority: 3,
    note: "Wall Street Journal newsroom standards" },

  { name: "FT Technology",          url: "https://www.ft.com/technology?format=rss",                        category: "business_journalism", trust_tier: 1, authority: 3,
    note: "Financial Times editorial code; subscription-funded (less ad pressure)" },

  // ===== TIER 2 — Specialty tech/science journalism =====
  { name: "MIT Technology Review",  url: "https://www.technologyreview.com/feed/",                          category: "tech_journalism",     trust_tier: 2, authority: 3,
    note: "MIT-affiliated; technical depth + fact-checking" },

  { name: "IEEE Spectrum",          url: "https://spectrum.ieee.org/rss/fulltext",                          category: "tech_journalism",     trust_tier: 2, authority: 3,
    note: "Published by IEEE — the engineering professional body itself" },

  { name: "Wired",                  url: "https://www.wired.com/feed/rss",                                  category: "tech_journalism",     trust_tier: 2, authority: 2,
    note: "Long-form tech reporting; standard editorial review" },

  { name: "Ars Technica",           url: "https://feeds.arstechnica.com/arstechnica/index",                 category: "tech_journalism",     trust_tier: 2, authority: 2,
    note: "Tech journalism with deep technical analysis" },

  { name: "The Verge — AI",         url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", category: "tech_journalism",   trust_tier: 2, authority: 2,
    note: "Vox Media editorial standards" },

  // ===== TIER 3 — Research institutions =====
  { name: "MIT News — AI",          url: "https://news.mit.edu/topic/mitartificial-intelligence2-rss.xml",  category: "research",            trust_tier: 3, authority: 3,
    note: "Official MIT communications office" },

  { name: "Pew Research",           url: "https://www.pewresearch.org/feed/",                               category: "research",            trust_tier: 3, authority: 3,
    note: "Nonpartisan research organization; methodology published" },

  { name: "Science Daily",          url: "https://www.sciencedaily.com/rss/all.xml",                        category: "research",            trust_tier: 3, authority: 2,
    note: "Aggregator of academic press releases — generally accurate but second-hand" },

  // Environmental coverage — important for the AI environmental impact category
  { name: "Inside Climate News",    url: "https://insideclimatenews.org/feed/",                             category: "environment",         trust_tier: 2, authority: 2,
    note: "Pulitzer-winning nonprofit climate journalism" },

  // ===== TIER 4 — Primary sources (clearly labeled as the org's own statement) =====
  { name: "OpenAI Blog",            url: "https://openai.com/blog/rss.xml",                                 category: "primary_source",      trust_tier: 4, authority: 2,
    note: "OpenAI's own announcements — primary source, not journalism" },

  { name: "DeepMind Blog",          url: "https://deepmind.google/blog/rss.xml",                            category: "primary_source",      trust_tier: 4, authority: 2,
    note: "Google DeepMind's own announcements — primary source" },
];

// Quick lookup
export function getFeedByName(name) {
  return RSS_FEEDS.find((f) => f.name === name);
}

// Returns just the trusted-source metadata (for UI display)
export function getSourceList() {
  return RSS_FEEDS.map(f => ({
    name: f.name,
    category: f.category,
    trust_tier: f.trust_tier,
    note: f.note,
  }));
}
