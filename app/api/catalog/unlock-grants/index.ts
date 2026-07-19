import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCreator, getLecture, grantExistsForTx, insertUnlockGrant, listUnlockGrants } from "../../_lib/db.js";
import { verifyOnChainTransfer } from "../../_lib/paymentVerify.js";
import type { UnlockGrantRecord } from "../../_lib/types.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const { walletAddress, lectureId, creatorId } = req.query;
    const grants = await listUnlockGrants({
      walletAddress: typeof walletAddress === "string" ? walletAddress : undefined,
      lectureId: typeof lectureId === "string" ? lectureId : undefined,
      creatorId: typeof creatorId === "string" ? creatorId : undefined,
    });
    return res.status(200).json({ grants });
  }

  /** Verifies the claimed transaction really happened on-chain before
   * granting access — without this, anyone could POST a fabricated or
   * reused txHash and unlock any paid lecture for free. This is why this
   * route has to stay a real server call and can't move to the browser. */
  if (req.method === "POST") {
    const grant = req.body as UnlockGrantRecord;

    if (await grantExistsForTx(grant.txHash)) {
      return res.status(409).json({ error: "This transaction has already been used to unlock a lecture" });
    }

    const lecture = await getLecture(grant.lectureId);
    if (!lecture) return res.status(404).json({ error: "Lecture not found" });
    const creator = await getCreator(lecture.creatorId);
    const recipient = creator?.payoutAddress[grant.chain];
    if (!recipient) return res.status(400).json({ error: "Creator has no payout address on this chain" });

    const verified = await verifyOnChainTransfer(grant.chain, { txHash: grant.txHash, sender: grant.walletAddress, recipient });
    if (!verified) return res.status(402).json({ error: "Could not verify this payment transaction on-chain" });

    await insertUnlockGrant(grant);
    return res.status(201).json({ grant });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
