import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import type { Note } from "@prisma/client";

import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

type ErrorResponse = {
  error: string;
};

type NoteResponse = Note | ErrorResponse;

type UpdateNoteBody = {
  title?: unknown;
  content?: unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NoteResponse | null>
): Promise<void> {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.query;

  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid note id" });
    return;
  }

  if (req.method !== "PUT" && req.method !== "PATCH" && req.method !== "DELETE") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const note = await prisma.note.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!note) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    if (req.method === "DELETE") {
      await prisma.note.deleteMany({
        where: {
          id,
          userId: session.user.id
        }
      });

      res.status(204).end();
      return;
    }
  } catch (error: unknown) {
    console.error("Failed to load note:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  const { title, content } = req.body as UpdateNoteBody;
  const data: { title?: string; content?: string } = {};

  if (typeof title === "string") {
    data.title = title;
  }

  if (typeof content === "string") {
    data.content = content;
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "Title or content is required" });
    return;
  }

  try {
    const updatedResult = await prisma.note.updateMany({
      where: {
        id,
        userId: session.user.id
      },
      data
    });

    if (updatedResult.count === 0) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    const updatedNote = await prisma.note.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!updatedNote) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    res.status(200).json(updatedNote);
  } catch (error: unknown) {
    console.error("Failed to update note:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
