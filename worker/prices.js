// Saare rates ek jagah. Price badle to sirf ye file badlo.
// Token rates: USD per 1M tokens.

export const USD_TO_INR = 88;

export const PRICES = {
  'claude-haiku-5-5': { input: 0.10, output: 0.50, cache_read: 0.01, cache_write: 0.125 },
  'gemini-3.1-flash-lite': { input: 0.25, output: 1.50 },
};

// Gemini Google Search grounding: pehli 5,000 search/mahina free, phir $14 per 1,000.
export const GEMINI_FREE_SEARCHES = 5000;
export const SEARCH_USD_PER_1000 = 14;

const M = 1e6;
const round = (n) => Math.round(n * 1e8) / 1e8;

export function claudeCost(model, u) {
  const p = PRICES[model];
  const usd = ((u.input_tokens || 0) * p.input + (u.output_tokens || 0) * p.output
    + (u.cache_read_input_tokens || 0) * p.cache_read + (u.cache_creation_input_tokens || 0) * p.cache_write) / M;
  return round(usd);
}

// searchesBefore = is mahine pehle se kitni search ho chuki hain (free limit ke liye).
export function geminiCost(model, u, searches, searchesBefore) {
  const p = PRICES[model];
  const tokenUsd = (((u.promptTokenCount || 0) + (u.toolUsePromptTokenCount || 0)) * p.input
    + ((u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0)) * p.output) / M;
  const paid = Math.max(0, searchesBefore + searches - Math.max(GEMINI_FREE_SEARCHES, searchesBefore));
  return round(tokenUsd + paid * SEARCH_USD_PER_1000 / 1000);
}

export const toInr = (usd) => Math.round(usd * USD_TO_INR * 10000) / 10000;
