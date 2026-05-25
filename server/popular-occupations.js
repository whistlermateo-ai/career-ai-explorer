// What the overnight batch warmer pre-computes.
// Each item is [occupation, company?] — empty string for industry baseline.
// Tweak this list based on what students actually search.

// 50 most-searched occupations (industry baseline only)
export const POPULAR_OCCUPATIONS = [
  // Tech
  "Software Developer", "ML Engineer", "Data Scientist", "Cybersecurity Analyst",
  "Product Manager", "UX Designer", "Game Developer", "Robotics Engineer", "AI Researcher",
  // Healthcare
  "Doctor", "Nurse", "Surgeon", "Therapist", "Pharmacist", "Dentist", "Veterinarian",
  "Paramedic", "Radiologist",
  // Finance
  "Investment Banker", "Accountant", "Financial Analyst", "Actuary", "Trader", "Wealth Manager",
  // Legal
  "Lawyer", "Paralegal", "Judge", "Public Defender",
  // Creative
  "Graphic Designer", "Writer", "Photographer", "Filmmaker", "Architect", "Chef",
  "Fashion Designer", "Animator", "Musician",
  // Trades
  "Plumber", "Electrician", "Carpenter", "Mechanic", "Pilot",
  // Education
  "Teacher", "Professor", "School Counselor", "Athletic Coach",
  // Sciences
  "Biologist", "Chemist", "Physicist", "Marine Biologist", "Environmental Scientist",
];

// Top 30 (occupation, company) pairs students are likely to search
export const POPULAR_OCC_COMPANY = [
  ["Software Developer", "Apple"],
  ["Software Developer", "Google"],
  ["Software Developer", "Microsoft"],
  ["Software Developer", "Meta"],
  ["Software Developer", "Amazon"],
  ["Software Developer", "OpenAI"],
  ["Software Developer", "Anthropic"],
  ["ML Engineer", "Google"],
  ["ML Engineer", "OpenAI"],
  ["ML Engineer", "Anthropic"],
  ["Data Scientist", "Netflix"],
  ["Data Scientist", "Amazon"],
  ["Product Manager", "Apple"],
  ["Product Manager", "Google"],
  ["UX Designer", "Apple"],
  ["Doctor", "Mayo Clinic"],
  ["Nurse", "Kaiser Permanente"],
  ["Investment Banker", "Goldman Sachs"],
  ["Investment Banker", "JPMorgan"],
  ["Financial Analyst", "BlackRock"],
  ["Lawyer", "Skadden"],
  ["Lawyer", "Kirkland & Ellis"],
  ["Architect", "Foster + Partners"],
  ["Filmmaker", "A24"],
  ["Filmmaker", "Netflix"],
  ["Graphic Designer", "Pentagram"],
  ["Chef", "Michelin restaurant"],
  ["Teacher", "Public school"],
  ["Cybersecurity Analyst", "CrowdStrike"],
  ["AI Researcher", "DeepMind"],
];
