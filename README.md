# Career AI Explorer

**Built by Mateo Telfer · Grade 11, Shawnigan Lake School · English innovative-project**

### 🔗 Open the live program: **[whistlermateo-ai.github.io/career-ai-explorer](https://whistlermateo-ai.github.io/career-ai-explorer/)**

No installation. Click any of the 50+ pre-built occupations and see the full analysis.

---

Career AI Explorer is a web tool that gives high-school students an honest, evidence-backed assessment of how exposed any occupation is to AI displacement. Every score traces back to peer-reviewed and government data — O\*NET, BLS, Felten et al. 2023, McKinsey, WEF, OECD, the Anthropic Economic Index, and Goldman Sachs Research.

The full source list is in [SOURCES.md](./SOURCES.md). The build conversation transcript is in [CHAT-TRANSCRIPT.md](./CHAT-TRANSCRIPT.md).

---

## How to use it

There are **two ways** to run this program. Pick whichever fits.

### Option A — Demo mode (no setup, recommended for first look)

Works on any computer with a web browser. No installs.

1. Open the `constellation.html` file in your browser. (Right-click → Open with → Chrome / Safari / Firefox.)
2. Click any of the 48 occupations on the home page.
3. The full results page loads from pre-computed analyses bundled with the project.

You can also click any role and watch the analysis page render with all sections: score, verdict, AI trajectory, similar occupations, recent changes, voices, and the full methodology breakdown at the bottom.

**Available pre-computed occupations** (50 across 8 industries):

Tech · Software Developer, ML Engineer, Data Scientist, Cybersecurity Analyst, Product Manager, UX Designer, Game Developer, Robotics Engineer, AI Researcher

Healthcare · Doctor, Nurse, Surgeon, Therapist, Pharmacist, Dentist, Veterinarian, Paramedic, Radiologist

Finance · Investment Banker, Accountant, Financial Analyst, Actuary, Trader, Wealth Manager

Legal · Lawyer, Paralegal, Judge, Public Defender

Creative · Graphic Designer, Writer, Photographer, Filmmaker, Architect, Chef, Fashion Designer, Animator, Musician

Trades · Plumber, Electrician, Carpenter, Mechanic, Pilot

Education · Teacher, Professor, School Counselor, Athletic Coach

Sciences · Biologist, Chemist, Physicist, Marine Biologist, Environmental Scientist

### Option B — Live mode (search any occupation)

Lets you type *any* occupation — not just the 50 above — and get a fresh AI evaluation locally. Requires ~15 minutes of setup. See [SETUP.md](./SETUP.md).

---

## What the program does

A student types an occupation. The system:

1. **Maps the occupation** to its O\*NET Standard Occupational Classification (SOC) code and pulls the task list.
2. **Scores eight dimensions** 0–10 — routine cognitive load, AI capability gap, creative judgment, regulatory moat, embodied work, stakes of error, relationships, physical dexterity. Each dimension is cited against a specific O\*NET task or piece of grounding evidence.
3. **Applies a fixed-weight formula** to produce a 0–100 risk score. The formula is shown plainly on the page — no black box.
4. **Cross-checks against 24 calibration anchors** drawn from peer-reviewed research (Felten et al. 2023, Eloundou et al. 2023, McKinsey, Goldman Sachs, OECD). If the computed score is more than 8 points off the nearest anchor, the model must justify the divergence in writing.
5. **Surfaces the actual reasoning trail** the model used for this specific occupation, plus three voices from credible AI leaders in the same field, and three recent industry developments backed by two independent sources each.

Every claim links back to a real source. Every score is reproducible.

---

## Files in this project

| File | What it is |
|---|---|
| `constellation.html` | The home page — 8 industries, 6 jobs each, plus a search bar |
| `mockup.html` | The results page — loaded when you click an occupation |
| `SOURCES.md` | Every source the program uses, with URLs |
| `CHAT-TRANSCRIPT.md` | Working transcript of how this project was built |
| `SETUP.md` | Instructions for running live mode (Node.js + Ollama) |
| `server/` | The backend server (only needed for live mode) |
| `dist/precomputed/` | The 50 pre-built analyses used by demo mode |
| `scripts/build-precomputed.js` | Script that regenerates the demo bundle from the server cache |

---

## Author's note

This project is for an innovative English class project at Shawnigan Lake School. The decision-making — the design direction, the scoring framework, the visual palette, the source choices, the cuts I made and the features I removed for honesty — was all mine. AI was used as a coding assistant to execute on those decisions, not to make them. The full working transcript in `CHAT-TRANSCRIPT.md` shows that arc.

— Mateo
