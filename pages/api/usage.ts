import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/requireUser";
import { getUsageSnapshot, type UsageSnapshot } from "@/lib/credits";

type ResponseData = UsageSnapshot | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireUser(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    const snapshot = await getUsageSnapshot(auth.user.id);
    return res.status(200).json(snapshot);
  } catch (error) {
    console.error("Usage API error:", error);
    return res.status(500).json({ error: "Unable to load usage" });
  }
}
