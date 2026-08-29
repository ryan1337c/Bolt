import type { CreditPeriod, UsageSnapshot } from "./types";

export const BILLING_SETTINGS_HREF = "/pages/home?settings=billing";

export type InsufficientCreditsBody = {
  error: string;
  code: "INSUFFICIENT_CREDITS";
  remaining: number;
  limit: number;
  resetsAt: string;
};

export function formatCreditReset(
  resetsAt: string,
  period: CreditPeriod,
): string {
  const date = new Date(resetsAt);
  if (Number.isNaN(date.getTime())) {
    return period === "day" ? "today 00:00 UTC" : "1st of next month UTC";
  }

  if (period === "day") {
    return "today 00:00 UTC";
  }

  const month = date.toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  return `1st of ${month} UTC`;
}

export function creditPeriodForTier(
  tier: string | null | undefined,
): CreditPeriod {
  return tier === "pro" || tier === "enterprise" ? "month" : "day";
}

export function shouldOfferCreditUpgrade(
  tier: string | null | undefined,
): boolean {
  return tier === "free";
}

export function getInsufficientCreditsInfo(
  status: number,
  body: unknown,
): InsufficientCreditsBody | null {
  if (status !== 402 || !body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  if (record.code !== "INSUFFICIENT_CREDITS") {
    return null;
  }

  return {
    error:
      typeof record.error === "string" ? record.error : "Insufficient credits",
    code: "INSUFFICIENT_CREDITS",
    remaining: typeof record.remaining === "number" ? record.remaining : 0,
    limit: typeof record.limit === "number" ? record.limit : 0,
    resetsAt: typeof record.resetsAt === "string" ? record.resetsAt : "",
  };
}

export function formatInsufficientCreditsMessage(
  info: InsufficientCreditsBody,
  tier: string | null | undefined,
): string {
  const period = creditPeriodForTier(tier);
  const reset = formatCreditReset(info.resetsAt, period);

  if (period === "day") {
    return `You've used all ${info.limit} free credits for today. Upgrade to Pro for a higher monthly limit. Resets ${reset}.`;
  }

  return `Monthly cap reached, resets ${reset}.`;
}

export type ContextTooLongBody = {
  error: string;
  characters: number;
  max: number;
};

export function getContextTooLongInfo(
  status: number,
  body: unknown,
): ContextTooLongBody | null {
  if (status !== 400 || !body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  if (typeof record.max !== "number" || typeof record.characters !== "number") {
    return null;
  }

  return {
    error:
      typeof record.error === "string"
        ? record.error
        : `Context exceeds the ${record.max} character limit`,
    characters: record.characters,
    max: record.max,
  };
}

export function formatContextTooLongMessage(
  info: ContextTooLongBody,
  tier: string | null | undefined,
): string {
  const max = info.max.toLocaleString("en-US");
  const base = `This message is too long for your plan (max ${max} characters).`;

  if (shouldOfferCreditUpgrade(tier)) {
    return `${base} Upgrade to Pro for a larger context window.`;
  }

  return base;
}

export async function fetchUsageSnapshot(
  accessToken: string,
): Promise<UsageSnapshot> {
  const response = await fetch("/api/usage", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Unable to load usage";
    throw new Error(message);
  }

  return data as UsageSnapshot;
}
