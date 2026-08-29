import type { CreditPeriod } from "./types";

export type CreditPolicy = {
  limit: number;
  period: CreditPeriod;
  contextWindow: number;
};

export const FREE: CreditPolicy = { limit: 20, period: "day", contextWindow: 8_000 };
export const PRO: CreditPolicy = { limit: 2500, period: "month", contextWindow: 40_000 };

const POLICIES: Record<string, CreditPolicy> = {
  free: FREE,
  pro: PRO,
  enterprise: PRO,
};

export function getCreditPolicy(tier: string): CreditPolicy {
  return POLICIES[tier] ?? FREE;
}

export function getContextWindow(tier: string): number {
  return getCreditPolicy(tier).contextWindow;
}

export function getPeriodKey(tier: string, now: Date = new Date()): string {
  const iso = now.toISOString();
  return getCreditPolicy(tier).period === "day"
    ? iso.slice(0, 10)
    : iso.slice(0, 7);
}

export function getResetsAt(tier: string, now: Date = new Date()): Date {
  if (getCreditPolicy(tier).period === "day") {
    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
      ),
    );
  }

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
}
