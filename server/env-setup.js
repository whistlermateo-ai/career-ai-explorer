// Loads .env values, overriding any pre-existing env vars (including empty ones).
// Must be imported BEFORE any module that instantiates clients depending on env
// (e.g. before news.js which does `new Anthropic()` at module load time).
//
// Why override: some shell environments have ANTHROPIC_API_KEY=""
// (empty string) preset, which dotenv refuses to overwrite by default.

import dotenv from "dotenv";
dotenv.config({ override: true });
