import { getEffectiveTier } from "@/lib/requireUser";
import { getCreditPolicy, getPeriodKey, getResetsAt } from "./creditPolicy";
import { creditLedger, type ICreditLedger } from "./creditLedger";
import { price } from "./creditPricer";
import {
  InsufficientCreditsError,
  type CreditReservation,
  type CreditTask,
  type UsageSnapshot,
} from "./types";

export type CreditRuntimeOptions = {
  now?: Date;
  ledger?: ICreditLedger;
};

export async function consumeCredits(
  userId: string,
  task: CreditTask,
  options: CreditRuntimeOptions = {},
): Promise<CreditReservation> {
  const now = options.now ?? new Date();
  const ledger = options.ledger ?? creditLedger;

  const tier = await getEffectiveTier(userId, now.getTime());
  const policy = getCreditPolicy(tier);
  const periodKey = getPeriodKey(tier, now);
  const { credits } = price(task);

  const applied = await ledger.consume(userId, periodKey, credits, policy.limit);
  if (applied === null) {
    const used = await ledger.getUsage(userId, periodKey);
    throw new InsufficientCreditsError(
      Math.max(0, policy.limit - used),
      policy.limit,
      getResetsAt(tier, now).toISOString(),
    );
  }

  return { userId, periodKey, credits };
}

export async function refundCredits(
  reservation: CreditReservation,
  options: CreditRuntimeOptions = {},
): Promise<number> {
  const ledger = options.ledger ?? creditLedger;
  return ledger.refund(
    reservation.userId,
    reservation.periodKey,
    reservation.credits,
  );
}

export async function refundCreditsQuietly(
  reservation: CreditReservation | undefined,
  options: CreditRuntimeOptions = {},
): Promise<void> {
  if (!reservation) {
    return;
  }
  try {
    await refundCredits(reservation, options);
  } catch (error) {
    console.error("Failed to refund credits:", error);
  }
}

export async function getUsageSnapshot(
  userId: string,
  options: CreditRuntimeOptions = {},
): Promise<UsageSnapshot> {
  const now = options.now ?? new Date();
  const ledger = options.ledger ?? creditLedger;

  const tier = await getEffectiveTier(userId, now.getTime());
  const policy = getCreditPolicy(tier);
  const periodKey = getPeriodKey(tier, now);
  const used = await ledger.getUsage(userId, periodKey);

  return {
    used,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - used),
    periodKey,
    resetsAt: getResetsAt(tier, now).toISOString(),
    period: policy.period,
  };
}
