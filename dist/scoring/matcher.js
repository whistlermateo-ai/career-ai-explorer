// =========================================================================
// CAREER AI EXPLORER — Tier 5 Fuzzy Matcher
// =========================================================================
//
// Resolves free-form user input to a canonical occupation slug in the dataset.
// Three-pass match:
//   1. Exact slug match (e.g. "software developer" → "software-developer")
//   2. Alias lookup (e.g. "programmer" → "software-developer")
//   3. Token overlap + Levenshtein fallback for typos and word-order variants
//
// Returns the slug string if a confident match is found, null otherwise.
// =========================================================================

(function () {
  // Common phrasings and adjacent role names mapped to canonical slugs.
  // Add entries here when a user-typed string fails to match cleanly.
  var ALIASES = {
    // Tech
    "software engineer": "software-developer",
    "software dev": "software-developer",
    "programmer": "software-developer",
    "coder": "software-developer",
    "developer": "software-developer",
    "web developer": "software-developer",
    "full stack developer": "software-developer",
    "backend developer": "software-developer",
    "frontend developer": "software-developer",
    "ml engineer": "ml-engineer",
    "machine learning engineer": "ml-engineer",
    "ai engineer": "ml-engineer",
    "ai researcher": "ml-engineer",
    "research engineer": "ml-engineer",
    "data scientist": "ml-engineer",
    "silicon engineer": "hardware-engineer",
    "chip designer": "hardware-engineer",
    "asic engineer": "hardware-engineer",
    "fpga engineer": "hardware-engineer",
    "computer hardware engineer": "hardware-engineer",
    "embedded engineer": "hardware-engineer",

    // Healthcare
    "physician": "doctor",
    "general practitioner": "doctor",
    "gp": "doctor",
    "internist": "doctor",
    "family doctor": "doctor",
    "primary care doctor": "doctor",
    "md": "doctor",
    "oncologist": "doctor",
    "cardiologist": "doctor",
    "neurologist": "doctor",
    "pediatrician": "doctor",
    "dermatologist": "doctor",
    "endocrinologist": "doctor",
    "gastroenterologist": "doctor",
    "rheumatologist": "doctor",
    "psychiatrist": "doctor",
    "obstetrician": "doctor",
    "gynecologist": "doctor",
    "ophthalmologist": "doctor",
    "anesthesiologist": "doctor",
    "radiologist": "doctor",
    "pathologist": "doctor",
    "neurosurgeon": "surgeon",
    "cardiac surgeon": "surgeon",
    "orthopedic surgeon": "surgeon",
    "plastic surgeon": "surgeon",
    "general surgeon": "surgeon",
    "trauma surgeon": "surgeon",
    "physical therapist": "therapist",
    "occupational therapist": "therapist",
    "speech therapist": "therapist",
    "marriage counselor": "therapist",
    "social worker": "therapist",
    "midwife": "nurse",
    "icu nurse": "nurse",
    "or nurse": "nurse",
    "school nurse": "nurse",
    "home health aide": "nurse",
    "rn": "nurse",
    "registered nurse": "nurse",
    "lpn": "nurse",
    "lvn": "nurse",
    "nurse practitioner": "nurse",
    "psychologist": "therapist",
    "psychotherapist": "therapist",
    "counselor": "therapist",
    "mental health counselor": "therapist",
    "clinical psychologist": "therapist",
    "vet": "veterinarian",
    "animal doctor": "veterinarian",
    "emt": "paramedic",
    "ambulance technician": "paramedic",
    "first responder": "paramedic",

    // Public safety + new additions
    "cop": "police-officer",
    "officer": "police-officer",
    "patrol officer": "police-officer",
    "detective": "police-officer",
    "state trooper": "police-officer",
    "sheriff": "police-officer",
    "fireman": "firefighter",
    "firewoman": "firefighter",
    "firefighter paramedic": "firefighter",
    "atc": "air-traffic-controller",
    "controller": "air-traffic-controller",

    // Healthcare specialties (additions)
    "eye doctor": "optometrist",
    "od": "optometrist",
    "hygienist": "dental-hygienist",
    "rdh": "dental-hygienist",
    "vet tech": "veterinary-technician",
    "veterinary nurse": "veterinary-technician",
    "slp": "speech-pathologist",
    "speech therapist": "speech-pathologist",
    "case worker": "social-worker",
    "child welfare worker": "social-worker",
    "msw": "social-worker",
    "lcsw": "social-worker",
    "lmsw": "social-worker",

    // Engineering disciplines
    "me": "mechanical-engineer",
    "mechanical": "mechanical-engineer",
    "ce": "civil-engineer",
    "structural engineer": "civil-engineer",
    "transportation engineer": "civil-engineer",
    "ee": "electrical-engineer",
    "power engineer": "electrical-engineer",
    "ae": "aerospace-engineer",
    "rocket scientist": "aerospace-engineer",

    // Tech / Creative (additions)
    "web developer": "web-designer",
    "ui designer": "web-designer",

    // Business
    "pm": "project-manager",
    "program manager": "project-manager",
    "scrum master": "project-manager",
    "hr": "hr-manager",
    "people ops": "hr-manager",
    "recruiter": "hr-manager",
    "talent acquisition": "hr-manager",
    "marketing": "marketing-manager",
    "brand manager": "marketing-manager",
    "growth marketer": "marketing-manager",
    "cmo": "marketing-manager",
    "sales rep": "sales-representative",
    "salesperson": "sales-representative",
    "account executive": "sales-representative",
    "account manager": "sales-representative",
    "ae": "sales-representative",  // careful: also aerospace, but sales is more common
    "bdr": "sales-representative",
    "sdr": "sales-representative",
    "realtor": "real-estate-agent",
    "real estate broker": "real-estate-agent",
    "real estate": "real-estate-agent",
    "insurance broker": "insurance-agent",
    "underwriter": "insurance-agent",
    "claims adjuster": "insurance-agent",

    // Culture / Service
    "museum curator": "curator",
    "art curator": "curator",
    "exhibit designer": "curator",
    "school librarian": "librarian",
    "research librarian": "librarian",
    "archivist": "librarian",
    "ranger": "park-ranger",
    "wildlife ranger": "park-ranger",
    "national park ranger": "park-ranger",
    "forest ranger": "park-ranger",
    "cook": "chef",
    "head chef": "chef",
    "sous chef": "chef",
    "line cook": "chef",
    "pastry chef": "chef",

    // Sciences (additions)
    "stats": "statistician",
    "data analyst": "statistician",
    "biostatistician": "statistician",
    "weather forecaster": "meteorologist",
    "weatherman": "meteorologist",
    "weatherwoman": "meteorologist",
    "broadcast meteorologist": "meteorologist",
    "outbreak investigator": "epidemiologist",
    "public health scientist": "epidemiologist",

    // Trades / Service (additions)
    "barber": "hairstylist",
    "stylist": "hairstylist",
    "cosmetologist": "hairstylist",
    "esthetician": "hairstylist",
    "trainer": "personal-trainer",
    "fitness coach": "personal-trainer",
    "fitness trainer": "personal-trainer",
    "gym trainer": "personal-trainer",
    "yoga instructor": "personal-trainer",
    "gc": "construction-manager",
    "general contractor": "construction-manager",
    "site manager": "construction-manager",
    "site supervisor": "construction-manager",
    "foreman": "construction-manager",

    // Trades
    "auto mechanic": "mechanic",
    "automotive technician": "mechanic",
    "car mechanic": "mechanic",
    "aircraft pilot": "pilot",
    "airline pilot": "pilot",
    "commercial pilot": "pilot",

    // Creative
    "designer": "graphic-designer",
    "graphic artist": "graphic-designer",
    "author": "writer",
    "novelist": "writer",
    "copywriter": "writer",
    "reporter": "journalist",
    "news reporter": "journalist",
    "war correspondent": "journalist",
    "investigative reporter": "journalist",
    "copy editor": "editor",
    "managing editor": "editor",
    "book editor": "editor",
    "photog": "photographer",
    "cinematographer": "photographer",
    "videographer": "photographer",
    "animation artist": "animator",
    "2d animator": "animator",
    "3d animator": "animator",
    "motion designer": "animator",
    "songwriter": "musician",
    "composer": "musician",
    "guitarist": "musician",
    "pianist": "musician",
    "vocalist": "musician",
    "translator": "translator",
    "interpreter": "translator",

    // Finance
    "ibanker": "investment-banker",
    "investment-banking analyst": "investment-banker",
    "wall street analyst": "investment-banker",
    "cpa": "accountant",
    "tax accountant": "accountant",
    "auditor": "accountant",
    "equity analyst": "financial-analyst",
    "buy-side analyst": "financial-analyst",
    "sell-side analyst": "financial-analyst",
    "credit analyst": "financial-analyst",

    // Legal
    "attorney": "lawyer",
    "litigator": "lawyer",
    "litigation attorney": "lawyer",
    "trial lawyer": "lawyer",
    "barrister": "lawyer",
    "solicitor": "lawyer",
    "legal assistant": "paralegal",
    "law clerk": "paralegal",

    // Admin / low-skill
    "telephone sales": "telemarketer",
    "cold caller": "telemarketer",
    "call center agent": "telemarketer",
    "data entry": "data-entry-clerk",
    "data clerk": "data-entry-clerk",
    "typist": "data-entry-clerk",

    // Education
    "elementary teacher": "teacher",
    "kindergarten teacher": "teacher",
    "primary school teacher": "teacher",
    "schoolteacher": "teacher",
    "high school teacher": "teacher",
    "university professor": "professor",
    "college professor": "professor",
    "academic": "professor",
    "lecturer": "professor",

    // Sciences
    "marine biologist": "marine-biologist",
    "oceanographer": "marine-biologist",
    "ecologist": "biologist",
    "geneticist": "biologist",
    "biochemist": "chemist",
    "research chemist": "chemist",
    "analytical chemist": "chemist",
  };

  function slugify(s) {
    return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function normalize(s) {
    return String(s || "").trim().toLowerCase().replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ");
  }

  // Damerau-Levenshtein distance (with transposition). Used as the last-pass
  // tiebreaker for typo tolerance.
  function dlDistance(a, b) {
    var m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    var d = [];
    for (var i = 0; i <= m; i++) { d[i] = [i]; }
    for (var j = 0; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + cost
        );
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
        }
      }
    }
    return d[m][n];
  }

  // Token-overlap score between two phrases (0-1).
  function tokenOverlap(a, b) {
    var ta = normalize(a).split(" ").filter(Boolean);
    var tb = normalize(b).split(" ").filter(Boolean);
    if (!ta.length || !tb.length) return 0;
    var matched = 0;
    for (var i = 0; i < ta.length; i++) {
      for (var j = 0; j < tb.length; j++) {
        if (ta[i] === tb[j]) { matched++; break; }
      }
    }
    return matched / Math.max(ta.length, tb.length);
  }

  function resolveOccupation(input) {
    var dataset = window.OCCUPATIONS_DATASET || {};
    var slugs = Object.keys(dataset);
    if (!slugs.length) return null;

    var normalizedInput = normalize(input);
    if (!normalizedInput) return null;

    // 1. Exact slug match
    var directSlug = slugify(input);
    if (dataset[directSlug]) return directSlug;

    // 2. Alias lookup (normalized form)
    if (ALIASES[normalizedInput]) return ALIASES[normalizedInput];
    // Also try the slug-form of the input as an alias key
    var aliasBySlug = ALIASES[slugify(input).replace(/-/g, " ")];
    if (aliasBySlug) return aliasBySlug;

    // 3. Display-name match (case-insensitive)
    for (var i = 0; i < slugs.length; i++) {
      var name = (dataset[slugs[i]].name || "").toLowerCase();
      if (name === normalizedInput) return slugs[i];
    }

    // 3.5. Single-token canonical match. If the input contains any individual
    //      token that exactly matches a canonical occupation slug or its core
    //      word (e.g. "underwater welder" contains "welder"), treat that as a
    //      strong match. Prevents false-negatives on multi-word phrasings.
    var inputTokens = normalizedInput.split(" ").filter(function (t) { return t.length >= 4; });
    for (var i = 0; i < inputTokens.length; i++) {
      var tok = inputTokens[i];
      // Look for an exact occupation-slug match (e.g. "welder")
      if (dataset[tok]) return tok;
      // Look for a single-word display name (e.g. token "writer" matches Writer)
      for (var j = 0; j < slugs.length; j++) {
        var dispName = (dataset[slugs[j]].name || "").toLowerCase();
        if (dispName === tok) return slugs[j];
        // Also match slug's first token (e.g. "marine biologist" → "marine")
        var slugFirst = slugs[j].split("-")[0];
        if (slugFirst === tok && slugFirst.length >= 5) return slugs[j];
      }
      // Look for an alias key that's a single word
      if (ALIASES[tok]) return ALIASES[tok];
    }

    // 4. Token-overlap + Levenshtein scoring across all candidates + aliases
    var allCandidates = [];
    for (var i = 0; i < slugs.length; i++) {
      allCandidates.push({ slug: slugs[i], text: dataset[slugs[i]].name });
      allCandidates.push({ slug: slugs[i], text: slugs[i].replace(/-/g, " ") });
    }
    for (var k in ALIASES) {
      if (dataset[ALIASES[k]]) {
        allCandidates.push({ slug: ALIASES[k], text: k });
      }
    }

    var best = null, bestScore = -1;
    for (var i = 0; i < allCandidates.length; i++) {
      var cand = allCandidates[i];
      var candNorm = normalize(cand.text);
      var overlap = tokenOverlap(normalizedInput, candNorm);
      var dist = dlDistance(normalizedInput, candNorm);
      var maxLen = Math.max(normalizedInput.length, candNorm.length, 1);
      var distScore = 1 - (dist / maxLen);
      var combined = (overlap * 0.65) + (distScore * 0.35);
      if (combined > bestScore) {
        bestScore = combined;
        best = cand.slug;
      }
    }

    // Require a minimum confidence to return a match — otherwise the caller
    // should show a "not in dataset" state rather than a wrong analysis.
    return bestScore >= 0.55 ? best : null;
  }

  function listAvailable() {
    var dataset = window.OCCUPATIONS_DATASET || {};
    return Object.keys(dataset).map(function (k) {
      return { slug: k, name: dataset[k].name, industry: dataset[k].industry };
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  window.OCCUPATION_MATCHER = {
    resolve: resolveOccupation,
    list: listAvailable,
    aliases: ALIASES,
  };
})();
