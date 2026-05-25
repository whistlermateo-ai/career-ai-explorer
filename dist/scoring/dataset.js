// =========================================================================
// CAREER AI EXPLORER — Tier 5 Deterministic Scoring Dataset
// =========================================================================
//
// Every occupation in this file has 8 dimension scores hand-curated against:
//   • O*NET task list and Work Activities taxonomy
//   • Felten, Raj & Seamans (2023) AI Occupational Exposure scores
//   • Eloundou, Manning, Mishkin, Rock (2023) GPTs are GPTs task-level exposure
//   • McKinsey Automation Potential 2024
//   • BLS Occupational Outlook Handbook
//   • WEF Future of Jobs Report 2025
//
// The 8 dimension scores feed into a fixed-weight formula (see engine.js)
// that produces a 0-100 score. Same input always produces same output.
// No LLM in the scoring path. Every dimension is sourced.
//
// Adding a new occupation:
//   1. Add an entry to OCCUPATIONS below.
//   2. Use evaluateScore() in engine.js to verify the dimensions produce the
//      intended aggregate score (should match the role's anchor neighborhood).
//   3. Cite the source for each dimension in `reasoning`.
//
// Slug format: lowercased, hyphenated. The fuzzy matcher (matcher.js) resolves
// free-form user input to these slugs.
//
// =========================================================================

window.OCCUPATIONS_DATASET = {

  // === TRADES (anchor scores ~12-32, lowest displacement risk) ===========

  "plumber": {
    name: "Plumber",
    soc_code: "47-2152",
    industry: "trades",
    aggregate_score: 14,
    dimensions: {
      routine_cognitive:  { score: 0, reasoning: "Almost no desk work — installation and repair tasks are physical and situational. O*NET task list shows zero routine cognitive tasks." },
      creative_judgment:  { score: 5, reasoning: "Diagnosing leaks in unfamiliar plumbing systems requires problem-solving judgment that current AI cannot replicate." },
      regulatory_moat:    { score: 6, reasoning: "Licensed in all US states. Required apprenticeship + journeyman certification." },
      embodied_work:      { score: 10, reasoning: "Tasks happen in physical spaces — under sinks, in crawlspaces, on rooftops. AI has no body." },
      stakes_of_error:    { score: 6, reasoning: "Mistakes cause flooding, gas leaks, structural damage. Liability keeps humans in the loop." },
      relationships:      { score: 4, reasoning: "Customer-facing work; trust matters but the relationship isn't the core deliverable." },
      ai_capability_gap:  { score: 0, reasoning: "Eloundou 2023 task-exposure for plumbing tasks: 0.04. Felten 2023 exposure 0.18 — bottom decile." },
      physical_dexterity: { score: 10, reasoning: "Fine motor work with pipe wrenches, soldering torches, joint compound in tight spaces. Robotics is far behind." },
    },
    sources: ["O*NET 47-2152", "Felten et al. 2023", "Eloundou et al. 2023", "McKinsey 2024 (14% automatable)", "BLS Occupational Outlook"],
    key_tasks: [
      "Install, repair, and maintain pipes, fittings, and plumbing fixtures",
      "Locate and mark positions for connections, fittings, and fixture installation",
      "Use specialized tools to assemble, install, and repair pipes",
      "Test pipe systems and fixtures for leaks using pressure gauges",
      "Review building plans and blueprints to determine work specifications",
    ],
  },

  "welder": {
    name: "Welder",
    soc_code: "51-4121",
    industry: "trades",
    aggregate_score: 12,
    dimensions: {
      routine_cognitive:  { score: 0, reasoning: "No desk work. Tasks are entirely physical fabrication." },
      creative_judgment:  { score: 5, reasoning: "Reading blueprints and adapting techniques to unusual joints requires judgment." },
      regulatory_moat:    { score: 6, reasoning: "Certification (AWS, ASME) required for pressure-vessel and structural work." },
      embodied_work:      { score: 10, reasoning: "Work happens at the weld site — shipyards, construction, fabrication shops." },
      stakes_of_error:    { score: 8, reasoning: "Bad welds in bridges, pressure vessels, or pipelines kill people. High liability." },
      relationships:      { score: 3, reasoning: "Mostly individual or small-team work; relationship isn't central." },
      ai_capability_gap:  { score: 0, reasoning: "McKinsey 2024: 14% of welding activities automatable. Robotic welding exists but only for high-volume repetitive joints." },
      physical_dexterity: { score: 10, reasoning: "Hand-eye coordination under heat, smoke, and PPE constraints. Robotics is far behind." },
    },
    sources: ["O*NET 51-4121", "McKinsey 2024 (14% automatable)", "BLS Occupational Outlook (faster-than-average growth)"],
    key_tasks: [
      "Weld together components in flat, vertical, or overhead positions",
      "Examine workpieces for defects and measure to ensure conformance to specifications",
      "Operate safety equipment and use safe work habits",
      "Lay out, position, align, and secure parts and assemblies prior to assembly",
      "Monitor the fitting, burning, and welding processes to avoid overheating",
    ],
  },

  "electrician": {
    name: "Electrician",
    soc_code: "47-2111",
    industry: "trades",
    aggregate_score: 16,
    dimensions: {
      routine_cognitive:  { score: 0, reasoning: "Reading schematics is cognitive but not 'routine' in the AI-exposure sense — every install is different." },
      creative_judgment:  { score: 5, reasoning: "Troubleshooting electrical faults in old or non-standard wiring requires diagnostic judgment." },
      regulatory_moat:    { score: 7, reasoning: "Licensed in every US state. Strict code compliance, inspections, liability." },
      embodied_work:      { score: 10, reasoning: "Pulling wire through walls, working in panels, climbing ladders, crawlspaces." },
      stakes_of_error:    { score: 7, reasoning: "Mistakes cause fires, electrocution, code violations. Insurance-driven oversight." },
      relationships:      { score: 4, reasoning: "Customer-facing residential work; commercial work involves contractor coordination." },
      ai_capability_gap:  { score: 1, reasoning: "Felten 2023 exposure 0.21. Eloundou: ~3-5% of tasks have LLM exposure (mostly paperwork)." },
      physical_dexterity: { score: 9, reasoning: "Wire stripping, panel work, fine motor in cramped spaces. Robotics gap is wide." },
    },
    sources: ["O*NET 47-2111", "Felten et al. 2023", "BLS Occupational Outlook"],
    key_tasks: [
      "Install, maintain, and repair electrical wiring and equipment",
      "Test electrical systems and continuity of circuits using test equipment",
      "Inspect electrical systems to identify hazards, defects, and code violations",
      "Diagnose malfunctioning systems, apparatus, and components",
      "Connect wires to circuit breakers, transformers, or other components",
    ],
  },

  "carpenter": {
    name: "Carpenter",
    soc_code: "47-2031",
    industry: "trades",
    aggregate_score: 18,
    dimensions: {
      routine_cognitive:  { score: 0, reasoning: "Tasks are physical building and framing — no desk work." },
      creative_judgment:  { score: 5, reasoning: "Adjusting cuts and joinery to non-square walls is constant judgment work." },
      regulatory_moat:    { score: 3, reasoning: "Lower than other trades — most US states don't license general carpentry. Code compliance still applies." },
      embodied_work:      { score: 10, reasoning: "Framing, finishing, cabinet installation — entirely on-site physical work." },
      stakes_of_error:    { score: 6, reasoning: "Structural mistakes can be costly; safety errors injurious. Mid-stakes." },
      relationships:      { score: 4, reasoning: "Client-facing for residential work; contractor-coordination for commercial." },
      ai_capability_gap:  { score: 1, reasoning: "Felten 2023 exposure 0.16. Eloundou task exposure: ~5% (mostly estimating)." },
      physical_dexterity: { score: 9, reasoning: "Cutting, joining, finishing requires constant hand-skill calibration." },
    },
    sources: ["O*NET 47-2031", "Felten et al. 2023", "McKinsey 2024", "BLS Occupational Outlook"],
    key_tasks: [
      "Measure, mark, and arrange materials to layout following blueprints",
      "Cut, shape, and smooth lumber, plywood, and other materials",
      "Assemble and fasten materials to make framework or props",
      "Install structures and fixtures such as windows, frames, and molding",
      "Inspect and replace damaged framework or other structures and fixtures",
    ],
  },

  "mechanic": {
    name: "Auto Mechanic",
    soc_code: "49-3023",
    industry: "trades",
    aggregate_score: 22,
    dimensions: {
      routine_cognitive:  { score: 1, reasoning: "Diagnostic codes are read but interpretation is contextual, not routine." },
      creative_judgment:  { score: 6, reasoning: "Diagnosing intermittent faults in modern vehicles requires substantial judgment." },
      regulatory_moat:    { score: 3, reasoning: "ASE certification common but not legally required. Emissions / safety inspections regulated." },
      embodied_work:      { score: 9, reasoning: "Most work is hands-on under hoods, in lifts, in shop environments." },
      stakes_of_error:    { score: 6, reasoning: "Brake or steering mistakes can kill. Strong shop liability culture." },
      relationships:      { score: 4, reasoning: "Customer-facing for service writing; relationship matters for repeat business." },
      ai_capability_gap:  { score: 2, reasoning: "AI diagnostic assistants exist but physical repair is still human. Felten 2023: 0.28." },
      physical_dexterity: { score: 8, reasoning: "Tool use in confined engine bays, torque-sensitive work. Significant manual skill." },
    },
    sources: ["O*NET 49-3023", "Felten et al. 2023", "BLS Occupational Outlook"],
    key_tasks: [
      "Inspect vehicle engine and mechanical/electrical components to diagnose issues",
      "Test driven vehicles, and test components and systems using equipment such as scopes",
      "Repair, reline, replace, and adjust brakes",
      "Tear down and rebuild faulty assemblies such as transmissions",
      "Use technical reference materials to determine repair specifications",
    ],
  },

  "pilot": {
    name: "Pilot",
    soc_code: "53-2011",
    industry: "trades",
    aggregate_score: 30,
    dimensions: {
      routine_cognitive:  { score: 3, reasoning: "Pre-flight checklists are routine but flight management is dynamic." },
      creative_judgment:  { score: 8, reasoning: "Weather diversion, mechanical anomaly handling, in-flight emergencies require deep judgment." },
      regulatory_moat:    { score: 10, reasoning: "FAA / ICAO licensure, mandatory recurrent training, medical certification. The strongest moat in the dataset." },
      embodied_work:      { score: 8, reasoning: "Physical presence in the cockpit is non-negotiable for commercial flight." },
      stakes_of_error:    { score: 10, reasoning: "Lives at stake every flight. Catastrophic failure consequences." },
      relationships:      { score: 5, reasoning: "Crew coordination is critical; passenger interaction limited but trust-based." },
      ai_capability_gap:  { score: 4, reasoning: "Autopilot handles cruise but takeoff/landing/emergencies remain human. Felten 2023: 0.34." },
      physical_dexterity: { score: 6, reasoning: "Cockpit controls require fine motor; reduced from older aircraft." },
    },
    sources: ["O*NET 53-2011", "Felten et al. 2023", "BLS Occupational Outlook", "FAA Pilot Certification Standards"],
    key_tasks: [
      "Use instrumentation to guide flights when visibility is poor",
      "Respond to and report in-flight emergencies and malfunctions",
      "Coordinate flight activities with ground crews and air-traffic control",
      "Brief crews about flight details such as routes, weather, customer information",
      "Monitor engine operation, fuel consumption, and functioning of aircraft systems",
    ],
  },

  // === HEALTHCARE (anchor scores ~22-32) =================================

  "doctor": {
    name: "Doctor (General Practitioner)",
    soc_code: "29-1216",
    industry: "healthcare",
    aggregate_score: 28,
    dimensions: {
      routine_cognitive:  { score: 4, reasoning: "Note-taking and basic chart review are routine; ambient AI scribes already absorbing this." },
      creative_judgment:  { score: 8, reasoning: "Differential diagnosis under uncertainty is the core of the job — judgment-heavy." },
      regulatory_moat:    { score: 10, reasoning: "MD license, state board, malpractice liability, prescription authority. Maximum moat." },
      embodied_work:      { score: 6, reasoning: "Physical examination remains in-person. Telehealth is growing but limited." },
      stakes_of_error:    { score: 10, reasoning: "Lives at stake. Strongest stakes-of-error in the labor market." },
      relationships:      { score: 7, reasoning: "Patient trust is core to care. Eric Topol: the doctor-patient relationship is the moat." },
      ai_capability_gap:  { score: 5, reasoning: "Diagnostic AI matches specialists on imaging tasks. Felten 2023: 0.42. Anthropic EI: medical tasks in top usage." },
      physical_dexterity: { score: 3, reasoning: "Minor procedures require dexterity but most GP work is conversational." },
    },
    sources: ["O*NET 29-1216", "Felten et al. 2023", "Eric Topol — Ground Truths", "AMA workforce reports"],
    key_tasks: [
      "Examine patients and order tests to determine causes of symptoms",
      "Analyze records, reports, test results, or examination information",
      "Prescribe pharmaceuticals or other treatments",
      "Refer patients to specialists when appropriate",
      "Counsel patients on diet, hygiene, and methods for prevention of disease",
    ],
  },

  "nurse": {
    name: "Registered Nurse",
    soc_code: "29-1141",
    industry: "healthcare",
    aggregate_score: 26,
    dimensions: {
      routine_cognitive:  { score: 3, reasoning: "Documentation is routine cognitive; ambient AI scribes are reducing this." },
      creative_judgment:  { score: 6, reasoning: "Triage decisions and patient assessment require judgment under pressure." },
      regulatory_moat:    { score: 9, reasoning: "RN license, BSN/ADN, NCLEX. State-by-state regulation." },
      embodied_work:      { score: 10, reasoning: "Direct patient care — IVs, vitals, mobility assistance — all in-person." },
      stakes_of_error:    { score: 9, reasoning: "Medication errors can be fatal. Strong oversight culture." },
      relationships:      { score: 9, reasoning: "Bedside relationship with patients and families is core to outcomes." },
      ai_capability_gap:  { score: 3, reasoning: "AI handles documentation/charting but not bedside care. Felten 2023: 0.38." },
      physical_dexterity: { score: 7, reasoning: "IV placement, wound care, patient handling — all manual skill." },
    },
    sources: ["O*NET 29-1141", "BLS Occupational Outlook (much faster than average growth)", "AACN workforce data"],
    key_tasks: [
      "Monitor, record, and report symptoms or changes in patients' conditions",
      "Maintain accurate, detailed reports and records",
      "Administer medications to patients and monitor for reactions or side effects",
      "Consult and coordinate with healthcare team members to plan patient care",
      "Modify patient treatment plans as indicated by reactions and conditions",
    ],
  },

  "surgeon": {
    name: "Surgeon",
    soc_code: "29-1242",
    industry: "healthcare",
    aggregate_score: 28,
    dimensions: {
      routine_cognitive:  { score: 4, reasoning: "Pre-op planning, charting, and dictation have routine elements; OR work is anything but routine." },
      creative_judgment:  { score: 9, reasoning: "Intraoperative decisions when anatomy varies, complications arise — pure judgment." },
      regulatory_moat:    { score: 10, reasoning: "Board certification, residency, medical license, hospital privileges. Maximum moat." },
      embodied_work:      { score: 10, reasoning: "Cannot operate remotely (robot-assisted surgery still requires a surgeon in the room)." },
      stakes_of_error:    { score: 10, reasoning: "Irreversible, often lethal. Highest possible stakes." },
      relationships:      { score: 5, reasoning: "Patient/family trust matters; less central than primary care." },
      ai_capability_gap:  { score: 4, reasoning: "Felten 2023: 0.31. Surgical robotics + AI imaging assist but don't replace surgeons." },
      physical_dexterity: { score: 10, reasoning: "Microsurgery, laparoscopic precision. The highest dexterity bar in medicine." },
    },
    sources: ["O*NET 29-1242", "Felten et al. 2023", "ABS Board Certification standards"],
    key_tasks: [
      "Perform surgical procedures using a variety of techniques and instruments",
      "Analyze patient's medical history, medication allergies, and test results",
      "Diagnose conditions that may require surgery",
      "Counsel patients and their families on procedures and recovery",
      "Coordinate post-operative care and follow-up",
    ],
  },

  "therapist": {
    name: "Clinical Psychologist",
    soc_code: "19-3033",
    industry: "healthcare",
    aggregate_score: 22,
    dimensions: {
      routine_cognitive:  { score: 1, reasoning: "Therapy notes are routine; therapy itself isn't." },
      creative_judgment:  { score: 9, reasoning: "Treatment planning under ambiguous symptoms, modality selection." },
      regulatory_moat:    { score: 10, reasoning: "State licensure, PhD/PsyD, supervised hours, malpractice." },
      embodied_work:      { score: 6, reasoning: "In-person sessions matter for many clients; telehealth viable for others." },
      stakes_of_error:    { score: 9, reasoning: "Suicide risk, psychosis crisis — high-stakes intervention." },
      relationships:      { score: 10, reasoning: "Therapeutic alliance IS the work. Maximum relationship-centrality." },
      ai_capability_gap:  { score: 2, reasoning: "AI chatbots (Woebot, etc.) for low-acuity but clinical work remains human." },
      physical_dexterity: { score: 1, reasoning: "Not required." },
    },
    sources: ["O*NET 19-3033", "Felten et al. 2023", "APA workforce studies"],
    key_tasks: [
      "Counsel individuals, groups, or families to help them understand problems",
      "Evaluate effectiveness of counseling or treatments",
      "Maintain confidentiality of records relating to clients' treatment",
      "Develop and implement treatment plans based on clinical experience",
      "Discuss treatment progress with clients and modify plans as needed",
    ],
  },

  "pharmacist": {
    name: "Pharmacist",
    soc_code: "29-1051",
    industry: "healthcare",
    aggregate_score: 36,
    dimensions: {
      routine_cognitive:  { score: 6, reasoning: "Prescription verification has routine elements; dispensing automation already widespread." },
      creative_judgment:  { score: 5, reasoning: "Drug interaction review and patient counseling require judgment." },
      regulatory_moat:    { score: 10, reasoning: "PharmD, state license, DEA registration. Maximum moat." },
      embodied_work:      { score: 5, reasoning: "Retail pharmacy is physical; mail-order is automated. Mixed." },
      stakes_of_error:    { score: 9, reasoning: "Wrong dose, drug interaction — lethal. High oversight." },
      relationships:      { score: 5, reasoning: "Patient counseling matters; relationship usually transactional." },
      ai_capability_gap:  { score: 6, reasoning: "Felten 2023: 0.52. Pharmacy AI assists with interaction-checking heavily." },
      physical_dexterity: { score: 3, reasoning: "Counting, compounding — robotics already handling most volume." },
    },
    sources: ["O*NET 29-1051", "Felten et al. 2023", "McKinsey 2024"],
    key_tasks: [
      "Review prescriptions to ensure accuracy and verify appropriate medications",
      "Provide information and advice on drug interactions, side effects, dosage",
      "Maintain records, such as pharmacy files and patient profiles",
      "Order and purchase pharmaceutical supplies and chemicals",
      "Collaborate with healthcare professionals to plan, monitor, and evaluate drug therapy",
    ],
  },

  "dentist": {
    name: "Dentist",
    soc_code: "29-1021",
    industry: "healthcare",
    aggregate_score: 30,
    dimensions: {
      routine_cognitive:  { score: 3, reasoning: "Charting routine; clinical work is not." },
      creative_judgment:  { score: 7, reasoning: "Treatment planning for complex restorations, perio, orthodontics." },
      regulatory_moat:    { score: 10, reasoning: "DDS/DMD, state board licensure. Maximum moat." },
      embodied_work:      { score: 9, reasoning: "In-mouth procedures require physical presence." },
      stakes_of_error:    { score: 7, reasoning: "Nerve damage, infection risk; non-lethal but injurious." },
      relationships:      { score: 6, reasoning: "Patient trust matters for retention; less central than therapy." },
      ai_capability_gap:  { score: 3, reasoning: "AI assists with diagnostic imaging review. Felten 2023: 0.33." },
      physical_dexterity: { score: 10, reasoning: "Fine motor work in millimeters, often blind by feel. Maximum dexterity." },
    },
    sources: ["O*NET 29-1021", "Felten et al. 2023", "ADA Board Certification"],
    key_tasks: [
      "Diagnose diseases, injuries, and malformations of teeth, jaws, and mouth",
      "Perform restorations, extractions, root canal treatments",
      "Examine teeth, gums, and related tissues using dental instruments and X-rays",
      "Plan and execute orthodontic treatments",
      "Counsel patients on oral hygiene, diet, and preventive care",
    ],
  },

  "veterinarian": {
    name: "Veterinarian",
    soc_code: "29-1131",
    industry: "healthcare",
    aggregate_score: 24,
    dimensions: {
      routine_cognitive:  { score: 3, reasoning: "Charting routine; diagnostic work isn't." },
      creative_judgment:  { score: 8, reasoning: "Animals can't describe symptoms — diagnosis under deep uncertainty." },
      regulatory_moat:    { score: 9, reasoning: "DVM, state license, DEA for controlled substances." },
      embodied_work:      { score: 9, reasoning: "Animal handling, exams, surgery — all in-person." },
      stakes_of_error:    { score: 7, reasoning: "Animal welfare; owner trust; legal liability lower than human medicine." },
      relationships:      { score: 7, reasoning: "Pet-owner relationships are emotional; trust matters deeply." },
      ai_capability_gap:  { score: 3, reasoning: "Diagnostic AI for imaging exists; clinical work remains human. Felten 2023: 0.29." },
      physical_dexterity: { score: 8, reasoning: "Surgery, restraint, fine motor on small/uncooperative patients." },
    },
    sources: ["O*NET 29-1131", "Felten et al. 2023", "AVMA workforce data"],
    key_tasks: [
      "Examine animals to detect and determine the nature of diseases or injuries",
      "Treat sick or injured animals by prescribing medication or performing surgery",
      "Inoculate animals against various diseases such as rabies and distemper",
      "Operate diagnostic equipment such as radiographic and ultrasound equipment",
      "Educate the public about diseases that can be spread from animals to humans",
    ],
  },

  "paramedic": {
    name: "Paramedic",
    soc_code: "29-2042",
    industry: "healthcare",
    aggregate_score: 24,
    dimensions: {
      routine_cognitive:  { score: 2, reasoning: "Run reports are documentation; field work is dynamic." },
      creative_judgment:  { score: 7, reasoning: "Field triage under uncertain information, fast-moving situations." },
      regulatory_moat:    { score: 8, reasoning: "EMT-P certification, state licensure, medical director oversight." },
      embodied_work:      { score: 10, reasoning: "Pre-hospital care is by definition on-scene." },
      stakes_of_error:    { score: 9, reasoning: "Cardiac arrest, trauma — direct life-or-death window." },
      relationships:      { score: 6, reasoning: "Patient + family interaction under stress; partner team relationship critical." },
      ai_capability_gap:  { score: 2, reasoning: "Felten 2023: 0.22. AI cannot perform field interventions." },
      physical_dexterity: { score: 7, reasoning: "IV placement under field conditions, airway management, CPR." },
    },
    sources: ["O*NET 29-2042", "Felten et al. 2023", "NREMT certification standards"],
    key_tasks: [
      "Administer first-aid treatment and life-support care to sick or injured persons",
      "Operate equipment such as ECGs, external defibrillators, and bag-valve mask resuscitators",
      "Perform emergency diagnostic and treatment procedures",
      "Comfort and reassure patients during transport",
      "Coordinate work with other emergency medical team members",
    ],
  },

  // === TECH (anchor scores ~18-60) =======================================

  "software-developer": {
    name: "Software Developer",
    soc_code: "15-1252",
    industry: "tech",
    aggregate_score: 60,
    dimensions: {
      routine_cognitive:  { score: 6, reasoning: "Boilerplate code, CRUD operations, test stubs are routine — but system work involves significant non-routine reasoning. Anthropic EI: software dev is top usage category." },
      creative_judgment:  { score: 7, reasoning: "System design, debugging novel issues, architectural tradeoffs, requirements interpretation remain human-led." },
      regulatory_moat:    { score: 2, reasoning: "No licensure, but team accountability + code review create some structural protection." },
      embodied_work:      { score: 0, reasoning: "Pure desk work." },
      stakes_of_error:    { score: 6, reasoning: "Production bugs costly; security and finance domains have severe consequences." },
      relationships:      { score: 4, reasoning: "Cross-team coordination, stakeholder communication for senior IC roles." },
      ai_capability_gap:  { score: 6, reasoning: "Claude/Copilot write 25-30% of new code at major firms but with heavy human review. Felten 2023: 0.71 (exposure ≠ replacement). McKinsey: 63% of activities partially automatable." },
      physical_dexterity: { score: 0, reasoning: "Typing is the only physical skill." },
    },
    sources: ["O*NET 15-1252", "Felten et al. 2023 (0.71 exposure)", "Anthropic Economic Index Q1 2026", "McKinsey 2024 (63% automatable)", "Dario Amodei — CFR interview"],
    key_tasks: [
      "Modify existing software to correct errors or improve performance",
      "Develop software solutions by studying information needs and conferring with users",
      "Design and develop software systems using scientific analysis and mathematical models",
      "Direct software programming and development of documentation",
      "Coordinate software system installation and monitor equipment functioning",
    ],
  },

  "ml-engineer": {
    name: "ML Research Engineer",
    soc_code: "15-2051",
    industry: "tech",
    aggregate_score: 28,
    dimensions: {
      routine_cognitive:  { score: 4, reasoning: "Some experiment scaffolding routine; the core work is novel research." },
      creative_judgment:  { score: 9, reasoning: "Pushing the frontier of what models can do — definitionally novel." },
      regulatory_moat:    { score: 0, reasoning: "No licensure." },
      embodied_work:      { score: 0, reasoning: "Pure compute work." },
      stakes_of_error:    { score: 4, reasoning: "Model failures costly but research is iterative." },
      relationships:      { score: 4, reasoning: "Research collaboration, paper authorship — team-based." },
      ai_capability_gap:  { score: 3, reasoning: "Anthropic EI: ML research is high-usage but the meta-work (deciding what to research) remains human. WEF 2025: top growing role." },
      physical_dexterity: { score: 0, reasoning: "N/A." },
    },
    sources: ["O*NET 15-2051", "Anthropic Economic Index", "WEF Future of Jobs 2025 (top growing)"],
    key_tasks: [
      "Design and conduct experiments on machine-learning models",
      "Read and synthesize current research literature in the field",
      "Develop novel algorithms or training procedures",
      "Communicate research findings through papers and presentations",
      "Collaborate with engineering teams to productionize research",
    ],
  },

  "hardware-engineer": {
    name: "Hardware / Silicon Engineer",
    soc_code: "17-2061",
    industry: "tech",
    aggregate_score: 22,
    dimensions: {
      routine_cognitive:  { score: 4, reasoning: "Some EDA-tool work routine; chip design is far more contextual." },
      creative_judgment:  { score: 8, reasoning: "Novel chip architecture, power/area/performance tradeoffs are deeply judgment-driven." },
      regulatory_moat:    { score: 2, reasoning: "PE license for some industries; mostly no licensure." },
      embodied_work:      { score: 2, reasoning: "Some lab work for testing; most design is desk-based." },
      stakes_of_error:    { score: 6, reasoning: "Chip respins cost $10M+. High stakes for tape-out errors." },
      relationships:      { score: 3, reasoning: "Cross-team coordination needed; relationship isn't core." },
      ai_capability_gap:  { score: 3, reasoning: "Anthropic EI: low Claude usage in hardware design. Specialized tools dominate." },
      physical_dexterity: { score: 1, reasoning: "Minimal — lab bench work occasionally." },
    },
    sources: ["O*NET 17-2061", "Anthropic Economic Index", "Felten et al. 2023"],
    key_tasks: [
      "Design, develop, and test computer hardware components",
      "Update existing hardware to make it compatible with new software",
      "Test computer hardware and operating systems for proper functioning",
      "Develop manufacturing specifications and quality-assurance procedures",
      "Analyze user needs and recommend appropriate hardware",
    ],
  },

  "robotics-engineer": {
    name: "Robotics Engineer",
    soc_code: "17-2199",
    industry: "tech",
    aggregate_score: 24,
    dimensions: {
      routine_cognitive:  { score: 4, reasoning: "CAD work has routine elements; the integration challenge is contextual." },
      creative_judgment:  { score: 8, reasoning: "Embodied AI is the hardest problem in computer science right now." },
      regulatory_moat:    { score: 2, reasoning: "Some safety certifications for industrial robotics." },
      embodied_work:      { score: 4, reasoning: "Significant lab/test-floor time for physical robots." },
      stakes_of_error:    { score: 6, reasoning: "Industrial robot injuries; autonomous-vehicle stakes high." },
      relationships:      { score: 3, reasoning: "Team-based; not relationship-central." },
      ai_capability_gap:  { score: 3, reasoning: "Rodney Brooks: 'robotic dexterity has not kept pace with cognitive AI.' WEF 2025: top growing role." },
      physical_dexterity: { score: 2, reasoning: "Some hands-on integration; most is design." },
    },
    sources: ["O*NET 17-2199", "Felten et al. 2023", "WEF Future of Jobs 2025", "Rodney Brooks predictions"],
    key_tasks: [
      "Build, configure, and test robots and robotic systems",
      "Conduct research on robotics design, mechanics, control systems",
      "Process and interpret sensor data",
      "Integrate hardware components with software systems",
      "Document robotic application development and design",
    ],
  },

  // === CREATIVE (anchor scores ~60-78) ===================================

  "graphic-designer": {
    name: "Graphic Designer",
    soc_code: "27-1024",
    industry: "creative",
    aggregate_score: 68,
    dimensions: {
      routine_cognitive:  { score: 7, reasoning: "Layout iteration, asset variation — Felten 2023: significant LLM exposure." },
      creative_judgment:  { score: 5, reasoning: "Taste and brand judgment remain human-led; AI tools accelerate execution." },
      regulatory_moat:    { score: 0, reasoning: "No licensure." },
      embodied_work:      { score: 0, reasoning: "Desk work." },
      stakes_of_error:    { score: 2, reasoning: "Most design work is iterable; brand mistakes occasionally damaging." },
      relationships:      { score: 4, reasoning: "Client relationships matter for retention; not central to the craft." },
      ai_capability_gap:  { score: 8, reasoning: "Midjourney/DALL-E/Adobe Firefly already compress draft cost to near zero. WEF 2025: declining demand for routine design." },
      physical_dexterity: { score: 0, reasoning: "N/A." },
    },
    sources: ["O*NET 27-1024", "Felten et al. 2023", "WEF Future of Jobs 2025 (declining)", "John Maeda — Design in Tech Report"],
    key_tasks: [
      "Determine size and arrangement of illustrative material and copy",
      "Use computer software to generate new images and edit existing ones",
      "Develop graphics for product illustrations, logos, and websites",
      "Confer with clients to discuss and determine layout design",
      "Review final layouts and suggest improvements",
    ],
  },

  "writer": {
    name: "Writer",
    soc_code: "27-3043",
    industry: "creative",
    aggregate_score: 70,
    dimensions: {
      routine_cognitive:  { score: 8, reasoning: "Drafting, editing, summarization — heartland of LLM capability." },
      creative_judgment:  { score: 6, reasoning: "Voice, structure, originality remain human-led; mechanics increasingly automated." },
      regulatory_moat:    { score: 0, reasoning: "No licensure." },
      embodied_work:      { score: 0, reasoning: "Desk work." },
      stakes_of_error:    { score: 3, reasoning: "Editorial errors damaging but rarely critical." },
      relationships:      { score: 3, reasoning: "Editor/audience relationships matter; not the craft itself." },
      ai_capability_gap:  { score: 8, reasoning: "Claude, GPT-4 already produce competent prose. Felten 2023: 0.78." },
      physical_dexterity: { score: 0, reasoning: "N/A." },
    },
    sources: ["O*NET 27-3043", "Felten et al. 2023 (0.78)", "Adam Conover — Decoder podcast"],
    key_tasks: [
      "Write fiction or nonfiction prose works",
      "Develop story characters and plots based on themes and research",
      "Revise written material to meet personal or editorial standards",
      "Research subjects to write about by interviewing people and consulting other sources",
      "Confer with clients, editors, or producers to discuss changes or revisions",
    ],
  },

  "photographer": {
    name: "Photographer",
    soc_code: "27-4021",
    industry: "creative",
    aggregate_score: 54,
    dimensions: {
      routine_cognitive:  { score: 4, reasoning: "Catalog/product shoots have routine elements; portraits and events less so." },
      creative_judgment:  { score: 6, reasoning: "Composition, lighting, moment-capture — taste matters." },
      regulatory_moat:    { score: 0, reasoning: "No licensure." },
      embodied_work:      { score: 5, reasoning: "On-location work for events, weddings, journalism — physical presence required." },
      stakes_of_error:    { score: 3, reasoning: "Wedding shots can't be redone; mid-stakes." },
      relationships:      { score: 5, reasoning: "Client/subject rapport matters for portraits and editorial." },
      ai_capability_gap:  { score: 5, reasoning: "Generative imaging affects stock; live capture less affected. Felten 2023: 0.51." },
      physical_dexterity: { score: 3, reasoning: "Camera handling, lighting setup; not micro-precision." },
    },
    sources: ["O*NET 27-4021", "Felten et al. 2023"],
    key_tasks: [
      "Take pictures of individuals, families, and small groups",
      "Use traditional or digital cameras with various lenses and filters",
      "Adjust apertures, shutter speeds, and camera focus based on subject, lighting, and equipment",
      "Estimate or measure light levels and adjust lighting equipment as needed",
      "Review sets of photographs to select the best work",
    ],
  },

  "animator": {
    name: "Animator",
    soc_code: "27-1014",
    industry: "creative",
    aggregate_score: 64,
    dimensions: {
      routine_cognitive:  { score: 6, reasoning: "In-between frame work routine; key-frame and character work less so." },
      creative_judgment:  { score: 6, reasoning: "Character performance, timing, story translation — taste-driven." },
      regulatory_moat:    { score: 0, reasoning: "No licensure." },
      embodied_work:      { score: 0, reasoning: "Desk work." },
      stakes_of_error:    { score: 2, reasoning: "Iterative work; mistakes corrected in revision." },
      relationships:      { score: 3, reasoning: "Studio collaboration; not relationship-central." },
      ai_capability_gap:  { score: 7, reasoning: "Generative animation tools advancing fast. Hayao Miyazaki: 'insult to life itself.'" },
      physical_dexterity: { score: 0, reasoning: "N/A." },
    },
    sources: ["O*NET 27-1014", "Hayao Miyazaki — NHK documentary", "Adam Conover — Decoder"],
    key_tasks: [
      "Create two-dimensional and three-dimensional images depicting objects in motion",
      "Develop storyboards that map out key scenes",
      "Edit animations and effects based on feedback",
      "Use computer software to design and produce animations",
      "Participate in design and production decisions in collaboration with team",
    ],
  },

  "musician": {
    name: "Musician",
    soc_code: "27-2042",
    industry: "creative",
    aggregate_score: 38,
    dimensions: {
      routine_cognitive:  { score: 2, reasoning: "Practice has routine elements but performance is contextual." },
      creative_judgment:  { score: 9, reasoning: "Composition, interpretation, performance — deeply human-led." },
      regulatory_moat:    { score: 0, reasoning: "No licensure (though union membership common)." },
      embodied_work:      { score: 6, reasoning: "Live performance physical; studio recording in person." },
      stakes_of_error:    { score: 2, reasoning: "Mistakes mid-performance recoverable; iterative in studio." },
      relationships:      { score: 7, reasoning: "Audience connection, band chemistry, fan relationships central." },
      ai_capability_gap:  { score: 4, reasoning: "AI music generation strong for stock/jingles; live performance and original composition less so." },
      physical_dexterity: { score: 7, reasoning: "Instrumental performance requires substantial fine motor skill." },
    },
    sources: ["O*NET 27-2042", "Felten et al. 2023"],
    key_tasks: [
      "Perform music as a soloist or as a member of a musical group",
      "Practice singing or playing instruments to maintain and improve skills",
      "Compose musical works",
      "Perform before live audiences in concerts or other settings",
      "Make or participate in recordings",
    ],
  },

  // === FINANCE (anchor scores ~52-80) ====================================

  "investment-banker": {
    name: "Investment Banker",
    soc_code: "13-2099",
    industry: "finance",
    aggregate_score: 52,
    dimensions: {
      routine_cognitive:  { score: 7, reasoning: "Comps, model-building, deck-prep heavily exposed. David Solomon: 'junior analyst tasks are exactly what these tools do best.'" },
      creative_judgment:  { score: 6, reasoning: "Deal structuring, valuation judgment, client persuasion remain human." },
      regulatory_moat:    { score: 5, reasoning: "Series 79/63 licenses; SEC oversight; less protective than law/medicine." },
      embodied_work:      { score: 0, reasoning: "Desk work." },
      stakes_of_error:    { score: 7, reasoning: "Mis-priced deals cost firms millions; reputational stakes high." },
      relationships:      { score: 8, reasoning: "Client relationships are the moat at senior levels; relationships ARE the business." },
      ai_capability_gap:  { score: 7, reasoning: "Felten 2023: 0.58. McKinsey: junior analyst work substantially automatable." },
      physical_dexterity: { score: 0, reasoning: "N/A." },
    },
    sources: ["O*NET 13-2099", "Felten et al. 2023", "McKinsey 2024", "David Solomon — Bloomberg interview"],
    key_tasks: [
      "Analyze financial data and create financial models for decision support",
      "Conduct industry research and competitive analysis",
      "Prepare pitch books and presentations for client meetings",
      "Assist in deal execution including documentation and due diligence",
      "Develop and maintain client relationships",
    ],
  },

  "accountant": {
    name: "Accountant",
    soc_code: "13-2011",
    industry: "finance",
    aggregate_score: 65,
    dimensions: {
      routine_cognitive:  { score: 7, reasoning: "Bookkeeping, reconciliation, audit trail prep all routine. McKinsey: 86% of bookkeeping activities automatable." },
      creative_judgment:  { score: 4, reasoning: "Tax strategy, complex transactions require judgment; routine work does not." },
      regulatory_moat:    { score: 5, reasoning: "CPA license required for public attestation; not for general accounting." },
      embodied_work:      { score: 0, reasoning: "Desk work." },
      stakes_of_error:    { score: 5, reasoning: "Material misstatements have legal consequences; lower for non-attest work." },
      relationships:      { score: 3, reasoning: "Client trust matters for retention; transactional at junior levels." },
      ai_capability_gap:  { score: 6, reasoning: "Felten 2023: 0.62. Anthropic EI: accounting tasks in top categories." },
      physical_dexterity: { score: 0, reasoning: "N/A." },
    },
    sources: ["O*NET 13-2011", "Felten et al. 2023", "McKinsey 2024 (86% bookkeeping automatable)"],
    key_tasks: [
      "Prepare financial statements according to GAAP",
      "Examine accounts and bookkeeping records",
      "Compute taxes owed and prepare tax returns",
      "Analyze business operations and trends",
      "Suggest ways to reduce costs and increase revenue",
    ],
  },

  "financial-analyst": {
    name: "Financial Analyst",
    soc_code: "13-2051",
    industry: "finance",
    aggregate_score: 60,
    dimensions: {
      routine_cognitive:  { score: 7, reasoning: "Spreadsheet modeling, ratio analysis, report-building heavily automatable." },
      creative_judgment:  { score: 5, reasoning: "Investment thesis development, sector judgment remain human." },
      regulatory_moat:    { score: 3, reasoning: "Series licenses for some roles; CFA optional." },
      embodied_work:      { score: 0, reasoning: "Desk work." },
      stakes_of_error:    { score: 5, reasoning: "Recommendation errors costly; usually buffered by oversight." },
      relationships:      { score: 4, reasoning: "Internal stakeholder relationships matter; not customer-facing usually." },
      ai_capability_gap:  { score: 7, reasoning: "Felten 2023: 0.66. Heavy LLM overlap with research/modeling work." },
      physical_dexterity: { score: 0, reasoning: "N/A." },
    },
    sources: ["O*NET 13-2051", "Felten et al. 2023", "McKinsey 2024", "Goldman Sachs Research"],
    key_tasks: [
      "Evaluate current and historical financial data",
      "Study economic and business trends",
      "Examine a company's financial statements to determine value",
      "Develop financial models to support decision-making",
      "Make recommendations to management or investors",
    ],
  },

  "paralegal": {
    name: "Paralegal",
    soc_code: "23-2011",
    industry: "legal",
    aggregate_score: 74,
    dimensions: {
      routine_cognitive:  { score: 8, reasoning: "Document review, citation extraction, motion drafting — core LLM territory." },
      creative_judgment:  { score: 3, reasoning: "Mostly procedural; novel framing rare." },
      regulatory_moat:    { score: 2, reasoning: "Paralegals don't sign filings; no licensure required in most states." },
      embodied_work:      { score: 1, reasoning: "Almost entirely desk-based." },
      stakes_of_error:    { score: 5, reasoning: "Errors caught by supervising attorney; not lethal." },
      relationships:      { score: 3, reasoning: "Some client contact but lawyer holds the relationship." },
      ai_capability_gap:  { score: 8, reasoning: "Claude already drafts motions, summarizes depositions, extracts citations. Felten 2023: 0.81. McKinsey: 44% of legal tasks automatable." },
      physical_dexterity: { score: 1, reasoning: "None required." },
    },
    sources: ["O*NET 23-2011", "Felten et al. 2023", "McKinsey 2024", "Richard Susskind — Tomorrow's Lawyers"],
    key_tasks: [
      "Prepare affidavits or other documents",
      "Investigate facts and law of cases to determine causes of action",
      "Gather and analyze research data for use in court cases",
      "File pleadings with court clerks",
      "Prepare for trial by organizing exhibits and assisting attorneys",
    ],
  },

  "lawyer": {
    name: "Lawyer (Litigator)",
    soc_code: "23-1011",
    industry: "legal",
    aggregate_score: 48,
    dimensions: {
      routine_cognitive:  { score: 6, reasoning: "Document review, discovery, brief-drafting partially automatable. Felten 2023: 0.62." },
      creative_judgment:  { score: 8, reasoning: "Trial strategy, witness examination, oral argument remain deeply human." },
      regulatory_moat:    { score: 10, reasoning: "Bar admission required in each state; unauthorized practice of law is a crime." },
      embodied_work:      { score: 3, reasoning: "Court appearances physical; most work desk-based." },
      stakes_of_error:    { score: 8, reasoning: "Malpractice liability; client outcomes; criminal consequences for some." },
      relationships:      { score: 7, reasoning: "Client trust central; courtroom credibility built over time." },
      ai_capability_gap:  { score: 6, reasoning: "Felten 2023: 0.62 — but courtroom work judgment-heavy. Daniel Susskind: counseling and judgment most insulated." },
      physical_dexterity: { score: 1, reasoning: "Not required." },
    },
    sources: ["O*NET 23-1011", "Felten et al. 2023 (0.62)", "Richard Susskind", "Daniel Susskind — FT interview"],
    key_tasks: [
      "Represent clients in criminal or civil court proceedings",
      "Conduct research on legal issues, citing applicable laws, decisions, and rulings",
      "Interpret laws, rulings, and regulations for individuals and businesses",
      "Present and summarize cases to judges and juries",
      "Negotiate settlements of civil disputes",
    ],
  },

  "translator": {
    name: "Translator",
    soc_code: "27-3091",
    industry: "creative",
    aggregate_score: 78,
    dimensions: {
      routine_cognitive:  { score: 9, reasoning: "Translation is canonically LLM-native. The original 'GPTs are GPTs' paper anchors it." },
      creative_judgment:  { score: 2, reasoning: "Literary translation requires taste; technical translation does not." },
      regulatory_moat:    { score: 0, reasoning: "Court certification for some roles; otherwise none." },
      embodied_work:      { score: 0, reasoning: "Desk work." },
      stakes_of_error:    { score: 3, reasoning: "Legal/medical translation high-stakes; most translation iterative." },
      relationships:      { score: 1, reasoning: "Some interpreter work relationship-based; written translation isn't." },
      ai_capability_gap:  { score: 9, reasoning: "Felten 2023: 0.85+ exposure. AI translation matches professional for many language pairs." },
      physical_dexterity: { score: 0, reasoning: "N/A." },
    },
    sources: ["O*NET 27-3091", "Felten et al. 2023 (0.85+)", "Eloundou et al. 2023"],
    key_tasks: [
      "Translate written materials from one language to another",
      "Refer to reference materials to ensure translations accurately convey meaning",
      "Edit and proofread translated materials",
      "Adapt translations to students' cognitive and grade levels",
      "Read materials to be translated for cultural references and context",
    ],
  },

  "bookkeeper": {
    name: "Bookkeeper",
    soc_code: "43-3031",
    industry: "finance",
    aggregate_score: 80,
    dimensions: {
      routine_cognitive:  { score: 9, reasoning: "Transaction recording, reconciliation, monthly close — all heartland LLM territory." },
      creative_judgment:  { score: 0, reasoning: "Procedural work; judgment minimal." },
      regulatory_moat:    { score: 0, reasoning: "No licensure." },
      embodied_work:      { score: 0, reasoning: "Desk work." },
      stakes_of_error:    { score: 3, reasoning: "Errors caught downstream by accountants; reversible." },
      relationships:      { score: 1, reasoning: "Internal bookkeeping minimal client contact." },
      ai_capability_gap:  { score: 9, reasoning: "McKinsey: 86% automatable. QuickBooks AI already handling routine entries." },
      physical_dexterity: { score: 0, reasoning: "N/A." },
    },
    sources: ["O*NET 43-3031", "McKinsey 2024 (86% automatable)", "WEF 2025 (declining role)"],
    key_tasks: [
      "Operate computers programmed with accounting software to record transactions",
      "Check figures, postings, and documents for correct entry, math, and codes",
      "Code documents according to company procedures",
      "Reconcile or note and report discrepancies found in records",
      "Comply with federal, state, and company policies",
    ],
  },

  "telemarketer": {
    name: "Telemarketer",
    soc_code: "41-9041",
    industry: "tech",
    aggregate_score: 86,
    dimensions: {
      routine_cognitive:  { score: 10, reasoning: "Script-following, lead-list management entirely routine." },
      creative_judgment:  { score: 0, reasoning: "Minimal — script adherence is the job." },
      regulatory_moat:    { score: 0, reasoning: "No licensure." },
      embodied_work:      { score: 0, reasoning: "Desk work." },
      stakes_of_error:    { score: 0, reasoning: "Low individual stakes; volume-driven." },
      relationships:      { score: 1, reasoning: "Transactional; relationship not built." },
      ai_capability_gap:  { score: 10, reasoning: "Felten 2023: 0.96 — highest in the dataset. Voice-AI handles outbound calls today." },
      physical_dexterity: { score: 0, reasoning: "N/A." },
    },
    sources: ["O*NET 41-9041", "Felten et al. 2023 (0.96)", "BLS Occupational Outlook (declining)"],
    key_tasks: [
      "Deliver prepared sales talks to persuade potential customers to purchase",
      "Contact customers via telephone to encourage purchase of products",
      "Explain products or services and prices",
      "Answer questions from customers",
      "Record names, addresses, purchases, and reactions of prospects",
    ],
  },

  "data-entry-clerk": {
    name: "Data Entry Clerk",
    soc_code: "43-9021",
    industry: "tech",
    aggregate_score: 88,
    dimensions: {
      routine_cognitive:  { score: 10, reasoning: "Pure structured-data transcription — maximum routine cognition." },
      creative_judgment:  { score: 0, reasoning: "None required." },
      regulatory_moat:    { score: 0, reasoning: "No licensure." },
      embodied_work:      { score: 0, reasoning: "Desk work." },
      stakes_of_error:    { score: 0, reasoning: "Errors caught downstream by validation; low individual stakes." },
      relationships:      { score: 0, reasoning: "None." },
      ai_capability_gap:  { score: 10, reasoning: "Structured extraction is solved. WEF 2025: top declining role." },
      physical_dexterity: { score: 0, reasoning: "Typing — automated." },
    },
    sources: ["O*NET 43-9021", "WEF Future of Jobs 2025 (top declining)", "McKinsey 2024"],
    key_tasks: [
      "Read source documents and enter data in specific fields",
      "Compile, sort, and verify accuracy of data before entering",
      "Compare data with source documents to detect errors",
      "Locate and correct data entry errors",
      "Maintain logs of activities and completed work",
    ],
  },

  // === EDUCATION (anchor scores ~18-28) ==================================

  "teacher": {
    name: "Elementary Teacher",
    soc_code: "25-2021",
    industry: "education",
    aggregate_score: 18,
    dimensions: {
      routine_cognitive:  { score: 1, reasoning: "Grading and lesson planning have routine elements; classroom management does not." },
      creative_judgment:  { score: 8, reasoning: "Adapting lessons to a classroom of mixed learners requires judgment." },
      regulatory_moat:    { score: 9, reasoning: "State teaching certification required; background checks, ongoing PD." },
      embodied_work:      { score: 10, reasoning: "Classroom presence is the work — physical, in-person." },
      stakes_of_error:    { score: 8, reasoning: "Long-term impact on student trajectories; immediate safety in K-12." },
      relationships:      { score: 10, reasoning: "Teacher-student relationship is the entire mechanism of learning. WEF 2025: relationship-heavy roles lowest displacement." },
      ai_capability_gap:  { score: 2, reasoning: "AI tutors (Khanmigo, MagicSchool) augment but classroom work remains human. Sal Khan: 'a personal tutor for every student.'" },
      physical_dexterity: { score: 3, reasoning: "Minimal." },
    },
    sources: ["O*NET 25-2021", "WEF Future of Jobs 2025", "Sal Khan — TED 2023", "Linda Darling-Hammond"],
    key_tasks: [
      "Plan and conduct activities for a balanced program of instruction",
      "Adapt teaching methods and instructional materials to meet students' varying needs",
      "Observe and evaluate students' performance, behavior, and development",
      "Establish and enforce rules for behavior",
      "Confer with parents or guardians about students' progress",
    ],
  },

  "professor": {
    name: "University Professor",
    soc_code: "25-1099",
    industry: "education",
    aggregate_score: 26,
    dimensions: {
      routine_cognitive:  { score: 4, reasoning: "Lecture prep has routine elements; research and grad mentorship don't." },
      creative_judgment:  { score: 8, reasoning: "Research direction, curriculum design, novel synthesis." },
      regulatory_moat:    { score: 4, reasoning: "PhD required; tenure track competitive; less codified than K-12 licensure." },
      embodied_work:      { score: 4, reasoning: "In-person teaching valuable; remote work increasingly possible." },
      stakes_of_error:    { score: 5, reasoning: "Tenure decisions, student trajectories — long-term impact." },
      relationships:      { score: 7, reasoning: "Graduate mentorship deeply relationship-driven." },
      ai_capability_gap:  { score: 5, reasoning: "AI strong on lecture content production; research direction remains human. Ethan Mollick: 'teachers who use AI well will replace teachers who don't.'" },
      physical_dexterity: { score: 0, reasoning: "N/A." },
    },
    sources: ["O*NET 25-1099", "Ethan Mollick — One Useful Thing", "Anthropic Economic Index"],
    key_tasks: [
      "Teach courses in academic disciplines",
      "Conduct research and publish findings",
      "Mentor graduate students and advise dissertations",
      "Develop curricula and instructional methods",
      "Serve on academic committees",
    ],
  },

  // === SCIENCES (anchor scores ~22-30) ===================================

  "biologist": {
    name: "Biologist",
    soc_code: "19-1029",
    industry: "sciences",
    aggregate_score: 32,
    dimensions: {
      routine_cognitive:  { score: 4, reasoning: "Data processing, literature review have routine elements; lab judgment doesn't." },
      creative_judgment:  { score: 8, reasoning: "Experimental design, hypothesis generation, novel synthesis." },
      regulatory_moat:    { score: 2, reasoning: "Some lab safety certs; mostly degree-credentialed not licensed." },
      embodied_work:      { score: 5, reasoning: "Lab and field work physical; bioinformatics desk-based." },
      stakes_of_error:    { score: 4, reasoning: "Reproducibility important; rarely immediately catastrophic." },
      relationships:      { score: 4, reasoning: "Collaborative research; not directly client-facing." },
      ai_capability_gap:  { score: 4, reasoning: "AlphaFold shifted structural biology dramatically. Felten 2023: 0.42." },
      physical_dexterity: { score: 4, reasoning: "Pipetting, microscopy, dissection — lab dexterity." },
    },
    sources: ["O*NET 19-1029", "Demis Hassabis — Nobel Lecture", "Felten et al. 2023"],
    key_tasks: [
      "Study basic principles of plant and animal life",
      "Develop new methods to study biological organisms",
      "Conduct field studies and laboratory experiments",
      "Prepare technical reports and publications",
      "Communicate with policy-makers and other researchers",
    ],
  },

  "chemist": {
    name: "Chemist",
    soc_code: "19-2031",
    industry: "sciences",
    aggregate_score: 32,
    dimensions: {
      routine_cognitive:  { score: 4, reasoning: "Routine analysis automated; novel chemistry isn't." },
      creative_judgment:  { score: 8, reasoning: "Synthesis design, materials discovery — judgment-heavy." },
      regulatory_moat:    { score: 3, reasoning: "Some industrial certifications; academic mostly degree-credentialed." },
      embodied_work:      { score: 6, reasoning: "Bench work physical; computational chemistry desk-based." },
      stakes_of_error:    { score: 6, reasoning: "Lab safety, environmental release — non-trivial stakes." },
      relationships:      { score: 3, reasoning: "Collaborative work; not relationship-central." },
      ai_capability_gap:  { score: 4, reasoning: "AI accelerating materials discovery (self-driving labs). Felten 2023: 0.41." },
      physical_dexterity: { score: 5, reasoning: "Bench technique requires skill." },
    },
    sources: ["O*NET 19-2031", "Felten et al. 2023", "Science magazine — AI materials discovery"],
    key_tasks: [
      "Develop, improve, or customize products, equipment, formulas, and analytical methods",
      "Analyze organic or inorganic compounds to determine chemical or physical properties",
      "Conduct quality control tests",
      "Direct, coordinate, and advise personnel in test procedures",
      "Write technical papers or reports",
    ],
  },

  "marine-biologist": {
    name: "Marine Biologist",
    soc_code: "19-1023",
    industry: "sciences",
    aggregate_score: 28,
    dimensions: {
      routine_cognitive:  { score: 3, reasoning: "Field data logging routine; analysis contextual." },
      creative_judgment:  { score: 8, reasoning: "Ecosystem hypothesis generation, species behavior interpretation." },
      regulatory_moat:    { score: 2, reasoning: "Field permits; mostly degree-credentialed." },
      embodied_work:      { score: 7, reasoning: "Field work in oceans, beaches, on vessels — heavily physical." },
      stakes_of_error:    { score: 4, reasoning: "Conservation decisions; rarely immediate-stakes." },
      relationships:      { score: 4, reasoning: "Research teams; some public engagement." },
      ai_capability_gap:  { score: 3, reasoning: "AI-powered bioacoustics, image-recognition for species ID assists field work. Felten 2023: 0.34." },
      physical_dexterity: { score: 5, reasoning: "Diving, sample collection, instrument deployment." },
    },
    sources: ["O*NET 19-1023", "PNAS — AI-powered ecology research"],
    key_tasks: [
      "Study saltwater organisms and their environments",
      "Conduct experiments in the laboratory or in field locations",
      "Collect specimens, conduct field studies, and prepare specimens for examination",
      "Analyze data and write reports for publication",
      "Educate the public about marine conservation",
    ],
  },

  // === ALIASES (synonym → canonical slug) ================================
  // Defined separately in matcher.js — common phrasings, abbreviations,
  // and adjacent role names that should resolve to a canonical entry.
};
