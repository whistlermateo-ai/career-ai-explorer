// Ollama provider: routes analyze calls to a local Llama / Qwen instance via
// Ollama's HTTP API. Zero monetary cost (uses your Mac's CPU/GPU).

import { SYSTEM_PROMPT } from "../prompt.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

const JSON_INSTRUCTION = `

Respond ONLY with a single JSON object. No surrounding prose. No markdown. Keep the response SHORT and focused — the user only sees the score, the dimensions breakdown, the verdict, the reasoning steps, the adjacent careers, and 1-2 occupation-specific recent developments. Do not waste tokens.

Required top-level keys (ALL must be present, none can be omitted):
- occupation (string), soc_code (string), company (string, empty if none), score (integer 0-100)
- confidence (string: low/medium/high), confidence_band (integer 1-30), verdict (1 sentence, plain English)
- timeline (string), industry_baseline (integer 0-100)
- dimensions (object with 8 keys, each { "score": 0-10, "reasoning": "<1 sentence citing a specific O*NET task or evidence>" }) — REASONING MUST NOT BE BLANK
- reasoning_steps (array of 3-4 OBJECTS, each { "title": "<3-6 word title>", "body": "<1-2 sentence explanation>" }) — NOT an array of plain strings
- evidence_ledger (array of 3 OBJECTS, each { "source": "<O*NET | BLS | Felten et al. 2023 | McKinsey 2024 | WEF 2025 | OECD | Anthropic Economic Index | Goldman Sachs Research>", "meta": "<one line>", "contribution": "<what this source contributed>" })
- adjacent_careers (array of 3 OBJECTS, each { "name": "<role>", "overlap_pct": 0-100, "score": 0-100, "reasoning": "<1 sentence>" })
- recent_developments (array of 2 OBJECTS specifically about THIS occupation, each { "headline": "<short>", "source": "<real publication>", "date_text": "2024", "url": "", "impact": "<1 sentence on how this affects the role>", "direction": "raises_risk | lowers_risk | neutral" }) — these should be specific to the searched occupation, not generic industry-wide news

Keep key_tasks, comparisons, action_plan, follow_up_suggestions short or omit if not strictly needed — they are not displayed to the user.`;

// 1500ms — generous enough that Ollama can answer /api/tags even while it's
// busy generating a response on another request. 50ms was too tight on Apple
// Silicon when Ollama was queuing requests, causing the router to fall back
// to Anthropic (whose credit is exhausted) for everything but the 10 demo
// occupations.
export async function isOllamaReachable(timeoutMs = 1500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: ctrl.signal });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

// Trimmed required-key list: we only enforce the fields actually used by
// the rendered MVP sections (hero, methodology, similar occupations, recent
// changes). Fields that exist in the schema but aren't shown to the user
// (key_tasks, comparisons, action_plan, follow_up_suggestions) are no longer
// required — the model can skip them to save generation time.
const REQUIRED_TOP_KEYS = [
  "occupation", "score", "confidence", "verdict",
  "industry_baseline", "dimensions",
  "reasoning_steps", "adjacent_careers",
];

function validateShape(obj) {
  if (!obj || typeof obj !== "object") throw new Error("Ollama: response is not an object");
  const missing = REQUIRED_TOP_KEYS.filter((k) => !(k in obj));
  if (missing.length) throw new Error(`Ollama: missing required keys: ${missing.join(", ")}`);
  if (!obj.dimensions || typeof obj.dimensions !== "object") throw new Error("Ollama: dimensions missing");
}

/**
 * Normalize the Ollama response shape to match the schema the frontend
 * expects (the same shape Anthropic produces via the tool-use contract).
 *
 * Ollama free-form JSON tends to drift in these ways:
 *  - `dimensions` returned as a list of {dimension, score} objects instead
 *    of a dict keyed by dimension name with {score, evidence} values
 *  - `verdict` returned as a short string ("Moderate risk") instead of a
 *    full prose paragraph
 *  - `timeline_callout` returned as a list of objects instead of a string
 *  - missing optional fields (recent_developments, company_signals)
 *
 * This normalizer reshapes whatever Ollama gives us into the canonical
 * shape so the frontend renderAnalysis doesn't crash. Without this, the
 * page falls back to the static "Software Developer at Apple" demo
 * because the render throws mid-execution.
 */
const DIM_KEYS = [
  "routine_cognitive", "creative_judgment", "regulatory_moat",
  "embodied_work", "stakes_of_error", "relationships",
  "ai_capability_gap", "physical_dexterity",
];

function normalize(obj, occupation, company) {
  const out = { ...obj };

  // dimensions: list-of-objects → dict keyed by dimension name
  if (Array.isArray(out.dimensions)) {
    const dict = {};
    for (const item of out.dimensions) {
      const name = item?.dimension || item?.name;
      if (!name) continue;
      dict[name] = {
        score: Number(item.score) || 0,
        evidence: item.evidence || item.note || "",
      };
    }
    // Ensure every required key exists (frontend reads them by name)
    for (const k of DIM_KEYS) {
      if (!dict[k]) dict[k] = { score: 5, evidence: "" };
    }
    out.dimensions = dict;
  } else if (out.dimensions && typeof out.dimensions === "object") {
    // Already a dict — make sure every dimension has the .score property
    for (const k of DIM_KEYS) {
      if (!out.dimensions[k]) out.dimensions[k] = { score: 5, evidence: "" };
      else if (typeof out.dimensions[k] === "number") {
        out.dimensions[k] = { score: out.dimensions[k], evidence: "" };
      } else if (typeof out.dimensions[k] !== "object") {
        out.dimensions[k] = { score: 5, evidence: "" };
      }
    }
  }

  // verdict: must be a non-empty string
  if (!out.verdict || typeof out.verdict !== "string" || out.verdict.length < 30) {
    out.verdict = (typeof out.verdict === "string" ? out.verdict + ". " : "")
      + `${occupation}${company ? ` at ${company}` : ""} scores ${out.score ?? "—"} / 100 on AI displacement exposure over a 5-year horizon.`;
  }

  // timeline_callout: prefer a single string. If Ollama returned a list, join.
  if (Array.isArray(out.timeline_callout)) {
    out.timeline_callout = out.timeline_callout
      .map((t) => typeof t === "string" ? t : (t?.text || t?.description || ""))
      .filter(Boolean)
      .join(" ");
  }

  // timeline: ensure it's a list of {timeframe, description}
  if (!Array.isArray(out.timeline)) out.timeline = [];
  out.timeline = out.timeline.map((t) => {
    if (typeof t === "string") return { timeframe: "5-year horizon", description: t };
    return {
      timeframe: t?.timeframe || t?.period || "5-year horizon",
      description: t?.description || t?.text || "",
    };
  });

  // Ensure required list fields exist (defensive — render functions iterate these)
  const requiredLists = ["key_tasks", "comparisons", "evidence_ledger", "reasoning_steps", "adjacent_careers", "action_plan"];
  for (const k of requiredLists) {
    if (!Array.isArray(out[k])) out[k] = [];
  }

  // Ensure occupation field is set even if Ollama omitted it
  if (!out.occupation) out.occupation = occupation;
  if (company && !out.company) out.company = company;

  // confidence_band: frontend expects a single number ±band, not a [lo, hi] tuple
  if (Array.isArray(out.confidence_band) && out.confidence_band.length === 2) {
    const [lo, hi] = out.confidence_band;
    out.confidence_band = Math.round((hi - lo) / 2);
  }
  if (typeof out.confidence_band !== "number") {
    out.confidence_band = out.confidence === "high" ? 5 : out.confidence === "low" ? 15 : 10;
  }

  // confidence: frontend expects "high" / "medium" / "low" strings
  if (typeof out.confidence === "number") {
    out.confidence = out.confidence >= 75 ? "high" : out.confidence >= 50 ? "medium" : "low";
  }

  // score: must be a number
  if (typeof out.score !== "number") out.score = parseInt(out.score, 10) || 50;
  if (typeof out.industry_baseline !== "number") {
    out.industry_baseline = parseInt(out.industry_baseline, 10) || out.score;
  }

  return out;
}

export async function analyze({ occupation, company, groundingContext, newsContext }) {
  const startedAt = Date.now();
  const baseRequest = company
    ? `Analyze the AI displacement risk for: **${occupation}** at **${company}**.\n\nProduce both an industry baseline and a company-adjusted final score. Include the company_signals object.`
    : `Analyze the AI displacement risk for: **${occupation}**.\n\nNo company specified — produce the industry baseline only. Do NOT include the company_signals object. The 'company' field should be an empty string.`;

  let userMessage = baseRequest;
  if (newsContext) userMessage = `${newsContext}\n---\n\n${userMessage}`;
  if (groundingContext) userMessage = `${groundingContext}${userMessage}`;

  const body = {
    model: OLLAMA_MODEL,
    stream: false,
    format: "json",
    options: { temperature: 0.3, num_ctx: 8192 },
    messages: [
      { role: "system", content: SYSTEM_PROMPT + JSON_INSTRUCTION },
      { role: "user", content: userMessage },
    ],
  };

  const r = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Ollama HTTP ${r.status}: ${text.slice(0, 200)}`);
  }
  const payload = await r.json();
  const content = payload?.message?.content;
  if (!content) throw new Error("Ollama: empty content in response");

  let parsed;
  try { parsed = JSON.parse(content); }
  catch (e) { throw new Error(`Ollama: response was not valid JSON: ${e.message}`); }

  // Normalize the response shape BEFORE validating. Ollama free-form JSON
  // drifts on shape (dimensions as list, confidence_band as tuple, etc.)
  // and would otherwise crash the frontend's renderAnalysis mid-execution.
  parsed = normalize(parsed, occupation, company);
  validateShape(parsed);

  return {
    ...parsed,
    _provider: "ollama",
    _provider_cost: 0,
    _meta: {
      elapsed_ms: Date.now() - startedAt,
      model: `ollama/${OLLAMA_MODEL}`,
      news_cached: false,
      news_headlines_count: 0,
    },
  };
}
