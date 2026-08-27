import type { NextApiRequest } from "next";
import type { User } from "@supabase/supabase-js";
import { supabaseServerClient } from "@/pages/api/supaBaseServer";

const TIER_RANK = {
  free: 0,
  pro: 1,
  enterprise: 2,
} as const;

type Tier = keyof typeof TIER_RANK;

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; status: 401; error: string };

export type EntitlementResult =
  | { ok: true; tier: string }
  | { ok: false; status: 403; error: string; tier: string };

function getBearerToken(req: NextApiRequest): string | null {
  const raw = req.headers.authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const match = value?.match(/^Bearer\s+(\S+)/i);
  return match?.[1] ?? null;
}

export async function requireUser(req: NextApiRequest): Promise<AuthResult> {
  const token = getBearerToken(req);
  if (!token) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const {
    data: { user },
    error,
  } = await supabaseServerClient.auth.getUser(token);

  if (error || !user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true, user };
}

export async function requireEntitlement(
  userId: string,
  minTier: Exclude<Tier, "free"> = "pro",
): Promise<EntitlementResult> {
  const { data, error } = await supabaseServerClient
    .from("user_entitlements")
    .select("tier, tier_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  let tier = data?.tier ?? "free";
  if (
    data?.tier_expires_at &&
    Date.parse(data.tier_expires_at) < Date.now()
  ) {
    tier = "free";
  }

  const userRank = TIER_RANK[tier as Tier] ?? TIER_RANK.free;
  if (userRank < TIER_RANK[minTier]) {
    return {
      ok: false,
      status: 403,
      error: "This feature requires a Pro plan",
      tier,
    };
  }

  return { ok: true, tier };
}
