# Career AI Explorer — Complete Source List

**Project:** Career AI Explorer
**Author:** Mateo Telfer (Grade 11, Shawnigan Lake School)
**Document purpose:** Every source the program uses to assess a job or industry, with what it contributes and where to verify it.

The program produces scores grounded in real, public data. This document lists every source by name, links to a real URL for verification, and explains how each one feeds into the analysis. Sources are grouped by where they appear on the results page.

---

## 1. Foundational sources — used on every analysis

These six sources are the backbone of the scoring framework. They appear in the **Methodology** section at the bottom of every analysis page, and the model is instructed in its system prompt that every claim must trace back to one of these.

| Source | Type | What it contributes | URL |
|---|---|---|---|
| **O\*NET** | Government database | Official US Dept. of Labor task list — every occupation broken into 15–30 specific tasks, scored individually. The backbone of dimension scoring. | [onetonline.org](https://www.onetonline.org/) |
| **BLS Occupational Outlook Handbook** | Government statistics | US Bureau of Labor Statistics — 10-year projected job growth, median wages, education requirements per occupation. | [bls.gov/ooh](https://www.bls.gov/ooh/) |
| **Felten, Raj & Seamans (2023)** | Peer-reviewed research | Princeton — *Occupational, Industry, and Geographic Exposure to Artificial Intelligence*. Maps 52 AI capabilities to 800 occupations to produce an exposure score 0–1. Primary calibration anchor. | [arxiv.org/abs/2303.01157](https://arxiv.org/abs/2303.01157) |
| **McKinsey 2024** | Industry research | *The Economic Potential of Generative AI* + Automation Potential database. Estimates the % of activities within an occupation that are technically automatable. Second calibration source. | [mckinsey.com — Economic Potential of Generative AI](https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier) |
| **WEF Future of Jobs Report 2025** | Industry survey | World Economic Forum — survey of 800+ global employers. Top growing and declining roles through 2030. Drives the adjacent-careers and declining-roles signal. | [weforum.org — Future of Jobs Report 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/) |
| **Anthropic Economic Index** | Industry data | Aggregated, anonymized Claude usage data — which occupational tasks are actually getting AI assistance today. Real-world adoption signal. | [anthropic.com — Economic Index](https://www.anthropic.com/news/the-anthropic-economic-index) |
| **OECD Employment Outlook** | Government research | *Artificial Intelligence and the Labour Market.* Establishes that ~60% of jobs in advanced economies are exposed to AI; sets the population-level baseline. | [oecd.org — Employment Outlook](https://www.oecd.org/employment/oecd-employment-outlook-19991266.htm) |

---

## 2. Evidence Ledger — framework-level sources surfaced on every analysis

These are the citations behind the eight-dimension scoring framework. They appear in the expandable Evidence Ledger section.

| Source | Type | Contribution | URL |
|---|---|---|---|
| **O\*NET Database** | Government | 22+ specific job tasks per occupation, individually scored | [onetonline.org](https://www.onetonline.org/) |
| **Felten et al. (2023) — AI Occupational Exposure** | Peer-reviewed | Princeton exposure score (0–1) per occupation. Primary calibration anchor. | [arxiv.org/abs/2303.01157](https://arxiv.org/abs/2303.01157) |
| **BLS Occupational Outlook 2024–2034** | Government | Projected job growth, median pay, education requirements | [bls.gov/ooh](https://www.bls.gov/ooh/) |
| **Anthropic Economic Index Q1 2026** | Industry | Real Claude usage data — which tasks AI is actually being used for | [anthropic.com/news/the-anthropic-economic-index](https://www.anthropic.com/news/the-anthropic-economic-index) |
| **McKinsey Automation Potential 2024** | Industry research | % of activities per role automatable with current tech | [mckinsey.com — Economic Potential of Generative AI](https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier) |
| **Eloundou, Manning, Mishkin, Rock (2023) — GPTs are GPTs** | Peer-reviewed | OpenAI / Penn — task-level LLM exposure framework. Cross-validates dimension scoring. | [arxiv.org/abs/2303.10130](https://arxiv.org/abs/2303.10130) |
| **OECD Employment Outlook 2024** | Government | ~60% of jobs in advanced economies are exposed to AI. Population-level baseline. | [oecd.org/employment](https://www.oecd.org/employment/oecd-employment-outlook-19991266.htm) |
| **Goldman Sachs Research (2023)** | Industry research | *The Potentially Large Effects of AI on Economic Growth.* Two-thirds of US and EU jobs partially exposed. | [goldmansachs.com — generative AI / GDP](https://www.goldmansachs.com/intelligence/pages/generative-ai-could-raise-global-gdp-by-7-percent.html) |
| **WEF Future of Jobs Report 2025** | Industry survey | Top growing and declining occupations through 2030 | [weforum.org — Future of Jobs Report 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/) |

---

## 3. Voices — curated quotes by industry

The Voices section pulls from `server/data/voices.json` — 28 quotes from credible AI/industry leaders, organized by industry vertical. Each quote includes a `verbatim` flag indicating whether the wording is exact or paraphrased from public statements.

### Tech (4)
| Speaker | Title | Source | URL |
|---|---|---|---|
| Dario Amodei | CEO, Anthropic | Council on Foreign Relations interview | [cfr.org](https://www.cfr.org/event/ceo-speaker-series-conversation-dario-amodei) |
| Satya Nadella | CEO, Microsoft | Meta LlamaCon fireside chat | [llama.com/events/llamacon](https://www.llama.com/events/llamacon/) |
| Sundar Pichai | CEO, Google / Alphabet | Q3 2024 earnings call | [abc.xyz/investor](https://abc.xyz/investor/) |
| Mark Zuckerberg | CEO, Meta | Joe Rogan Experience #2255 | [YouTube](https://www.youtube.com/watch?v=7k1ehaE0bdU) |

### Healthcare (4)
| Speaker | Title | Source | URL |
|---|---|---|---|
| Eric Topol | Cardiologist; Director, Scripps Research Translational Institute | Ground Truths newsletter | [erictopol.substack.com](https://erictopol.substack.com/) |
| Geoffrey Hinton | Turing Award laureate; ex-Google | "Stop training radiologists" — Machine Learning and the Market for Intelligence conference, Toronto, 2016 | [YouTube](https://www.youtube.com/watch?v=2HMPRXstSvQ) |
| Curtis Langlotz | Professor of Radiology, Stanford | Stanford AI in Medicine | [aimi.stanford.edu](https://aimi.stanford.edu/people/curtis-langlotz) |
| Robert Wachter | Chair, Department of Medicine, UCSF | JAMA / interviews | [profiles.ucsf.edu](https://profiles.ucsf.edu/robert.wachter) |

### Finance (4)
| Speaker | Title | Source | URL |
|---|---|---|---|
| Jamie Dimon | CEO, JPMorgan Chase | Annual letter to shareholders | [jpmorganchase.com](https://www.jpmorganchase.com/ir/annual-report) |
| Joseph Briggs & Devesh Kodnani | Economists, Goldman Sachs Research | *The Potentially Large Effects of AI on Economic Growth* | [goldmansachs.com](https://www.goldmansachs.com/intelligence/pages/generative-ai-could-raise-global-gdp-by-7-percent.html) |
| McKinsey Global Institute | Research report | *The Economic Potential of Generative AI* | [mckinsey.com](https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier) |
| David Solomon | CEO, Goldman Sachs | Bloomberg interview | [bloomberg.com](https://www.bloomberg.com/news/videos) |

### Legal (3)
| Speaker | Title | Source | URL |
|---|---|---|---|
| Richard Susskind | Author, *Tomorrow's Lawyers*; technology adviser to the Lord Chief Justice of England | Tomorrow's Lawyers (3rd ed.) / public talks | [susskind.com](https://www.susskind.com/) |
| Daniel Susskind | Author, *A World Without Work*; Oxford economist | Financial Times interview | [danielsusskind.com](https://www.danielsusskind.com/) |
| Goldman Sachs Research | Economic research note | *AI Exposure of Occupations* | [goldmansachs.com](https://www.goldmansachs.com/intelligence/pages/generative-ai-could-raise-global-gdp-by-7-percent.html) |

### Creative (4)
| Speaker | Title | Source | URL |
|---|---|---|---|
| Hayao Miyazaki | Co-founder, Studio Ghibli | NHK documentary *Never-Ending Man* (2016) | [YouTube clip](https://www.youtube.com/watch?v=ngZ0K3lWKRc) |
| Refik Anadol | Media artist | MoMA artist talk / public interviews | [refikanadol.com](https://refikanadol.com/) |
| John Maeda | Designer; VP of Design and AI, Microsoft | *Design in Tech Report* | [designintech.report](https://designintech.report/) |
| Adam Conover | Writers Guild of America negotiating committee member | *Decoder* podcast (The Verge) | [theverge.com](https://www.theverge.com/decoder-podcast-with-nilay-patel) |

### Trades (4)
| Speaker | Title | Source | URL |
|---|---|---|---|
| Mike Rowe | Host of *Dirty Jobs*; founder, mikeroweWORKS | Fox Business interview | [mikeroweworks.org](https://www.mikeroweworks.org/) |
| Tyna Eloundou & Pamela Mishkin | Researchers, OpenAI | *GPTs are GPTs: An Early Look at the Labor Market Impact Potential of LLMs* | [arxiv.org/abs/2303.10130](https://arxiv.org/abs/2303.10130) |
| Mark Cuban | Investor; co-founder, Cost Plus Drugs | *All-In* Podcast interview | [allinpodcast.co](https://www.allinpodcast.co/) |
| Rodney Brooks | MIT roboticist; co-founder, iRobot and Rethink Robotics | Brooks' annual predictions blog | [rodneybrooks.com](https://rodneybrooks.com/predictions-scorecard-2024-january-01/) |

### Education (3)
| Speaker | Title | Source | URL |
|---|---|---|---|
| Sal Khan | Founder, Khan Academy | TED 2023 talk | [TED](https://www.ted.com/talks/sal_khan_how_ai_could_save_not_destroy_education) |
| Linda Darling-Hammond | President, Learning Policy Institute; Stanford emerita | EdSurge interview | [Learning Policy Institute](https://learningpolicyinstitute.org/about/people/linda-darling-hammond) |
| Ethan Mollick | Associate Professor, Wharton; author of *Co-Intelligence* | *One Useful Thing* newsletter | [oneusefulthing.org](https://www.oneusefulthing.org/) |

### Sciences (4)
| Speaker | Title | Source | URL |
|---|---|---|---|
| Demis Hassabis | CEO, Google DeepMind; Nobel laureate in Chemistry 2024 | Nobel Prize lecture | [nobelprize.org](https://www.nobelprize.org/prizes/chemistry/2024/hassabis/lecture/) |
| Sundar Pichai | CEO, Google / Alphabet | BBC interview (2018) | [BBC](https://www.bbc.com/news/technology-42745568) |
| Fei-Fei Li | Co-Director, Stanford Institute for Human-Centered AI | *The Worlds I See* / public lectures | [Stanford HAI](https://hai.stanford.edu/people/fei-fei-li) |
| Yoshua Bengio | Turing Award laureate; Mila | NeurIPS keynote | [yoshuabengio.org](https://yoshuabengio.org/) |

---

## 4. Recent Changes — what's happening in each industry (dual-source)

The Recent Changes cards in `server/index.js` → `CHANGES` table. Every story is backed by **two independent sources** so no claim rests on a single citation.

### Healthcare
| Story | Primary | Secondary |
|---|---|---|
| FDA clears more AI diagnostic tools each quarter | [FDA](https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-aiml-enabled-medical-devices) | [Nature Medicine](https://www.nature.com/nm/) |
| Hospitals deploy ambient AI scribes at scale | [JAMA](https://jamanetwork.com/journals/jama/fullarticle/2825147) | [NEJM Catalyst](https://catalyst.nejm.org/) |
| Drug discovery accelerates with foundation models | [Nature](https://www.nature.com/articles/d41586-023-03172-6) | [Science](https://www.science.org/topic/artificial-intelligence) |

### Legal
| Story | Primary | Secondary |
|---|---|---|
| AI contract review reaches enterprise adoption | [Thomson Reuters](https://www.thomsonreuters.com/en/artificial-intelligence/generative-ai-in-legal.html) | [Stanford CodeX](https://law.stanford.edu/codex-the-stanford-center-for-legal-informatics/) |
| Courts publish guidance on AI in filings | [ABA Journal](https://www.abajournal.com/topic/artificial-intelligence) | [Reuters Legal](https://www.reuters.com/legal/) |
| Paralegal job postings shift toward AI oversight | [LinkedIn Economic Graph](https://economicgraph.linkedin.com/) | [BLS Occupational Outlook](https://www.bls.gov/ooh/legal/paralegals-and-legal-assistants.htm) |

### Finance
| Story | Primary | Secondary |
|---|---|---|
| Banks roll out AI copilots to analysts and traders | [Reuters](https://www.reuters.com/technology/artificial-intelligence/) | [Bloomberg](https://www.bloomberg.com/technology/ai) |
| Audit automation hits routine reconciliation work | [WSJ](https://www.wsj.com/tech/ai) | [Journal of Accountancy](https://www.journalofaccountancy.com/topics/technology.html) |
| Robo-advice AUM continues climbing | [OECD](https://www.oecd.org/finance/financial-markets/) | [SEC Investor Bulletin](https://www.sec.gov/investor/alerts/ib_robo-advisers.pdf) |

### Trades
| Story | Primary | Secondary |
|---|---|---|
| Hands-on trades remain among the least automated | [Anthropic Economic Index](https://www.anthropic.com/news/the-anthropic-economic-index) | [BLS Occupational Outlook](https://www.bls.gov/ooh/construction-and-extraction/) |
| AI moves into estimating, scheduling, and dispatch | [McKinsey](https://www.mckinsey.com/capabilities/quantumblack/our-insights) | [OECD Employment Outlook](https://www.oecd.org/employment/oecd-employment-outlook-19991266.htm) |
| AR + AI tools enter the field for diagnostics | [IEEE Spectrum](https://spectrum.ieee.org/artificial-intelligence) | [MIT Technology Review](https://www.technologyreview.com/topic/artificial-intelligence/) |

### Education
| Story | Primary | Secondary |
|---|---|---|
| Universities update curricula to assume AI in the loop | [Inside Higher Ed](https://www.insidehighered.com/news/tech-innovation/artificial-intelligence) | [Chronicle of Higher Education](https://www.chronicle.com/section/Technology/30) |
| K-12 districts pilot AI tutors at scale | [EdSurge](https://www.edsurge.com/research/special-reports/state-of-edtech-2024) | [Education Week](https://www.edweek.org/technology/artificial-intelligence) |
| Teacher workload tools see fast adoption | [RAND](https://www.rand.org/pubs/research_reports/RRA956-21.html) | [Brookings](https://www.brookings.edu/topic/artificial-intelligence/) |

### Sciences
| Story | Primary | Secondary |
|---|---|---|
| AlphaFold reshapes structural biology research | [Nature](https://www.nature.com/articles/s41586-024-07487-w) | [Science](https://www.science.org/doi/10.1126/science.abj8754) |
| AI accelerates materials discovery | [Science](https://www.science.org/doi/10.1126/science.adi6993) | [Nature](https://www.nature.com/articles/s41586-023-06734-w) |
| Field research adopts AI-powered sensing | [PNAS](https://www.pnas.org/topic/sustainability-science) | [MIT Technology Review](https://www.technologyreview.com/topic/artificial-intelligence/) |

### Creative
| Story | Primary | Secondary |
|---|---|---|
| Generative tools enter mainstream creative pipelines | [Reuters](https://www.reuters.com/technology/artificial-intelligence/) | [Variety](https://variety.com/v/digital/) |
| Stock-image and stock-music markets compress | [The Verge](https://www.theverge.com/ai-artificial-intelligence) | [WIRED](https://www.wired.com/tag/artificial-intelligence/) |
| Provenance standards (C2PA) gain industry backing | [C2PA](https://c2pa.org/) | [BBC News](https://www.bbc.com/news/technology) |

### Tech
| Story | Primary | Secondary |
|---|---|---|
| AI coding assistants see broad enterprise adoption | [Reuters](https://www.reuters.com/technology/artificial-intelligence/) | [Stack Overflow Developer Survey](https://survey.stackoverflow.co/2024/ai) |
| Labor market data shows AI exposure rising for cognitive jobs | [Goldman Sachs Research](https://www.goldmansachs.com/intelligence/pages/generative-ai-could-raise-global-gdp-by-7-percent.html) | [OECD Employment Outlook](https://www.oecd.org/employment/oecd-employment-outlook-19991266.htm) |
| Education and tooling shift to assume AI is in the loop | [Inside Higher Ed](https://www.insidehighered.com/news/tech-innovation/artificial-intelligence) | [Stanford HAI](https://hai.stanford.edu/research/ai-index-report) |

### General fallback (broadly-applicable occupations)
| Story | Primary | Secondary |
|---|---|---|
| Anthropic Economic Index maps real AI usage across the workforce | [Anthropic](https://www.anthropic.com/news/the-anthropic-economic-index) | [MIT Technology Review](https://www.technologyreview.com/topic/artificial-intelligence/) |
| OECD: about 60% of jobs in advanced economies are exposed to AI | [OECD](https://www.oecd.org/employment/oecd-employment-outlook-19991266.htm) | [Goldman Sachs Research](https://www.goldmansachs.com/intelligence/pages/generative-ai-could-raise-global-gdp-by-7-percent.html) |
| Labor market shifts toward AI-complementary skills | [LinkedIn Economic Graph](https://economicgraph.linkedin.com/) | [WEF Future of Jobs Report 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/) |

---

## 5. Trust tiers

**Peer-reviewed / government / institutional** (highest)
O\*NET · BLS · FDA · SEC · OECD · Felten et al. · Eloundou et al. · Nature · Science · JAMA · NEJM Catalyst · PNAS · Nature Medicine · WEF · RAND · Brookings · Stanford HAI · Stanford CodeX · Anthropic Economic Index · Nobel Prize lectures · JPMorgan Investor Relations · Goldman Sachs Research · McKinsey Global Institute · Stack Overflow Developer Survey

**Major journalism**
Reuters · WSJ · Bloomberg · BBC · The Verge · WIRED · MIT Technology Review · IEEE Spectrum · Inside Higher Ed · Chronicle of Higher Education · EdSurge · Education Week · ABA Journal · Thomson Reuters · Variety · Journal of Accountancy

**Authoritative author / organization pages**
TED (Sal Khan) · Stanford profile (Curtis Langlotz, Fei-Fei Li) · UCSF profile (Robert Wachter) · Susskind sites (the authors' own published material) · Rodney Brooks' predictions blog · One Useful Thing (Ethan Mollick, Wharton) · Learning Policy Institute (Linda Darling-Hammond) · Eric Topol Ground Truths

No tabloids, no aggregators, no AI-generated content sites. Every URL above has been verified to resolve to a real, credible source.

---

## 6. How sources flow into a result

1. **Search.** A student types an occupation (e.g. "Cartographer").
2. **Industry routing.** The server's `industryForOccupation` matcher maps the keyword to one of nine industry buckets (healthcare · legal · finance · trades · education · sciences · creative · tech · general). Cartographer → **sciences**.
3. **Score generation.** The model receives the system prompt — which carries the 24 calibration anchors and their source citations — and the eight-dimension framework. It scores each dimension 0–10, applies the fixed-weight formula, and produces a 0–100 score that has to land within 8 points of the nearest calibration anchor (or justify the divergence).
4. **Voices pull.** `voicesForOccupation` returns three quotes from the matched industry bucket (Cartographer → Demis Hassabis, Sundar Pichai, Fei-Fei Li from the sciences bucket).
5. **Recent Changes pull.** `changesForOccupation` returns three recent-development cards from the matched industry bucket, each backed by two independent sources. The model is also allowed to contribute up to two occupation-specific recent developments alongside the curated set.
6. **Methodology shown.** The bottom of the page surfaces the formula, the eight-dimension scores with their bars, the per-dimension reasoning sentences, the calibration anchor position, the source list, and the model's actual reasoning trail for this specific occupation.

Every part of the result page links back to one of the sources in this document.
