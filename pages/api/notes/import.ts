import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

type ErrorResponse = {
  error: string;
};

type ImportSuccessResponse = {
  importedCount: number;
};

type ImportableNote = {
  id?: unknown;
  userId?: unknown;
  title?: unknown;
  content?: unknown;
};

const MAX_IMPORT_NOTES = 100;
const MAX_PAYLOAD_BYTES = 256 * 1024;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "256kb"
    }
  }
};

function isImportableNote(value: unknown): value is ImportableNote {
  return typeof value === "object" && value !== null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ImportSuccessResponse | ErrorResponse>
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const contentLengthHeader = req.headers["content-length"];
  const contentLength = typeof contentLengthHeader === "string" ? Number.parseInt(contentLengthHeader, 10) : NaN;

  if (Number.isFinite(contentLength) && contentLength > MAX_PAYLOAD_BYTES) {
    res.status(413).json({ error: "Payload too large" });
    return;
  }

  const payloadSize = Buffer.byteLength(JSON.stringify(req.body ?? null), "utf8");

  if (payloadSize > MAX_PAYLOAD_BYTES) {
    res.status(413).json({ error: "Payload too large" });
    return;
  }

  if (!Array.isArray(req.body)) {
    res.status(400).json({ error: "Expected a JSON array" });
    return;
  }

  if (req.body.length > MAX_IMPORT_NOTES) {
    res.status(400).json({ error: "Too many notes in import" });
    return;
  }

  const notesToCreate = [];

  for (const item of req.body) {
    if (!isImportableNote(item)) {
      res.status(400).json({ error: "Invalid note format" });
      return;
    }

    const { title, content } = item;

    if (typeof title !== "string" || !title.trim() || typeof content !== "string") {
      res.status(400).json({ error: "Each note must include a non-empty title and string content" });
      return;
    }

    notesToCreate.push({
      title: title.trim(),
      content,
      userId: session.user.id
    });
  }

  try {
    const result = await prisma.note.createMany({
      data: notesToCreate
    });

    res.status(201).json({ importedCount: result.count });
  } catch (error: unknown) {
    console.error("Failed to import notes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
