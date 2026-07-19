import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCreator, listLectures } from "../../_lib/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = req.query.id as string;
  const creator = await getCreator(id);
  if (!creator) return res.status(404).json({ error: "Creator not found" });
  const lectures = await listLectures({ creatorId: id });
  return res.status(200).json({ creator, lectures });
}
