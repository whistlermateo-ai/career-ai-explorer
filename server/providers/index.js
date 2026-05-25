// Provider router for /api/analyze.
// Picks demo → ollama → anthropic in auto mode, or whatever ANALYZE_PROVIDER forces.
// Each provider exports `analyze(args)` returning the analyze_career tool payload
// (plus _provider / _provider_cost meta fields), or null to fall through.

import { analyze as demoAnalyze, hasDemoFor } from "./demo.js";
import { analyze as ollamaAnalyze, isOllamaReachable } from "./ollama.js";
import { analyze as anthropicAnalyze } from "./anthropic.js";

const MODE = (process.env.ANALYZE_PROVIDER || "auto").toLowerCase();

// Cache the Ollama probe for a few seconds so we don't hammer the socket.
// Cache POSITIVE results aggressively (Ollama up), but cache negative
// results briefly so a transient failure doesn't lock us into Anthropic.
let ollamaProbeCache = { value: null, ts: 0 };
const OLLAMA_PROBE_TTL_POS_MS = 30_000;   // up — cache for 30s
const OLLAMA_PROBE_TTL_NEG_MS = 2_000;    // down — recheck every 2s

async function probeOllama() {
  const now = Date.now();
  if (ollamaProbeCache.value !== null) {
    const ttl = ollamaProbeCache.value ? OLLAMA_PROBE_TTL_POS_MS : OLLAMA_PROBE_TTL_NEG_MS;
    if (now - ollamaProbeCache.ts < ttl) return ollamaProbeCache.value;
  }
  // 1500ms timeout — gives Ollama room to answer /api/tags even when busy.
  // (Default param of isOllamaReachable; pass no arg.)
  const reachable = await isOllamaReachable();
  ollamaProbeCache = { value: reachable, ts: now };
  return reachable;
}

// Anthropic credit-exhausted detection. Once we see a 400 credit error,
// remember it for the rest of this server lifetime so we never burn extra
// time calling Anthropic on subsequent requests.
let anthropicDead = false;
function isCreditError(err) {
  const m = String(err?.message || err || "");
  return m.includes("credit balance is too low") || m.includes("invalid_request_error");
}

export async function analyze(args) {
  const provider = await pickProvider(args);
  console.log(`[provider] ${provider} → ${args.occupation}${args.company ? ` @ ${args.company}` : ""}`);
  if (provider === "demo") {
    const out = await demoAnalyze(args);
    if (out) return out;
    // Demo had no entry — fall through to next-best.
    console.log(`[provider] demo had no match for "${args.occupation}", falling through`);
    return fallback(args, "demo");
  }
  if (provider === "ollama") {
    try { return await ollamaAnalyze(args); }
    catch (err) {
      console.warn(`[provider] ollama failed (${err.message})`);
      if (anthropicDead) {
        // Don't burn time on a known-dead Anthropic. Throw clearly so the
        // frontend shows a real error instead of leaking the credit message.
        throw new Error(`Local AI temporarily unavailable. Wait a few seconds and try again. (${err.message})`);
      }
      console.warn(`[provider] falling back to anthropic`);
      try { return await anthropicAnalyze(args); }
      catch (anthErr) {
        if (isCreditError(anthErr)) {
          anthropicDead = true;
          throw new Error("Local AI couldn't generate an answer and the paid AI is unavailable. Try again in a few seconds — Ollama may be busy with a previous request.");
        }
        throw anthErr;
      }
    }
  }
  // provider === "anthropic"
  try { return await anthropicAnalyze(args); }
  catch (err) {
    if (isCreditError(err)) {
      anthropicDead = true;
      // Final fallback: try Ollama even if probe said unreachable.
      console.warn(`[provider] anthropic credit exhausted — last-resort Ollama attempt`);
      try { return await ollamaAnalyze(args); }
      catch (ollErr) {
        throw new Error("No AI provider available. Local AI (Ollama) isn't responding and the paid AI (Anthropic) credit is exhausted.");
      }
    }
    throw err;
  }
}

async function pickProvider(args) {
  if (MODE === "demo") return "demo";
  if (MODE === "ollama") return "ollama";
  if (MODE === "anthropic") return "anthropic";
  // auto:
  if (!args.company && hasDemoFor(args.occupation)) return "demo";
  if (await probeOllama()) return "ollama";
  return "anthropic";
}

async function fallback(args, skip) {
  if (skip !== "ollama" && (await probeOllama())) {
    try { return await ollamaAnalyze(args); }
    catch (err) { console.warn(`[provider] ollama fallback failed: ${err.message}`); }
  }
  return anthropicAnalyze(args);
}

// Used by /api/provider-status
export async function providerStatus(occupation = "") {
  const ollama = await probeOllama();
  const demo = !!occupation && hasDemoFor(occupation);
  const anthropic = !!process.env.ANTHROPIC_API_KEY;

  let active;
  if (MODE === "demo") active = demo ? "demo" : (ollama ? "ollama" : "anthropic");
  else if (MODE === "ollama") active = ollama ? "ollama" : "anthropic";
  else if (MODE === "anthropic") active = "anthropic";
  else active = demo ? "demo" : (ollama ? "ollama" : "anthropic");

  return {
    current_mode: MODE,
    available: { demo: demo || hasDemoFor("software developer"), ollama, anthropic },
    active_provider_for_next_request: active,
  };
}
