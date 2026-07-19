import type { VercelRequest, VercelResponse } from "@vercel/node";
import { deleteLectureRecord, getCreator, getLecture } from "../../../_lib/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;

  if (req.method === "GET") {
    const lecture = await getLecture(id);
    if (!lecture) return res.status(404).json({ error: "Lecture not found" });
    const creator = await getCreator(lecture.creatorId);
    return res.status(200).json({ lecture, creator });
  }

  /** The Shelby blobs themselves are deleted client-side (signed by the
   * creator's own wallet, see StudioContentPage) before this is called —
   * there's no server-held signing key anymore. This just removes the
   * catalog record, after checking the caller claims to be the publishing
   * creator. Note this ownership check is a plain string comparison against
   * a client-supplied field, not a verified signature — matches the
   * strength of the check the old Express server did, not a regression. */
  if (req.method === "DELETE") {
    const lecture = await getLecture(id);
    if (!lecture) return res.status(404).json({ error: "Lecture not found" });

    const { walletAddress } = (req.body ?? {}) as { walletAddress?: string };
    if (!walletAddress || walletAddress.toLowerCase() !== lecture.creatorId.toLowerCase()) {
      return res.status(403).json({ error: "Only the publishing creator can delete this lecture" });
    }

    await deleteLectureRecord(id);
    return res.status(200).json({ deleted: true });
  }

  res.setHeader("Allow", "GET, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
