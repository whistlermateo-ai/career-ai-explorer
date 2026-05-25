// Anthropic provider: original Claude path, extracted from index.js for clean routing.
// Costs money but produces the highest-quality grounded analyses.

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, REFERENCE_DATA, ANALYZE_CAREER_TOOL } from "../prompt.js";

let _client = null;
function client() {
  if (!_client) _client = new Anthropic();
  return _client;
}

export async function analyze({ occupation, company, groundingContext, newsContext, news, anthropic }) {
  const startedAt = Date.now();
  const c = anthropic || client();

  const baseRequest = company
    ? `Analyze the AI displacement risk for: **${occupation}** at **${company}**.\n\nProduce both an industry baseline and a company-adjusted final score. Include the company_signals object.`
    : `Analyze the AI displacement risk for: **${occupation}**.\n\nNo company specified — produce the industry baseline only. Do NOT include the company_signals object. The 'company' field should be an empty string.`;

  let userMessage = baseRequest;
  if (newsContext) userMessage = `${newsContext}\n---\n\n${userMessage}`;
  if (groundingContext) userMessage = `${groundingContext}${userMessage}`;

  const response = await c.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      { type: "text", text: REFERENCE_DATA, cache_control: { type: "ephemeral" } },
    ],
    tools: [ANALYZE_CAREER_TOOL],
    tool_choice: { type: "tool", name: "analyze_career" },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolUseBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolUseBlock) throw new Error("Model did not return structured output");

  return {
    ...toolUseBlock.input,
    _provider: "anthropic",
    _provider_cost: "paid",
    _meta: {
      elapsed_ms: Date.now() - startedAt,
      model: response.model,
      news_cached: news ? !!news._cached : false,
      news_headlines_count: news?.headlines?.length || 0,
      usage: {
        input_tokens: response.usage.input_tokens,
        cache_creation_input_tokens: response.usage.cache_creation_input_tokens,
        cache_read_input_tokens: response.usage.cache_read_input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    },
  };
}
