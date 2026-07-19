import type { VercelRequest, VercelResponse } from "@vercel/node";
import { patchLectureExpiration } from "../../../_lib/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = req.query.id as string;
  const { expirationMicros } = req.body as { expirationMicros: number };
  const lecture = await patchLectureExpiration(id, expirationMicros);
  if (!lecture) return res.status(404).json({ error: "Lecture not found" });
  return res.status(200).json({ lecture });
}
