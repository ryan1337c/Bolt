import { bandFor, measureText } from "./contextMeter";
import type { ContextBand, CreditTask, PriceResult } from "./types";

const CREDITS_BY_BAND: Record<ContextBand, number> = {
  standard: 1,
  extended: 2,
  long: 3,
};

const IMAGE_CREDITS = 8;
const RESUME_CREDITS = 10;

function priceByBand(textParts: string[]): PriceResult {
  const characters = measureText(textParts);
  const band = bandFor(characters);
  return { credits: CREDITS_BY_BAND[band], band, characters };
}

function priceResume(textParts: string[]): PriceResult {
  const characters = measureText(textParts);
  bandFor(characters);
  return { credits: RESUME_CREDITS, band: null, characters };
}

const PRICING_RULES: {
  [K in CreditTask["kind"]]: (task: Extract<CreditTask, { kind: K }>) => PriceResult;
} = {
  chat: (task) => priceByBand(task.textParts),
  quiz: (task) => priceByBand(task.textParts),
  flashcards: (task) => priceByBand(task.textParts),
  image: () => ({ credits: IMAGE_CREDITS, band: null, characters: 0 }),
  resume: (task) => priceResume(task.textParts),
};

export function price(task: CreditTask): PriceResult {
  const rule = PRICING_RULES[task.kind] as (value: CreditTask) => PriceResult;
  return rule(task);
}
