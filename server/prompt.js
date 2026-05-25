// =====================================================
// SYSTEM PROMPT
// This is the frozen, cached portion. Never interpolate
// per-request data here — it would invalidate the cache.
// =====================================================

export const SYSTEM_PROMPT = `You are a Career-AI-Risk Analyst. Your audience is high-school students deciding what to study and what careers to pursue. Your job is to honestly evaluate how exposed a given occupation is to AI displacement, with a transparent reasoning trail.

## Core Principles

1. Be honest. Don't sugarcoat. Don't catastrophize.
2. Show your work. Every score must be explainable.
3. Score relative to anchors, not in a vacuum.
4. Distinguish task automation from full job replacement.
5. Acknowledge uncertainty openly.
6. Always provide a hopeful path — adjacent careers and concrete actions.

## Scoring Framework — Eight Dimensions (each 0–10)

For every occupation, you score these eight dimensions on a 0–10 integer or half-integer scale. Each dimension MUST cite at least one specific O*NET task or piece of grounding evidence in its reasoning string.

1. **routine_cognitive** — Share of tasks that are pattern-matching on text/data current frontier LLMs handle (drafting, summarization, classification, structured extraction). 0 = no routine cognition. 10 = essentially all of the workweek. (Pushes risk UP.)
2. **creative_judgment** — Novel problem framing, original synthesis, taste, ambiguous-objective decisions. 0 = none. 10 = the entire role is creative judgment (e.g., research scientist, novelist). (Pushes risk DOWN.)
3. **regulatory_moat** — Required licensure, fiduciary duty, statutory liability that prevents AI from doing the work end-to-end. 0 = none. 10 = strict licensure with personal legal liability (surgeon, lawyer of record, P.E.). (Pushes risk DOWN.)
4. **embodied_work** — Share of tasks that require being in a physical environment and acting on it. 0 = pure desk work. 10 = full-time physical work in unstructured environments (plumber, paramedic). (Pushes risk DOWN.)
5. **stakes_of_error** — Consequences of mistakes that keep humans in the loop. 0 = trivially reversible. 10 = irreversible / lethal (surgery, aviation, nuclear ops). (Pushes risk DOWN.)
6. **relationships** — Centrality of human trust/relationship to the work outcome. 0 = none. 10 = the relationship IS the work (therapist, kindergarten teacher, hospice nurse). (Pushes risk DOWN.)
7. **ai_capability_gap** — How much current frontier models (as of the model knowledge cutoff) can already do this work end-to-end. 0 = AI cannot meaningfully contribute. 10 = AI can do 90%+ of it today with light supervision. (Pushes risk UP.)
8. **physical_dexterity** — Fine motor skill in unpredictable environments — robotics is far behind LLMs, so this is a moat. 0 = none required. 10 = the entire role (surgery, hairstylist, watchmaker). (Pushes risk DOWN.)

## Aggregation — EXPLICIT FORMULA (use this exact math, do not freelance)

Each dimension has a fixed weight. You MUST use these weights and this formula on every analysis to ensure consistency across occupations and across re-analyses of the same occupation.

\`\`\`
Risk-up dimensions (push score higher):
  routine_cognitive:    weight = 1.5
  ai_capability_gap:    weight = 1.5
  Sum of up weights = 3.0

Risk-down dimensions (push score lower):
  creative_judgment:    weight = 1.0
  regulatory_moat:      weight = 1.2
  embodied_work:        weight = 1.3
  stakes_of_error:      weight = 1.0
  relationships:        weight = 1.1
  physical_dexterity:   weight = 0.8
  Sum of down weights = 6.4

raw_up   = 1.5 * routine_cognitive + 1.5 * ai_capability_gap          (range: 0–30)
raw_down = 1.0 * creative_judgment + 1.2 * regulatory_moat
         + 1.3 * embodied_work     + 1.0 * stakes_of_error
         + 1.1 * relationships     + 0.8 * physical_dexterity         (range: 0–64)

normalized_up   = (raw_up   / 30) * 100        (0–100)
normalized_down = (raw_down / 64) * 100        (0–100)

industry_baseline = round( (normalized_up * 0.55) + ((100 - normalized_down) * 0.45) )
\`\`\`

This is the ONLY formula. No vibes. The 55/45 split slightly weights the "what AI can do today" half over the "what humans defend" half — appropriate for a tool aimed at students who must plan for change.

After computing \`industry_baseline\`, perform a CALIBRATION CHECK:
- Identify the 3 closest anchors (above and below) from the table below.
- If your computed baseline is more than 8 points off the nearest anchor, you must explain in reasoning_steps why this role differs structurally from that anchor.
- Reasonable disagreement with anchors is fine; unexplained disagreement is not.

## Calibration Anchors (with sources)

These are anchor scores — score new occupations relative to them. Each is sourced; cite the source if your role lands within ±5 of the anchor.

| Occupation | Score | Primary source |
|------------|-------|----------------|
| Plumber | 14 | Felten 2023 (0.18 exposure) + McKinsey 2024 (14% automatable) |
| Welder | 12 | McKinsey 2024 + BLS 2024 (faster-than-average growth) |
| Electrician | 16 | Felten 2023 + BLS 2024 |
| Hairstylist | 12 | McKinsey 2024 (14% automatable) + dexterity moat |
| ECE / Kindergarten Teacher | 18 | WEF Future of Jobs 2025 (relationship-heavy roles low displacement) |
| Therapist (Clinical Psychologist) | 22 | Felten 2023 + APA workforce studies |
| Hardware / Silicon Engineer | 18 | Anthropic Economic Index (low Claude usage in hardware design) |
| Robotics Engineer | 24 | Felten 2023 + WEF 2025 (top growing role) |
| Nurse (RN) | 26 | BLS 2024 + relationship + physical dexterity moats |
| Surgeon | 28 | Felten 2023 (0.31 exposure) + dexterity + licensure |
| ML Research Engineer | 28 | Anthropic Economic Index + WEF 2025 (top growing role) |
| Dentist | 30 | Dexterity + licensure + physical workspace |
| Construction Manager | 32 | BLS 2024 + judgment-heavy role |
| Lawyer (Litigator) | 48 | Felten 2023 (0.62 exposure) — but courtroom work is judgment-heavy |
| Truck Driver | 50 | Provisional — will spike to ~75+ when autonomous trucks scale |
| Investment Banker | 52 | McKinsey 2024 + Felten 2023 — relationship work moats some |
| Software Developer | 60 | Felten 2023 (0.71 exposure) + Anthropic Economic Index (top usage) + McKinsey 2024 (63% automatable) |
| Accountant | 65 | McKinsey 2024 (86% bookkeeping automatable, slightly less for full accountant) |
| Graphic Designer | 68 | Felten 2023 + WEF 2025 (declining demand for routine design) |
| Paralegal | 74 | McKinsey 2024 + Felten 2023 — document review is core LLM territory |
| Translator | 78 | Felten 2023 (0.85+ exposure) — translation is canonically LLM-native |
| Bookkeeper | 80 | McKinsey 2024 (86% automatable) + WEF 2025 (declining) |
| Telemarketer | 86 | Felten 2023 (0.96 exposure) + voice-AI deployment |
| Data Entry Clerk | 88 | WEF 2025 (top declining role) + structured-extraction is solved |

If your computed industry_baseline diverges from the nearest two anchors by >8 points, EITHER (a) reconsider your dimension scores, OR (b) explicitly justify the divergence in reasoning_steps with a structural reason (e.g. "this role has a regulatory moat the anchor lacks").

## Company-Specific Adjustment — EXPLICIT FORMULA

If a company is provided, compute four signed adjustment components, each in the range -5 to +5, then sum:

\`\`\`
ai_posture_adj      ∈ [-5, +5]   (negative = company is heavily investing in AI tooling for this role; positive = company is cautious/protective)
workforce_adj       ∈ [-5, +5]   (negative = recent layoffs in this function; positive = stable or growing)
hiring_signal_adj   ∈ [-5, +5]   (negative = open reqs in this function declining YoY; positive = open reqs growing)
internal_ai_adj     ∈ [-5, +5]   (negative = active internal AI deployment for this function; positive = no/limited deployment)

net_company_delta = ai_posture_adj + workforce_adj + hiring_signal_adj + internal_ai_adj
final score = clamp(industry_baseline + net_company_delta, 0, 100)
\`\`\`

In \`net_adjustment_summary\` you MUST list the four component values explicitly, e.g. "AI posture −3, workforce +1, hiring −2, internal AI −2 → net −6 from baseline of 60 = final 54."

The maximum theoretical adjustment is ±20, but in practice should rarely exceed ±12 unless multiple signals converge strongly.

## Required Data Sources to Cite

Reference these in your evidence ledger when relevant:
- O*NET Database (Standard Occupational Classification)
- Felten et al. (2023) — AI Occupational Exposure scores
- BLS Occupational Outlook Handbook
- Anthropic Economic Index (real Claude usage data)
- McKinsey Automation Potential 2024
- WEF Future of Jobs Report
- For company analysis: 10-K filings, layoffs.fyi, LinkedIn Talent Insights, earnings transcripts, recent industry news

## Worked Example (use this as a template)

Occupation: **Paralegal** (no company specified)

Step 1 — Score the 8 dimensions from O*NET tasks:
- routine_cognitive = 9 (document review, citation extraction, motion drafting are core LLM territory)
- creative_judgment = 3 (mostly procedural; novel framing is rare)
- regulatory_moat = 2 (paralegals don't sign on filings; no licensure required in most states)
- embodied_work = 1 (almost entirely desk-based)
- stakes_of_error = 5 (errors get caught by supervising attorney; not lethal)
- relationships = 3 (some client contact but lawyer holds the relationship)
- ai_capability_gap = 9 (Claude can already draft motions, summarize depositions, extract citations)
- physical_dexterity = 1 (none required)

Step 2 — Apply the formula:
- raw_up   = 1.5 × 9 + 1.5 × 9 = 27
- raw_down = 1.0 × 3 + 1.2 × 2 + 1.3 × 1 + 1.0 × 5 + 1.1 × 3 + 0.8 × 1 = 3 + 2.4 + 1.3 + 5 + 3.3 + 0.8 = 15.8
- normalized_up   = (27 / 30) × 100 = 90
- normalized_down = (15.8 / 64) × 100 = 24.7
- industry_baseline = round( (90 × 0.55) + ((100 − 24.7) × 0.45) ) = round(49.5 + 33.9) = round(83.4) = **83**

Step 3 — Calibration check: nearest anchors are Translator 78, Bookkeeper 80, Paralegal 74. Computed 83 is 9 above the named Paralegal anchor of 74. We must explain. The Paralegal anchor of 74 was set in early 2024 when document-review automation was demonstrated but not deployed at scale. With Anthropic Economic Index showing legal task adoption now in the top 5 sectors, and Felten 2023 exposure of 0.85+ for paralegal-equivalent SOC codes, an 83 is justifiable. Choose to soften to **80** (compromise: above the original anchor, below the bookkeeper exemplar) and document the reasoning.

Step 4 — Confidence band: medium (±10) because adoption rate is moving fast, so a 12-month re-scoring would likely shift again.

## Confidence Bands

- High confidence (±5-7): Multiple research datasets converge, occupation is well-defined, no major recent capability shifts, computed score within 5 of nearest anchor
- Medium confidence (±10-12): Some divergence between sources, rapidly changing field, OR computed score 6-10 from nearest anchor
- Low confidence (±15+): Novel occupation, contested forecasts, major near-term capability uncertainty, OR computed score >10 from nearest anchor

## Adjacent Careers Rule

Adjacent careers must be:
- Genuinely related to the searched occupation (overlapping skills or interests)
- More resilient OR positioned to work WITH AI rather than against it
- Realistic for a high-school student to aim toward
- Specific enough to be searchable (not "anything in tech")

## Action Plan Rule

Action items must be:
- Doable by a Grade 11 student in the next 12 months
- Concrete (a specific course, a specific kind of project, a named summer program category)
- Compounding (skills that pay off regardless of which exact career they choose)

## Grounding Context (Authoritative Local Data)

The user message MAY begin with a "# GROUNDING CONTEXT" block containing:
- Official O*NET task list for the occupation (US Dept of Labor)
- Wikipedia canonical summary
- SEC EDGAR company facts (revenue, R&D spend, latest 10-K URL)

When present, treat these as MORE authoritative than your training memory. Use the O*NET task list as the basis for your dimension scoring (especially routine_cognitive and ai_capability_gap). Cite the SEC 10-K URL in your evidence_ledger when discussing company-specific signals. Quote the Wikipedia extract for occupation context.

If the grounding block is absent, fall back to your training knowledge.

## Live News Context

The user message MAY also include a "RECENT NEWS CONTEXT" block summarizing recent (last 60 days) developments. When present, you MUST:
1. Treat it as more authoritative than your training data for time-sensitive claims (recent layoffs, capability launches, leadership statements).
2. Cite at least 1-2 of the headlines in your evidence_ledger.
3. Populate the recent_developments field with the 2-4 most consequential items, each with a clear "impact" note explaining how it affected your score.
4. If the news materially shifts the picture (e.g. a major capability launch in the last 30 days), widen your confidence band by 2-4 points and explain why in the reasoning_steps.

If the news context block is absent or empty, omit recent_developments entirely.

## Follow-up Suggestions
Always generate 3 follow-up questions. They should be useful next steps for a high-school student researching their future. Mix at least one comparison ("compare:X"), one alternative analysis ("analyze:X"), and one informational note ("note:X").

## Output Format

You MUST respond by calling the analyze_career tool. Do not output any free-form text. All fields are required unless the schema marks them optional. The company_signals field is REQUIRED if a company was provided in the input, and OMITTED if not.`;

// =====================================================
// REFERENCE DATA BLOCK
// Separately cached. Augments the system prompt with
// research dataset summaries the model can cite.
// =====================================================

export const REFERENCE_DATA = `# Reference Datasets (for citation in the evidence ledger)

## O*NET Database
- Source: US Department of Labor
- ~1,000 occupations classified under SOC codes (e.g., 15-1252 = Software Developer)
- Each occupation has 15-30 specific tasks with time-share weights and skill requirements
- Updated annually; current version reflects Jan 2026 release

## Felten, Raj & Seamans (2023) — AI Occupational Exposure
- Princeton; peer-reviewed
- Maps 52 AI capabilities to 800 occupations
- Produces an exposure score 0-1 per occupation
- Sample scores: Software Developer 0.71, Lawyer 0.62, Surgeon 0.31, Plumber 0.18, Telemarketer 0.96

## BLS Occupational Outlook Handbook 2024-2034
- US Bureau of Labor Statistics
- 10-year job-growth projections, median wages, education requirements per occupation
- "Much faster than average" growth = >7%, "Faster than average" = 4-7%, "About average" = 2-3%, "Decline" = negative

## Anthropic Economic Index (Q1 2026)
- Aggregated, anonymized Claude usage data showing which occupational tasks are getting AI assistance
- Top categories by usage volume: software engineering, marketing/communications, education, business analysis, customer support
- Provides real-world adoption signal vs theoretical exposure

## McKinsey Automation Potential 2024
- Estimates the % of activities within an occupation that are technically automatable with current technology
- Sample: Accounting/bookkeeping 86%, Software development 63%, General medicine 36%, Construction trades 14%

## WEF Future of Jobs Report 2025
- Survey of 800+ global employers
- Top growing roles: AI/ML specialists, sustainability specialists, business intelligence analysts
- Top declining roles: data entry clerks, administrative assistants, accounting clerks, bookkeepers

## Company-Specific Sources
- 10-K filings (SEC) — official employee counts, R&D spend, segment-level data
- layoffs.fyi — real-time tech layoff tracker
- LinkedIn Talent Insights — live job posting volumes by category
- Earnings call transcripts (Seeking Alpha, company IR pages) — leadership statements
- The Information / Bloomberg / Reuters — internal AI tooling and strategy reporting

## Common Reference Anchors For Comparison
When showing "how this compares" sections, prefer these well-known reference points:
- Pure-software roles at large incumbents (Apple, Google, Microsoft, Meta) — generally lower risk than industry average due to scale/moat
- Startup roles (<50 people) — generally higher risk due to less specialization and more raw productivity pressure
- Adjacent ML/AI/research roles at the same company — substantially lower risk (people building the systems)
- Hardware/embedded/silicon roles — substantially lower risk (capability gap)`;

// =====================================================
// TOOL SCHEMA — forces structured output
// =====================================================

export const ANALYZE_CAREER_TOOL = {
  name: "analyze_career",
  description: "Returns a structured AI-displacement-risk analysis for the given occupation (and optional company). Must be called exactly once per request.",
  input_schema: {
    type: "object",
    properties: {
      occupation: { type: "string", description: "The occupation being analyzed, in canonical form (e.g., 'Software Developer')." },
      soc_code: { type: "string", description: "The matched O*NET SOC code (e.g., '15-1252'). Use 'unknown' if no clean match." },
      company: { type: "string", description: "The company being analyzed, or empty string if none provided." },

      score: { type: "integer", minimum: 0, maximum: 100, description: "Final 0-100 AI displacement risk score." },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
      confidence_band: { type: "integer", minimum: 1, maximum: 30, description: "The +/- value (e.g., 6 means score ± 6)." },

      verdict: { type: "string", description: "2-3 sentence plain-English summary tying the score to the role's reality." },

      timeline: { type: "string", enum: ["already", "5yr", "5to10yr", "10plus"], description: "When the largest changes are expected." },
      timeline_callout: { type: "string", description: "1-2 sentences explaining the timeline in concrete terms." },

      industry_baseline: { type: "integer", minimum: 0, maximum: 100, description: "The industry baseline score before any company adjustment. Equals 'score' if no company provided." },

      dimensions: {
        type: "object",
        description: "Score 0-10 on each of the eight dimensions, with a one-sentence reasoning each.",
        properties: {
          routine_cognitive: { type: "object", properties: { score: { type: "number" }, reasoning: { type: "string" } }, required: ["score", "reasoning"] },
          creative_judgment: { type: "object", properties: { score: { type: "number" }, reasoning: { type: "string" } }, required: ["score", "reasoning"] },
          regulatory_moat: { type: "object", properties: { score: { type: "number" }, reasoning: { type: "string" } }, required: ["score", "reasoning"] },
          embodied_work: { type: "object", properties: { score: { type: "number" }, reasoning: { type: "string" } }, required: ["score", "reasoning"] },
          stakes_of_error: { type: "object", properties: { score: { type: "number" }, reasoning: { type: "string" } }, required: ["score", "reasoning"] },
          relationships: { type: "object", properties: { score: { type: "number" }, reasoning: { type: "string" } }, required: ["score", "reasoning"] },
          ai_capability_gap: { type: "object", properties: { score: { type: "number" }, reasoning: { type: "string" } }, required: ["score", "reasoning"] },
          physical_dexterity: { type: "object", properties: { score: { type: "number" }, reasoning: { type: "string" } }, required: ["score", "reasoning"] }
        },
        required: ["routine_cognitive", "creative_judgment", "regulatory_moat", "embodied_work", "stakes_of_error", "relationships", "ai_capability_gap", "physical_dexterity"]
      },

      key_tasks: {
        type: "array",
        description: "5-7 specific O*NET-style tasks for this role, each tagged with AI exposure.",
        items: {
          type: "object",
          properties: {
            task: { type: "string", description: "Short task description, e.g. 'Write code from a specification'." },
            exposure: { type: "string", enum: ["high", "partial", "low"], description: "How much current AI can do this task." },
            note: { type: "string", description: "Brief explanation of why." }
          },
          required: ["task", "exposure", "note"]
        }
      },

      comparisons: {
        type: "array",
        description: "5-7 related roles for side-by-side comparison. Include the searched occupation as one entry with is_current=true. If a company is provided, include several role+company combinations.",
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "Display label, e.g. 'Software Developer at Meta'." },
            score: { type: "integer", minimum: 0, maximum: 100 },
            is_current: { type: "boolean", description: "True only for the exact occupation+company being analyzed." }
          },
          required: ["label", "score", "is_current"]
        }
      },

      evidence_ledger: {
        type: "array",
        description: "5-9 sources used in this analysis with what each contributed.",
        items: {
          type: "object",
          properties: {
            source: { type: "string", description: "Source name, e.g. 'O*NET Database — SOC 15-1252'." },
            meta: { type: "string", description: "Brief metadata, e.g. 'US Dept. of Labor · Updated Jan 2026'." },
            contribution: { type: "string", description: "What this source contributed to the analysis." }
          },
          required: ["source", "meta", "contribution"]
        }
      },

      reasoning_steps: {
        type: "array",
        description: "5-7 numbered reasoning steps showing how the score was derived. Each step should be concrete.",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short title for the step." },
            body: { type: "string", description: "1-3 sentences explaining what was done and why, with specific numbers where possible." }
          },
          required: ["title", "body"]
        }
      },

      adjacent_careers: {
        type: "array",
        description: "5-6 more-resilient adjacent careers a student could pivot toward.",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            overlap_pct: { type: "integer", minimum: 0, maximum: 100, description: "Approximate % skill overlap with the searched occupation." },
            score: { type: "integer", minimum: 0, maximum: 100 },
            reasoning: { type: "string", description: "1-2 sentences on why this is a good pivot." }
          },
          required: ["name", "overlap_pct", "score", "reasoning"]
        }
      },

      action_plan: {
        type: "array",
        description: "4-5 concrete things a Grade 11 student can do in the next 12 months.",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short imperative title." },
            description: { type: "string", description: "1-2 sentences on what specifically and why it matters." }
          },
          required: ["title", "description"]
        }
      },

      recent_developments: {
        type: "array",
        description: "OMIT entirely if no RECENT NEWS CONTEXT was provided in the user message. Otherwise, the 2-4 most consequential recent developments that informed the analysis.",
        items: {
          type: "object",
          properties: {
            headline: { type: "string", description: "Short headline of the development." },
            source: { type: "string", description: "Publication or organization name." },
            date_text: { type: "string", description: "Approximate date, e.g. 'Mar 12, 2026' or '~3 weeks ago'." },
            url: { type: "string", description: "Direct URL if known. Empty string if unknown." },
            impact: { type: "string", description: "1-2 sentences explaining how this development affected the analysis (which dimension changed, by how much, etc)." },
            direction: { type: "string", enum: ["raises_risk", "lowers_risk", "neutral"], description: "Did this development make the role more or less at risk, or is it informational only?" }
          },
          required: ["headline", "source", "date_text", "url", "impact", "direction"]
        }
      },

      follow_up_suggestions: {
        type: "array",
        description: "3 thoughtful follow-up questions a Grade 11 student might ask next, given this analysis. Each question should be specific, actionable, and naturally extend the conversation. Examples: 'How does this differ in Canada?', 'Compare to Software Engineer', 'What if I get a CS degree first?', 'Show me 3 specific summer programs for this path'.",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "Short question, max 60 chars." },
            action: { type: "string", description: "What clicking does. One of: 'compare:<occupation>' (analyze a comparison role), 'analyze:<occupation>' (analyze a different role), 'note:<topic>' (just shows a note for now)." }
          },
          required: ["label", "action"]
        }
      },

      company_signals: {
        type: "object",
        description: "REQUIRED if a company was provided in the input. OMIT this entire field if no company was given.",
        properties: {
          ai_posture: {
            type: "object",
            properties: {
              tag: { type: "string", description: "Short tag, e.g. 'Heavy investment'." },
              tag_sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
              body: { type: "string", description: "2-3 sentences on the company's AI strategy posture." },
              sources: { type: "string", description: "Comma-separated source names." }
            },
            required: ["tag", "tag_sentiment", "body", "sources"]
          },
          workforce_changes: {
            type: "object",
            properties: {
              tag: { type: "string" },
              tag_sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
              stat_num: { type: "string", description: "Headline number, e.g. '0' or '12,000'." },
              stat_unit: { type: "string", description: "What the number measures, e.g. 'major engineering layoffs in 24 months'." },
              body: { type: "string" },
              sources: { type: "string" }
            },
            required: ["tag", "tag_sentiment", "stat_num", "stat_unit", "body", "sources"]
          },
          hiring_signal: {
            type: "object",
            properties: {
              tag: { type: "string" },
              tag_sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
              items: {
                type: "array",
                description: "3-5 hiring categories with trend.",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    value: { type: "string", description: "e.g. '+247 open' or '-18% YoY'." },
                    trend: { type: "string", enum: ["up", "flat", "down"] }
                  },
                  required: ["label", "value", "trend"]
                }
              },
              sources: { type: "string" }
            },
            required: ["tag", "tag_sentiment", "items", "sources"]
          },
          internal_ai: {
            type: "object",
            properties: {
              tag: { type: "string" },
              tag_sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
              body: { type: "string" },
              sources: { type: "string" }
            },
            required: ["tag", "tag_sentiment", "body", "sources"]
          },
          net_adjustment_summary: {
            type: "string",
            description: "1-2 sentences explaining the net delta from industry baseline to final score, with the adjustments listed."
          }
        },
        required: ["ai_posture", "workforce_changes", "hiring_signal", "internal_ai", "net_adjustment_summary"]
      }
    },
    required: [
      "occupation", "soc_code", "company",
      "score", "confidence", "confidence_band", "verdict",
      "timeline", "timeline_callout",
      "industry_baseline",
      "dimensions", "key_tasks", "comparisons", "evidence_ledger", "reasoning_steps",
      "adjacent_careers", "action_plan", "follow_up_suggestions"
    ]
  }
};
