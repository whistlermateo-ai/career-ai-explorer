# Career AI Explorer

**By Mateo Telfer · Grade 11, Shawnigan Lake School · Innovative English Project**

---

## What it is

Career AI Explorer is a web tool that gives high-school students an honest, data-backed assessment of how exposed any occupation is to AI displacement. Unlike vague predictions in news articles, the tool produces an explicit 0–100 score grounded in eight measurable dimensions, supported by real government and peer-reviewed data. Every score is traceable: a student can drill into the reasoning and verify the sources.

The goal is not to scare or reassure — it is to give the next generation an honest map of where the labor market is heading.

---

## How to use it

1. Open the link at the bottom of this page in any web browser.
2. Browse 8 industries on the home page — Tech, Healthcare, Finance, Legal, Creative, Trades, Education, Sciences — each with the major occupations inside.
3. Click any occupation. The results page renders the analysis in under a second.

There is also a live mode that lets the user type any custom occupation and get a fresh evaluation. That requires a one-time local install (documented in the project's `SETUP.md`).

---

## How the score is generated

Every analysis runs the same transparent pipeline:

1. **The occupation is mapped to its O\*NET task list** — the official US Department of Labor database of what each job actually involves.

2. **Eight dimensions are scored from 0 to 10.** Each one is cited against a specific task or piece of evidence:

   | Dimension | What it measures | Direction |
   |---|---|---|
   | Routine cognitive load | Pattern-matching on text and data | ▲ raises risk |
   | AI capability gap | What current models can already do | ▲ raises risk |
   | Creative judgment | Novel framing, taste, original synthesis | ▼ lowers risk |
   | Regulatory moat | Licensure and statutory liability | ▼ lowers risk |
   | Embodied work | Physical presence in unstructured settings | ▼ lowers risk |
   | Stakes of error | Consequences that keep humans in the loop | ▼ lowers risk |
   | Relationships | Human trust at the center of the work | ▼ lowers risk |
   | Physical dexterity | Fine motor work in unpredictable environments | ▼ lowers risk |

3. **A fixed-weight formula aggregates them into a 0–100 score.** The formula is shown on every results page — no hidden math.

4. **The score is cross-checked against 24 calibration anchors** drawn from peer-reviewed research. If the computed score is more than 8 points off the nearest anchor, the model must explain the divergence in writing.

5. **The actual reasoning trail is surfaced.** A student sees not just the number, but the numbered steps that produced it, plus a list of similar occupations, recent industry developments backed by two independent sources each, and curated quotes from credible AI leaders in that field.

---

## What backs the scoring

All seven foundational sources are clickable on every results page:

- **O\*NET** — US Department of Labor occupational task database
- **BLS Occupational Outlook Handbook** — employment projections and median pay
- **Felten, Raj & Seamans (2023)** — Princeton AI Occupational Exposure study, primary calibration anchor
- **McKinsey 2024** — *The Economic Potential of Generative AI* + Automation Potential database
- **WEF Future of Jobs Report 2025** — top growing and declining occupations
- **Anthropic Economic Index** — real Claude usage data
- **OECD Employment Outlook** — *AI and the Labour Market*

A complete source list — including the 28 curated leader quotes and 27 dual-sourced industry developments — is available in the project's `SOURCES.md` document.

---

## Try it

### 🔗 [whistlermateo-ai.github.io/career-ai-explorer](https://whistlermateo-ai.github.io/career-ai-explorer/)

No installation required. Opens in any browser.
