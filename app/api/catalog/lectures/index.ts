import type { VercelRequest, VercelResponse } from "@vercel/node";
import { insertLecture, listAllCreators, listLectures } from "../../_lib/db.js";
import type { LectureRecord } from "../../_lib/types.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const { q, category, chain, creatorId, courseId } = req.query;
    const lectures = await listLectures({
      q: typeof q === "string" ? q : undefined,
      category: typeof category === "string" ? category : undefined,
      chain: typeof chain === "string" ? chain : undefined,
      creatorId: typeof creatorId === "string" ? creatorId : undefined,
      courseId: typeof courseId === "string" ? courseId : undefined,
    });
    const creators = await listAllCreators();
    return res.status(200).json({ lectures, creators });
  }

  if (req.method === "POST") {
    const body = req.body as Omit<LectureRecord, "id" | "publishedAt">;
    const result = await insertLecture(body);
    if ("error" in result) return res.status(400).json({ error: result.error });
    return res.status(201).json({ lecture: result });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
