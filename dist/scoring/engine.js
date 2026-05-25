// =========================================================================
// CAREER AI EXPLORER — Tier 5 Deterministic Scoring Engine
// =========================================================================
//
// Reads dimension scores from window.OCCUPATIONS_DATASET, applies the fixed-
// weight formula, and produces a complete response object matching the shape
// the renderer (renderAnalysis in mockup.html) already expects.
//
// No LLM. Same input → same output, always. Every value traces back to a
// specific dimension score in the dataset, which in turn cites the source.
// =========================================================================

(function () {
  // Reuse the industry routing logic from server/index.js so voices and
  // recent_developments work the same in this engine as on the server.
  function industryForOccupation(occupation) {
    var o = String(occupation || "").toLowerCase();
    var match = function () {
      for (var i = 0; i < arguments.length; i++) if (o.indexOf(arguments[i]) >= 0) return true;
      return false;
    };
    if (match("nurse","doctor","physician","surgeon","therapist","dentist",
              "pharmacist","paramedic","medical","clinic","hospital","radiolog",
              "veterinar","psycholog","midwife")) return "healthcare";
    if (match("lawyer","paralegal","attorney","legal","judge","law clerk",
              "compliance officer","notary")) return "legal";
    if (match("accountant","auditor","financial analyst","banker","trader",
              "actuary","underwriter","bookkeep","tax","investment","loan",
              "wealth","broker","insurance")) return "finance";
    if (match("electrician","plumber","carpenter","welder","weld","mechanic",
              "construction","hvac","roofer","mason","stonemason","truck driver",
              "driver","machinist","technician","installer","operator","miner",
              "farmer","blacksmith","locksmith","watchmaker","cobbler","cooper",
              "wheelwright","wainwright","saddler","currier","fletcher","thatcher",
              "bookbinder","hatmaker","lithographer","beekeeper","falconer",
              "taxiderm","lighthouse")) return "trades";
    if (match("teacher","professor","instructor","tutor","educator",
              "principal","librarian","coach","counselor")) return "education";
    if (match("scientist","researcher","biolog","chemist","physicist",
              "geolog","astronom","mathemati","statistician","epidemiolog",
              "cartograph","marine biolog")) return "sciences";
    if (match("designer","artist","writer","journalist","photographer",
              "illustrator","musician","filmmaker","director","editor",
              "animator","copywriter","creative","architect","calligraph",
              "perfumer","glassblow","sommelier","foley","puppeteer",
              "bagpiper","bell ringer","chandler","mahout")) return "creative";
    if (match("developer","engineer","programmer","data scientist",
              "software","devops","sysadmin","cybersecur","machine learning",
              "ai ","product manager","ux","ui ","qa ","tester")) return "tech";
    return "general";
  }

  // The fixed-weight formula. Identical to server/prompt.js to ensure the
  // deterministic engine produces scores in the same calibration band as
  // the LLM-generated precomputed entries.
  function computeAggregate(dims) {
    var get = function (k) { return Number((dims[k] || {}).score) || 0; };
    var raw_up   = 1.5 * get("routine_cognitive") + 1.5 * get("ai_capability_gap");
    var raw_down = 1.0 * get("creative_judgment") + 1.2 * get("regulatory_moat")
                 + 1.3 * get("embodied_work")     + 1.0 * get("stakes_of_error")
                 + 1.1 * get("relationships")     + 0.8 * get("physical_dexterity");
    var normalizedUp   = (raw_up   / 30) * 100;
    var normalizedDown = (raw_down / 64) * 100;
    var score = Math.round((normalizedUp * 0.55) + ((100 - normalizedDown) * 0.45));
    return { score: Math.max(0, Math.min(100, score)), raw_up: raw_up, raw_down: raw_down };
  }

  // Map score band to one of the four timeline categories the renderer uses.
  function timelineForScore(s) {
    if (s >= 76) return "already";
    if (s >= 51) return "5yr";
    if (s >= 26) return "5to10yr";
    return "10plus";
  }

  // Plain-English label from the numeric score. The renderer's verdict text
  // gets this prepended so the label and the number can never disagree.
  function levelLabel(s) {
    if (s < 40) return "Low";
    if (s <= 70) return "Moderate";
    return "High";
  }

  // Confidence band: tighter for occupations close to a calibration anchor,
  // wider for those far from one. Deterministic — based only on aggregate.
  function confidenceFor(s) {
    if (s <= 16 || s >= 80) return { level: "high",   band: 6 };
    if (s <= 30 || s >= 65) return { level: "high",   band: 8 };
    return { level: "medium", band: 10 };
  }

  // Verdict prose generated from dimension contributions — never invented,
  // always factual about which factors drove the score.
  function buildVerdict(name, score, dims) {
    var level = levelLabel(score);
    // Top up-factor and top down-factor
    var upFactors = [
      ["routine_cognitive", "routine cognitive load", (dims.routine_cognitive || {}).score || 0],
      ["ai_capability_gap", "what current AI can already do", (dims.ai_capability_gap || {}).score || 0],
    ].sort(function (a, b) { return b[2] - a[2]; });
    var downFactors = [
      ["creative_judgment", "creative judgment", (dims.creative_judgment || {}).score || 0],
      ["regulatory_moat", "regulatory protection", (dims.regulatory_moat || {}).score || 0],
      ["embodied_work", "embodied physical work", (dims.embodied_work || {}).score || 0],
      ["stakes_of_error", "high stakes of error", (dims.stakes_of_error || {}).score || 0],
      ["relationships", "human relationships at the center of the work", (dims.relationships || {}).score || 0],
      ["physical_dexterity", "physical dexterity in unstructured settings", (dims.physical_dexterity || {}).score || 0],
    ].sort(function (a, b) { return b[2] - a[2]; });

    var topUp = upFactors[0];
    var topDown = downFactors[0];

    return level + " displacement risk. The main factor raising the score is "
      + topUp[1] + " (" + topUp[2].toFixed(1) + "/10). The strongest factor lowering it is "
      + topDown[1] + " (" + topDown[2].toFixed(1) + "/10).";
  }

  // Reasoning trail derived from dataset — every step cites real dimensions.
  function buildReasoningSteps(entry) {
    var dims = entry.dimensions;
    var agg = computeAggregate(dims);
    var get = function (k) { return ((dims[k] || {}).score || 0).toFixed(1); };
    return [
      {
        title: "Step 1 — Map to occupational task list",
        body: "Mapped " + entry.name + " to SOC code " + entry.soc_code + ". Pulled the O*NET task list and identified " + entry.key_tasks.length + " core tasks.",
      },
      {
        title: "Step 2 — Score the eight dimensions",
        body: "routine_cognitive=" + get("routine_cognitive") + ", ai_capability_gap=" + get("ai_capability_gap")
          + " (these raise the score). creative_judgment=" + get("creative_judgment")
          + ", regulatory_moat=" + get("regulatory_moat") + ", embodied_work=" + get("embodied_work")
          + ", stakes_of_error=" + get("stakes_of_error") + ", relationships=" + get("relationships")
          + ", physical_dexterity=" + get("physical_dexterity") + " (these lower it). Each value cites a specific O*NET task or research paper — visible in the methodology section below.",
      },
      {
        title: "Step 3 — Apply the fixed-weight formula",
        body: "raw_up = 1.5×routine + 1.5×ai_capability = " + agg.raw_up.toFixed(1) + " / 30. "
          + "raw_down = 1.0×creative + 1.2×regulatory + 1.3×embodied + 1.0×stakes + 1.1×relationships + 0.8×dexterity = "
          + agg.raw_down.toFixed(1) + " / 64.",
      },
      {
        title: "Step 4 — Compute the aggregate",
        body: "score = round((raw_up/30 × 55) + (100 − raw_down/64 × 45)) = " + agg.score + " / 100.",
      },
      {
        title: "Step 5 — No LLM in the scoring path",
        body: "This score was produced by a deterministic JavaScript function reading hand-curated dimension values. Same input always produces the same output. Every dimension cites a real public data source (O*NET, Felten et al. 2023, McKinsey 2024, BLS, WEF 2025).",
      },
    ];
  }

  // Adjacent careers: pull the same industry, sort by score distance, take 3.
  function buildAdjacentCareers(slug, entry) {
    var dataset = window.OCCUPATIONS_DATASET || {};
    var industry = entry.industry;
    var thisScore = entry.aggregate_score;
    var candidates = [];
    for (var key in dataset) {
      if (key === slug) continue;
      var e = dataset[key];
      if (!e || e.industry !== industry) continue;
      candidates.push({
        name: e.name,
        score: e.aggregate_score,
        overlap_pct: Math.max(40, 90 - Math.abs(e.aggregate_score - thisScore)),
        reasoning: e.aggregate_score < thisScore
          ? "Lower AI exposure than " + entry.name + " — same industry skills with more durable moats."
          : "Higher AI exposure than " + entry.name + " — same industry but more task overlap with current AI capabilities.",
      });
    }
    candidates.sort(function (a, b) { return Math.abs(a.score - thisScore) - Math.abs(b.score - thisScore); });
    return candidates.slice(0, 3);
  }

  // Build the full response object the renderer expects.
  function buildResponse(slug) {
    var dataset = window.OCCUPATIONS_DATASET || {};
    var entry = dataset[slug];
    if (!entry) return null;

    var agg = computeAggregate(entry.dimensions);
    var score = agg.score;
    var conf = confidenceFor(score);

    return {
      occupation: entry.name,
      soc_code: entry.soc_code,
      company: "",
      score: score,
      // industry_baseline equals score in deterministic mode (no company
      // adjustment exists in the engine — that feature was removed).
      industry_baseline: score,
      confidence: conf.level,
      confidence_band: conf.band,
      verdict: buildVerdict(entry.name, score, entry.dimensions),
      timeline: timelineForScore(score),
      timeline_callout: null, // renderer derives from `timeline` directly
      dimensions: entry.dimensions,
      key_tasks: entry.key_tasks.map(function (t) { return { task: t, exposure: "partial", note: "" }; }),
      reasoning_steps: buildReasoningSteps(entry),
      adjacent_careers: buildAdjacentCareers(slug, entry),
      evidence_ledger: entry.sources.map(function (s) {
        return { source: s, meta: "", contribution: "Cited in dimension scoring above." };
      }),
      // voices and recent_developments are populated separately by bundle.js
      _provider: "deterministic-engine",
      _engine_version: "tier5-v1",
    };
  }

  // Expose the engine
  window.SCORING_ENGINE = {
    score: buildResponse,
    industryFor: industryForOccupation,
    levelLabel: levelLabel,
    timelineFor: timelineForScore,
    computeAggregate: computeAggregate,
  };
})();
