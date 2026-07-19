import type { VercelRequest, VercelResponse } from "@vercel/node";
import { upsertCreator } from "../../_lib/db.js";
import type { Creator } from "../../_lib/types.js";

/** Payout addresses are financial routing info — an anonymous upsert can't
 * silently redirect an existing creator's already-set payout address to a
 * different one (that would let anyone reroute a creator's future earnings
 * just by knowing their public creatorId, which is their wallet address).
 * New chains can still be added; profile fields (name, avatar, etc.) stay
 * freely editable. Enforced in db.ts's upsertCreator. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as Creator;
  const result = await upsertCreator(body);
  if ("error" in result) return res.status(409).json({ error: result.error });
  return res.status(201).json({ creator: result });
}
